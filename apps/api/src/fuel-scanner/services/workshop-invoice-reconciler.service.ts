// Fichier : apps/api/src/fuel-scanner/services/workshop-invoice-reconciler.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { ALGERIA_FISCAL_RATES } from '@docteurflotte/contracts';

export interface InvoiceLineItem {
  designation: string;
  quantity: number;
  unitPriceDzd: number;
  totalDzd: number;
}

export interface InvoiceReconciliationInput {
  invoiceNumber?: string;
  vendorName?: string;
  lineItems: InvoiceLineItem[];
  claimedTotalDzd: number;
  claimedDiscountDzd?: number;
  stampDutyDzd?: number;
}

export type WinningScenarioType =
  | 'SCENARIO_1_BRUT_HT'
  | 'SCENARIO_2_TTC_19PCT'
  | 'SCENARIO_3_TIMBRE_ET_REMISE'
  | 'AUCUN_SCENARIO_VALIDE';

export interface InvoiceReconciliationResult {
  status: 'RECONCILIE_AUTOMATIQUE' | 'RELECTURE_MANUELLE_REQUISE';
  winningScenario: WinningScenarioType;
  linesSumDzd: number;
  claimedTotalDzd: number;
  discrepancyDzd: number;
  toleranceAppliedDzd: number;
  scenariosComparison: {
    deltaScenario1BrutHtDzd: number;
    deltaScenario2Ttc19PctDzd: number;
    deltaScenario3TimbreRemiseDzd: number;
  };
  details: {
    appliedVatRatePct: number;
    appliedStampDutyDzd: number;
    appliedDiscountDzd: number;
    mathematicalCheckPassed: boolean;
  };
  explanation: string;
}

@Injectable()
export class WorkshopInvoiceReconcilerService {
  private readonly logger = new Logger(WorkshopInvoiceReconcilerService.name);

  // Tolérance financière maximale de 5.00 DZD pour absorber les arrondis de caisse en Algérie
  public static readonly TOLERANCE_DZD = 5.0;
  public static readonly ALGERIAN_VAT_RATE = ALGERIA_FISCAL_RATES.STANDARD_VAT_RATE; // Taux officiel DGI (19%)

  /**
   * Convertit un montant en centimes entiers pour immuniser les calculs
   * contre les erreurs d'arrondis en virgule flottante JavaScript (ex: 0.1 + 0.2).
   */
  private toCents(amount: number): number {
    return Math.round(Number(amount || 0) * 100);
  }

  /**
   * Calcule le droit de timbre fiscal algérien officiel (DGI) pour paiement en espèces :
   * 1% du montant, minimum 5 DZD, plafonné à 2 500 DZD (arrondi au dinar supérieur).
   */
  public calculateOfficialAlgerianStampDuty(totalHtDzd: number): number {
    if (totalHtDzd <= 0) return 0;
    const rawStamp = totalHtDzd * 0.01;
    const boundedStamp = Math.min(Math.max(rawStamp, 5), 2500);
    return Math.ceil(boundedStamp);
  }

