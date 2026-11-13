import { Injectable, Logger } from '@nestjs/common';
import * as crypto from 'crypto';
import { resolveFuelPrice, WILAYAS_BY_CODE } from '@docteurflotte/contracts';

export interface TechnicalDossierInput {
  dossierReference?: string;
  tenantName: string;
  tenantNif?: string;
  vehicleId: string;
  vehiclePlate: string;
  vehicleBrandModel: string;
  driverPseudonym: string;
  incidentTimestamp: string;
  wilayaCode: number;
  locationDetails: string;
  roadGradePercent: number; // Pente Valhalla
  rawVolumeDropLiters: number;
  apparentSlopeDropLiters: number;
  netSiphonedVolumeLiters: number;
  fuelType: 'GASOIL' | 'SIRGHAZ' | 'SANS_PLOMB';
  officialUnitPriceDzd?: number;
  dynamicTariffs?: Record<string, number>;
  minOpposableLitersThreshold?: number; // Défaut 15L
  historicalLevels: number[];
  elevationProfileMeters?: number[];
  telemetryTier: string;
  notes?: string;
}

export interface TechnicalDossierResult {
  dossierReference: string;
  title: string;
  generatedAt: string;
  integritySha256: string;
  financialPrejudiceDzd: number;
  htmlContent: string;
  summaryText: string;
  isOpposable: boolean;
}

@Injectable()
export class TechnicalDossierPdfService {
  private readonly logger = new Logger(TechnicalDossierPdfService.name);
  public static readonly DEFAULT_OPPOSABLE_MIN_LITERS = 15.0;

