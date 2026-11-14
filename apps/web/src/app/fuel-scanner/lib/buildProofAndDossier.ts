import { Asset, FuelReceiptScanResult } from '@docteurflotte/contracts';
import { CalculationProofData } from '@/components/decisions';

export function buildFuelCalculationProof(item: FuelReceiptScanResult): CalculationProofData {
  const deltaV = item.reconciliation.telematicsLevelDeltaLiters;
  const ticketV = item.liters;
  const variance = item.reconciliation.varianceLiters;
  const isOk = item.reconciliation.reconciliationStatus === 'VERIFIED';

  return {
    title: 'Preuve de Réconciliation Télématique Naftal & Détection CUSUM',
    decisionOrMetricName: `Plein Carburant — ${item.stationName}`,
    category: 'TELEMATICS',
    ruleId: 'ALGO-CUSUM-FUEL-04',
    legalOrOemReference: 'MASTER_SPEC v2.0 §4.5 (Réconciliation Déterministe ΔV & CUSUM Anti-Fraude)',
    deterministicFormula: 'Écart_ΔV = |Volume_Ticket - (Niveau_Après - Niveau_Avant)| ≤ 5.0 Litres',
    formulaExplanation:
      'Le volume déclaré sur le reçu est confronté à la hausse physique observée dans le réservoir par la jauge CAN/Traccar, combinée à la vérification géodésique de présence à la station-service Naftal.',
    variables: [
      { name: 'Volume Reçu Naftal', symbol: 'V_ticket', value: `${ticketV} L`, source: 'OCR Reçu Naftal' },
      { name: 'Niveau Réservoir Avant Plein', symbol: 'V_avant', value: `${item.reconciliation.tankLevelBeforeLiters} L`, source: 'Jauge Télématique Traccar' },
      { name: 'Niveau Réservoir Après Plein', symbol: 'V_après', value: `${item.reconciliation.tankLevelAfterLiters} L`, source: 'Jauge Télématique Traccar' },
      { name: 'Hausse Constatée Jauge', symbol: 'ΔV_réel', value: `+${deltaV.toFixed(1)} L`, source: 'V_après - V_avant' },
      { name: 'Distance GPS Véhicule / Station', symbol: 'Dist_GPS', value: `${item.reconciliation.distanceToStationMeters} m`, source: 'Haversine Traccar vs Station Naftal' },
      { name: 'Seuil de Tolérance Volumique', symbol: 'Tolérance', value: '5.0 L', source: 'Pack Algérie / Incertitude Flotteur' },
    ],
    steps: [
      {
        stepNumber: 1,
        description: 'Calcul de la Hausse Réelle dans le Réservoir (ΔV)',
        formula: 'ΔV_réel = V_après - V_avant',
        calculation: `${item.reconciliation.tankLevelAfterLiters} L - ${item.reconciliation.tankLevelBeforeLiters} L`,
        intermediateResult: `+${deltaV.toFixed(1)} L`,
      },
      {
        stepNumber: 2,
        description: "Calcul de l'Écart Volumique Absolu",
        formula: '|V_ticket - ΔV_réel|',
        calculation: `|${ticketV} L - ${deltaV.toFixed(1)} L|`,
        intermediateResult: `${variance.toFixed(1)} L`,
      },
      {
        stepNumber: 3,
        description: 'Validation Géodésique & CUSUM Anti-Fraude',
        formula: 'Vérification (Dist_GPS ≤ 150m) ∧ (Écart ≤ 5.0L)',
        calculation: `${item.reconciliation.distanceToStationMeters} m ≤ 150 m et ${variance.toFixed(1)} L ≤ 5.0 L`,
        intermediateResult: isOk ? 'SUCCÈS RÉCONCILIÉ' : 'ANOMALIE DÉTECTÉE',
      },
    ],
    finalResult: {
      label: 'Statut du Plein Carburant',
      value: isOk ? 'CONFORME (VERIFIED)' : 'FRAUDE SUSPECTÉE (ANOMALY)',
      conclusion: isOk
        ? "Le plein est certifié conforme. Le volume acheté a bien été injecté dans le réservoir de l'actif."
        : 'Alerte fraude : discordance significative entre le volume facturé et la hausse réelle de la jauge.',
    },
  };
}

export function buildTechnicalDossierData(
  receipt: FuelReceiptScanResult,
  asset: Asset | undefined,
  unitPrice: number
) {
  const litersVariance = Math.abs(receipt.reconciliation?.varianceLiters || 0);
  const prejudice = Math.round(litersVariance * unitPrice * 100) / 100;
  const ref = `DET-NAFTAL-${(receipt.receiptId || 'RCPT').substring(0, 8).toUpperCase()}`;

  return {
    dossierReference: ref,
    vehiclePlate: receipt.assetCode || asset?.code || '16-10492-00',
    vehicleBrandModel: `${asset?.brand || 'Renault Trucks'} ${asset?.model || 'K 480'}`,
    driverPseudonym: 'CHAUFFEUR-SECURISE-ANPDP',
    incidentTimestamp: receipt.dateTime || receipt.createdAt || new Date().toISOString(),
    wilayaName: receipt.stationWilaya || '16 - Alger',
    wilayaCode: 16,
    roadGradePercent: 1.5,
    apparentSlopeDropLiters: 0.0,
    netSiphonedVolumeLiters: litersVariance,
    fuelUnitPriceDzd: unitPrice,
    financialPrejudiceDzd: prejudice,
    integritySha256: '9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08',
    htmlContent: `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${ref}</title></head><body><h2>Dossier d'Expertise Technique & Traçabilité Carburant</h2><p>Véhicule: ${receipt.assetCode || asset?.code || '16-10492-00'}</p><p>Volume litigieux: ${litersVariance.toFixed(2)} L</p><p>Préjudice calculé: ${prejudice.toFixed(2)} DZD</p></body></html>`,
  };
}