  /**
   * Exécute la Matrice de Réconciliation Déterministe à 3 Scénarios.
   */
  reconcile(input: InvoiceReconciliationInput): InvoiceReconciliationResult {
    const toleranceCents = this.toCents(WorkshopInvoiceReconcilerService.TOLERANCE_DZD);

    // 1. Somme déterministe des lignes en centimes
    let sumLinesCents = 0;
    for (const item of input.lineItems) {
      sumLinesCents += this.toCents(item.totalDzd);
    }

    const claimedTotalCents = this.toCents(input.claimedTotalDzd);
    const discountCents = this.toCents(input.claimedDiscountDzd || 0);

    // Droit de timbre : fourni explicitement ou calculé selon le barème officiel DGI
    const stampCents = input.stampDutyDzd !== undefined
      ? this.toCents(input.stampDutyDzd)
      : this.toCents(this.calculateOfficialAlgerianStampDuty(sumLinesCents / 100));

    // Scénario 1 : Égalité brute HT (bons de caisse sans TVA)
    const delta1Cents = Math.abs(sumLinesCents - claimedTotalCents);

    // Scénario 2 : Soumission avec TVA algérienne 19%
    const expectedTtcCents = Math.round(sumLinesCents * (1 + WorkshopInvoiceReconcilerService.ALGERIAN_VAT_RATE));
    const delta2Cents = Math.abs(expectedTtcCents - claimedTotalCents);

    // Scénario 3 : Ajustement avec Droit de Timbre fiscal et/ou Remise de bas de page
    const adjustedSumCents = sumLinesCents + stampCents - discountCents;
    const delta3Cents = Math.abs(adjustedSumCents - claimedTotalCents);

    const delta1Dzd = delta1Cents / 100;
    const delta2Dzd = delta2Cents / 100;
    const delta3Dzd = delta3Cents / 100;

    let winningScenario: WinningScenarioType = 'AUCUN_SCENARIO_VALIDE';
    let minDeltaCents = Math.min(delta1Cents, delta2Cents, delta3Cents);

    if (delta1Cents <= toleranceCents) {
      winningScenario = 'SCENARIO_1_BRUT_HT';
      minDeltaCents = delta1Cents;
    } else if (delta2Cents <= toleranceCents) {
      winningScenario = 'SCENARIO_2_TTC_19PCT';
      minDeltaCents = delta2Cents;
    } else if (delta3Cents <= toleranceCents) {
      winningScenario = 'SCENARIO_3_TIMBRE_ET_REMISE';
      minDeltaCents = delta3Cents;
    }

    const isReconciled = winningScenario !== 'AUCUN_SCENARIO_VALIDE';
    const status: InvoiceReconciliationResult['status'] = isReconciled
      ? 'RECONCILIE_AUTOMATIQUE'
      : 'RELECTURE_MANUELLE_REQUISE';

    let explanation: string;
    if (winningScenario === 'SCENARIO_1_BRUT_HT') {
      explanation = `Réconciliation validée : la somme exacte des lignes (${(sumLinesCents / 100).toFixed(2)} DZD) correspond au total réclamé (${input.claimedTotalDzd.toFixed(2)} DZD) à ${delta1Dzd.toFixed(2)} DZD près.`;
    } else if (winningScenario === 'SCENARIO_2_TTC_19PCT') {
      explanation = `Réconciliation validée avec TVA 19% : le montant HT (${(sumLinesCents / 100).toFixed(2)} DZD) majoré de la TVA 19% (${(expectedTtcCents / 100).toFixed(2)} DZD) correspond au total TTC réclamé (${input.claimedTotalDzd.toFixed(2)} DZD) à ${delta2Dzd.toFixed(2)} DZD près.`;
    } else if (winningScenario === 'SCENARIO_3_TIMBRE_ET_REMISE') {
      explanation = `Réconciliation validée avec Timbre/Remise : la somme des lignes (${(sumLinesCents / 100).toFixed(2)} DZD) avec timbre fiscal (${(stampCents / 100).toFixed(2)} DZD) et remise (${(discountCents / 100).toFixed(2)} DZD) concorde à ${delta3Dzd.toFixed(2)} DZD près.`;
    } else {
      explanation = `Divergence arithmétique constatée (> ${WorkshopInvoiceReconcilerService.TOLERANCE_DZD} DZD sur tous les scénarios). Écart HT: ${delta1Dzd.toFixed(2)} DZD, Écart TTC 19%: ${delta2Dzd.toFixed(2)} DZD, Écart Timbre/Remise: ${delta3Dzd.toFixed(2)} DZD. Facture transférée en RELECTURE_MANUELLE_REQUISE.`;
    }

    return {
      status,
      winningScenario,
      linesSumDzd: sumLinesCents / 100,
      claimedTotalDzd: input.claimedTotalDzd,
      discrepancyDzd: minDeltaCents / 100,
      toleranceAppliedDzd: WorkshopInvoiceReconcilerService.TOLERANCE_DZD,
      scenariosComparison: {
        deltaScenario1BrutHtDzd: delta1Dzd,
        deltaScenario2Ttc19PctDzd: delta2Dzd,
        deltaScenario3TimbreRemiseDzd: delta3Dzd,
      },
      details: {
        appliedVatRatePct: WorkshopInvoiceReconcilerService.ALGERIAN_VAT_RATE * 100,
        appliedStampDutyDzd: stampCents / 100,
        appliedDiscountDzd: discountCents / 100,
        mathematicalCheckPassed: isReconciled,
      },
      explanation,
    };
  }
}

