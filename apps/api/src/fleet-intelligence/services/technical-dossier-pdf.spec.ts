import { TechnicalDossierPdfService, TechnicalDossierInput } from './technical-dossier-pdf.service';

describe('TechnicalDossierPdfService', () => {
  let service: TechnicalDossierPdfService;

  beforeEach(() => {
    service = new TechnicalDossierPdfService();
  });

  it('doit générer un Dossier d Expertise Technique certifié avec empreinte SHA-256 et chiffrage DZD opposable', () => {
    const input: TechnicalDossierInput = {
      tenantName: 'Entreprise Nationale de Transport Logistique (ENTL)',
      vehicleId: 'uuid-veh-01',
      vehiclePlate: '16-118-09',
      vehicleBrandModel: 'Renault Trucks Kerax 440 DXi',
      driverPseudonym: 'CHAUFFEUR-AH-B48F',
      incidentTimestamp: '2026-11-03T23:15:00Z',
      wilayaCode: 30, // Ouargla
      locationDetails: 'Aire de stationnement RN3 - Hassi Messaoud',
      roadGradePercent: 0.5,
      rawVolumeDropLiters: 120.0,
      apparentSlopeDropLiters: 2.0,
      netSiphonedVolumeLiters: 118.0,
      fuelType: 'GASOIL',
      officialUnitPriceDzd: 29.01,
      historicalLevels: [380, 360, 310, 262],
      telemetryTier: 'MODE_2_CAN_J1939',
    };

    const dossier = service.generateTechnicalDossier(input);

    expect(dossier.title).toBe("Dossier d'Expertise Technique & Traçabilité Carburant");
    expect(dossier.dossierReference).toContain('DET-CARB-1611809');
    expect(dossier.integritySha256).toHaveLength(64); // SHA-256 valide
    expect(dossier.financialPrejudiceDzd).toBe(3423.18); // 118 * 29.01
    expect(dossier.isOpposable).toBe(true);
    expect(dossier.htmlContent).toContain('Dossier d\'Expertise Technique');
    expect(dossier.htmlContent).toContain(dossier.integritySha256);
    expect(dossier.htmlContent).toContain('3423.18 DZD');
    expect(dossier.summaryText).toContain('SHA-256');
  });
});