  /**
   * Génère le "Dossier d'Expertise Technique & Traçabilité Carburant" certifié avec empreinte SHA-256.
   * Aucune constante tarifaire ou seuil en dur : lecture dynamique ou injectable.
   */
  generateTechnicalDossier(input: TechnicalDossierInput): TechnicalDossierResult {
    const timestamp = input.incidentTimestamp || new Date().toISOString();
    const dossierRef =
      input.dossierReference ||
      `DET-CARB-${input.vehiclePlate.replace(/[^A-Z0-9]/gi, '')}-${Date.now().toString().slice(-6)}`;

    const wilaya =
      WILAYAS_BY_CODE[input.wilayaCode]?.nameFr || `Wilaya ${input.wilayaCode}`;

    // Résolution dynamique du tarif carburant (sans constante en dur)
    const unitPrice =
      input.officialUnitPriceDzd ??
      resolveFuelPrice(input.fuelType, input.dynamicTariffs);

    const prejudiceDzd = Math.round(input.netSiphonedVolumeLiters * unitPrice * 100) / 100;
    const minOpposable = input.minOpposableLitersThreshold ?? TechnicalDossierPdfService.DEFAULT_OPPOSABLE_MIN_LITERS;

    // Calcul de l'empreinte d'intégrité cryptographique SHA-256 sur les données probatoires
    const payloadToHash = JSON.stringify({
      dossierRef,
      tenantName: input.tenantName,
      vehiclePlate: input.vehiclePlate,
      driverPseudonym: input.driverPseudonym,
      timestamp,
      wilayaCode: input.wilayaCode,
      rawDrop: input.rawVolumeDropLiters,
      netVolume: input.netSiphonedVolumeLiters,
      prejudiceDzd,
      roadGradePercent: input.roadGradePercent,
      historicalLevels: input.historicalLevels,
    });

    const integritySha256 = crypto.createHash('sha256').update(payloadToHash).digest('hex');

    const htmlContent = `<!DOCTYPE html>
<html lang="fr" dir="ltr">
<head>
  <meta charset="utf-8">
  <title>Dossier d'Expertise Technique & Traçabilité Carburant — ${dossierRef}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif; margin: 30px; color: #111827; background: #fff; line-height: 1.5; }
    .header { border-bottom: 2px solid #0284C7; padding-bottom: 12px; margin-bottom: 20px; display: flex; justify-content: space-between; }
    .header h1 { margin: 0; font-size: 20px; color: #0369A1; }
    .meta { font-size: 13px; color: #4B5563; }
    .badge { display: inline-block; padding: 4px 8px; border-radius: 4px; font-weight: bold; font-size: 12px; background: #FEF3C7; color: #92400E; }
    .table-section { width: 100%; border-collapse: collapse; margin-top: 15px; font-size: 13px; }
    .table-section th, .table-section td { border: 1px solid #E5E7EB; padding: 8px 12px; text-align: left; }
    .table-section th { background-color: #F8FAFC; color: #334155; }
    .prejudice { font-size: 16px; font-weight: bold; color: #DC2626; margin: 15px 0; }
    .sha-box { background: #F1F5F9; border: 1px dashed #94A3B8; padding: 10px; font-family: monospace; font-size: 11px; word-break: break-all; margin-top: 25px; }
    .footer { font-size: 11px; color: #6B7280; margin-top: 30px; border-top: 1px solid #E5E7EB; padding-top: 10px; text-align: center; }
  </style>
</head>
<body>
  <div class="header">
    <div>
      <h1>Dossier d'Expertise Technique & Traçabilité Carburant</h1>
      <div class="meta">Réf : <strong>${dossierRef}</strong> | Organisme / Flotte : <strong>${input.tenantName}</strong></div>
    </div>
    <div style="text-align: right;">
      <span class="badge">CONTRÔLE PHYSIQUE & TOPOGRAPHIQUE DÉTERMINISTE</span>
      <div class="meta">Date constat : ${timestamp}</div>
    </div>
  </div>

  <table class="table-section">
    <tr>
      <th>Véhicule / Immatriculation</th>
      <td>${input.vehiclePlate} (${input.vehicleBrandModel})</td>
      <th>Opérateur / Chauffeur</th>
      <td>${input.driverPseudonym}</td>
    </tr>
    <tr>
      <th>Localisation / Wilaya</th>
      <td>${input.locationDetails} (${wilaya} - Code ${input.wilayaCode})</td>
      <th>Palier Télématique</th>
      <td>${input.telemetryTier}</td>
    </tr>
    <tr>
      <th>Pente Routière (Valhalla)</th>
      <td>${input.roadGradePercent}% (${input.roadGradePercent !== 0 ? 'Compensation d assiette réservoir activée' : 'Terrain plat'})</td>
      <th>Biais Topographique Compensé</th>
      <td>${input.apparentSlopeDropLiters} L (Éliminé de l analyse)</td>
    </tr>
  </table>

  <h3>Analyse Physique & Bilan Litrage</h3>
  <table class="table-section">
    <thead>
      <tr>
        <th>Baisse Brute Observée</th>
        <th>Biais Dévers Route</th>
        <th>Perte Nette Constatée</th>
        <th>Prix Officiel Naftal</th>
        <th>Préjudice Estimé (DZD)</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td>${input.rawVolumeDropLiters} L</td>
        <td>-${input.apparentSlopeDropLiters} L</td>
        <td style="font-weight: bold; color: #DC2626;">${input.netSiphonedVolumeLiters} L</td>
        <td>${unitPrice.toFixed(2)} DZD/L</td>
        <td style="font-weight: bold; color: #DC2626; font-size: 15px;">${prejudiceDzd.toFixed(2)} DZD</td>
      </tr>
    </tbody>
  </table>

  <div class="prejudice">
    Préjudice Total Valorisé en Dinars Algériens : ${prejudiceDzd.toFixed(2)} DZD
  </div>

  <h3>Profil d'Échantillonnage de la Jauge (Chronologie)</h3>
  <p style="font-size: 13px; color: #374151;">
    Série temporelle des niveaux réservoir (L) : [ ${input.historicalLevels.join(' L &rarr; ')} L ]
  </p>

  <div class="sha-box">
    <strong>CERTIFICAT D'INTÉGRITÉ NUMÉRIQUE DU DOSSIER (SHA-256) :</strong><br/>
    ${integritySha256}<br/>
    <span style="color: #64748B;">Généré localement de manière déterministe sous contrôle souverain. Aucune transmission à des tiers conformément à la Loi 18-07 (ANPDP).</span>
  </div>

  <div class="footer">
    DocteurFlotte v3.1 — Système Souverain d'Arbitrage & Maintenance 5.0 — Conforme réglementation ENACTA & DGI Algérie
  </div>
</body>
</html>`;

    const summaryText = `[DOSSIER D EXPERTISE TECHNIQUE ${dossierRef}]
Véhicule: ${input.vehiclePlate} | Chauffeur: ${input.driverPseudonym} | Wilaya: ${wilaya} (${input.wilayaCode})
Pente routière Valhalla: ${input.roadGradePercent}% (Biais compensé: ${input.apparentSlopeDropLiters} L)
Perte nette confirmée: ${input.netSiphonedVolumeLiters} L (${input.fuelType})
Préjudice financier en Dinars: ${prejudiceDzd.toFixed(2)} DZD (Barème Naftal ${unitPrice.toFixed(2)} DA/L)
Empreinte SHA-256: ${integritySha256}`;

    return {
      dossierReference: dossierRef,
      title: "Dossier d'Expertise Technique & Traçabilité Carburant",
      generatedAt: new Date().toISOString(),
      integritySha256,
      financialPrejudiceDzd: prejudiceDzd,
      htmlContent,
      summaryText,
      isOpposable:
        input.netSiphonedVolumeLiters >= minOpposable &&
        input.rawVolumeDropLiters > input.apparentSlopeDropLiters,
    };
  }
}
