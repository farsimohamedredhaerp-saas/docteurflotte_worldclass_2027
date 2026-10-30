import {
  LocalOemResolverService,
  ModeZeroKinematicEstimator,
  ALGERIA_58_WILAYAS_MATRIX,
  getWilayaInfo,
  getWilayaAlphaDz,
  WMI_REGISTRY_MAP,
} from '@docteurflotte/contracts';
import { LocalOemResolverService as MaintenanceOemService } from '../services/maintenance/local-oem-resolver.service';

describe('EPIC 1: Cœur OEM RMI Algérie & Mode 0 Zero-Hardware', () => {
  let maintenanceService: MaintenanceOemService;

  beforeAll(() => {
    maintenanceService = new MaintenanceOemService();
  });

  describe('Tâche 1.1 : Knowledge Vault OEM RMI Multi-Constructeurs', () => {
    it('doit décoder un camion SNVI Rouïba K120 avec le template spécifique', () => {
      const vin = 'DZ1K120A000001234';
      const profile = LocalOemResolverService.decodeVin(vin, 16); // Wilaya Alger (16)

      expect(profile.make).toContain('SNVI');
      expect(profile.country).toBe('Algeria');
      expect(profile.assetCategory).toBe('HEAVY_TRUCK');
      expect(profile.defaultProtocol).toBe('SAE_J1939');
      expect(profile.model).toContain('K120');
      expect(profile.recommendedTemplateCode).toBe('OEM_SNVI_K120_STD');
      expect(profile.recommendedIntervals.firstServiceKm).toBe(30000);
      expect(profile.recommendedIntervals.severeServiceKm).toBeLessThan(30000);
    });

    it('doit décoder un autocar SNVI Rouïba B400', () => {
      const vin = 'SNVB400B000005678';
      const profile = LocalOemResolverService.decodeVin(vin, 'ZONE_1_TELL_COASTAL');

      expect(profile.make).toContain('SNVI');
      expect(profile.model).toContain('B400');
      expect(profile.recommendedTemplateCode).toBe('OEM_SNVI_B400_BUS');
      expect(profile.recommendedIntervals.firstServiceKm).toBe(35000);
    });

    it('doit décoder un camion Mercedes-Benz Algérie SAFMMA Rouïba (Actros)', () => {
      const vin = 'DZ2ACTROS10001234';
      const profile = LocalOemResolverService.decodeVin(vin, 30); // Ouargla

      expect(profile.make).toContain('SAFMMA');
      expect(profile.country).toBe('Algeria');
      expect(profile.assetCategory).toBe('HEAVY_TRUCK');
      expect(profile.model).toContain('Actros');
      expect(profile.recommendedTemplateCode).toBe('OEM_SAFMMA_MERCEDES_ACTROS');
      expect(profile.recommendedIntervals.firstServiceKm).toBe(40000);
      expect(profile.operatingZone).toBe('ZONE_3_SAHARA_DEEP_SOUTH');
    });

    it('doit décoder un utilitaire Mercedes-Benz SAFMMA Tiaret (Sprinter)', () => {
      const vin = 'SMF906SPR20004321';
      const profile = LocalOemResolverService.decodeVin(vin, 14); // Tiaret

      expect(profile.make).toContain('SAFMMA');
      expect(profile.model).toContain('Sprinter');
      expect(profile.recommendedTemplateCode).toBe('OEM_SAFMMA_SPRINTER_STD');
      expect(profile.recommendedIntervals.firstServiceKm).toBe(20000);
    });

    it('doit décoder un tracteur agricole Cirta / PMA Constantine', () => {
      const vin = 'DZ3CIRTA680700012';
      const profile = LocalOemResolverService.decodeVin(vin, 25); // Constantine

      expect(profile.make).toContain('Cirta');
      expect(profile.assetCategory).toBe('AGRICULTURAL_MACHINERY');
      expect(profile.model).toContain('Cirta');
      expect(profile.recommendedTemplateCode).toBe('OEM_CIRTA_PMA_TRACTOR_STD');
      expect(profile.recommendedIntervals.firstServiceHours).toBe(250);
    });

    it('doit décoder un camion Shacman X3000 moteur Weichai WP12', () => {
      const vin = 'LZGX3000WP1200099';
      const profile = LocalOemResolverService.decodeVin(vin, 'ZONE_2_HAUTS_PLATEAUX_STEPPE');

      expect(profile.make).toContain('Shacman');
      expect(profile.country).toBe('China');
      expect(profile.model).toContain('X3000');
      expect(profile.recommendedTemplateCode).toBe('OEM_CHINESE_HEAVY_TRUCK_WP12');
      expect(profile.recommendedIntervals.firstServiceKm).toBe(30000);
    });

    it('doit décoder un engin de chantier Caterpillar BTP', () => {
      const vin = 'CAT320D0000001122';
      const profile = LocalOemResolverService.decodeVin(vin, 'ZONE_3_SAHARA_DEEP_SOUTH');

      expect(profile.make).toBe('Caterpillar');
      expect(profile.assetCategory).toBe('CONSTRUCTION_MACHINERY_BTP');
      expect(profile.recommendedTemplateCode).toBe('OEM_BTP_CAT_PM1_PM4');
      expect(profile.recommendedIntervals.firstServiceHours).toBe(250);
      expect(profile.recommendedIntervals.severeServiceHours).toBe(Math.round(250 * 0.58));
    });

    it('doit décoder un Toyota Hilux VUL', () => {
      const vin = 'JTEHILUX000004567';
      const profile = LocalOemResolverService.decodeVin(vin, 'ZONE_1_TELL_COASTAL');

      expect(profile.make).toContain('Toyota');
      expect(profile.assetCategory).toBe('LIGHT_COMMERCIAL');
      expect(profile.defaultProtocol).toBe('OBD2_CAN');
      expect(profile.recommendedTemplateCode).toBe('OEM_VUL_PICKUP_SEVERE_STD');
      expect(profile.recommendedIntervals.firstServiceKm).toBe(15000);
    });

    it('doit identifier les constructeurs nationaux avec isDomesticDz = true dans le registre', () => {
      const wmiList = maintenanceService.getWmiList();
      const snvi = wmiList.find((w) => w.wmi === 'DZ1');
      const safmma = wmiList.find((w) => w.wmi === 'DZ2');
      const cirta = wmiList.find((w) => w.wmi === 'DZ3');

      expect(snvi?.isDomesticDz).toBe(true);
      expect(safmma?.isDomesticDz).toBe(true);
      expect(cirta?.isDomesticDz).toBe(true);

      const renault = wmiList.find((w) => w.wmi === 'VF6');
      expect(renault?.isDomesticDz).toBe(false);
    });
  });

  describe('Tâche 1.2 : Estimateur Cinématique Mode 0 & Réconciliation Naftal / DVIR', () => {
    it('doit calculer avec exactitude mathématique la distance selon la formule v3.0 (Alger, charge nominale 1.0)', () => {
      // Delta D = (V * 100) / [C_ref * (2 - alpha_dz) * gamma_charge]
      // V = 400 L, C_ref = 32 L/100km, Alger (16, alpha_dz = 0.73), load = 1.0
      // Conso effective = 32 * (2 - 0.73) * 1.0 = 32 * 1.27 = 40.64 L/100km
      // Delta D = 40000 / 40.64 = 984.25 km
      const result = ModeZeroKinematicEstimator.estimateFuelDistanceKm({
        fuelVolumeLiters: 400,
        referenceConsumptionLitersPer100Km: 32.0,
        wilayaCode: 16,
        loadFactor: 1.0,
      });

      expect(result.estimatedDistanceKm).toBe(984.25);
      expect(result.wilayaCode).toBe('16');
      expect(result.wilayaNameFr).toBe('Alger');
      expect(result.alphaDz).toBe(0.73);
      expect(result.formulaProof).toContain('984.25 km');
      expect(result.formulaProof).toContain('40.64 L/100km');
    });

    it('doit intégrer l impact de la pleine charge gamma_charge = 1.35', () => {
      // Pleine charge : Conso effective = 40.64 * 1.35 = 54.864 L/100km
      // Delta D = 40000 / 54.864 = 729.08 km
      const result = ModeZeroKinematicEstimator.estimateFuelDistanceKm({
        fuelVolumeLiters: 400,
        referenceConsumptionLitersPer100Km: 32.0,
        wilayaCode: 16,
        loadFactor: 1.35,
      });

      expect(result.estimatedDistanceKm).toBe(729.08);
      expect(result.loadFactor).toBe(1.35);
      expect(result.formulaProof).toContain('729.08 km');
    });

    it('doit modéliser la surconsommation dans le Grand Sud Saharien (In Salah, alpha_dz = 0.48)', () => {
      // In Salah (53) : alpha_dz = 0.48
      // Conso effective = 32 * (2 - 0.48) * 1.0 = 32 * 1.52 = 48.64 L/100km
      // Delta D = 40000 / 48.64 = 822.37 km
      const result = ModeZeroKinematicEstimator.estimateFuelDistanceKm({
        fuelVolumeLiters: 400,
        referenceConsumptionLitersPer100Km: 32.0,
        wilayaCode: '53',
        loadFactor: 1.0,
      });

      expect(result.estimatedDistanceKm).toBe(822.37);
      expect(result.wilayaNameFr).toBe('In Salah');
      expect(result.alphaDz).toBe(0.48);
    });

    it('doit rejeter les entrées non physiques (volume <= 0 ou conso <= 0)', () => {
      expect(() => {
        ModeZeroKinematicEstimator.estimateFuelDistanceKm({
          fuelVolumeLiters: 0,
          referenceConsumptionLitersPer100Km: 30,
        });
      }).toThrow('strictement positifs');

      expect(() => {
        ModeZeroKinematicEstimator.estimateFuelDistanceKm({
          fuelVolumeLiters: 100,
          referenceConsumptionLitersPer100Km: -5,
        });
      }).toThrow('strictement positifs');
    });

    it('doit valider l alignement odomètre DVIR lorsque l écart est faible (ALIGNED)', () => {
      const res = ModeZeroKinematicEstimator.reconcileOdometerWithDvir({
        lastKnownOdometerKm: 100000,
        virtualOdometerKm: 100498,
        physicalDvirOdometerKm: 100500, // 2 km d écart sur 500 km
      });

      expect(res.status).toBe('ALIGNED');
      expect(res.driftKm).toBe(2);
      expect(res.adjustedOdometerKm).toBe(100500);
      expect(res.proof).toContain('aligné');
    });

    it('doit valider une dérive acceptable sous le seuil de 10% (ACCEPTABLE_DRIFT)', () => {
      const res = ModeZeroKinematicEstimator.reconcileOdometerWithDvir({
        lastKnownOdometerKm: 100000,
        virtualOdometerKm: 100480,
        physicalDvirOdometerKm: 100500, // 20 km d écart sur 500 km = 4%
        maxAcceptableDriftPercent: 10.0,
      });

      expect(res.status).toBe('ACCEPTABLE_DRIFT');
      expect(res.driftKm).toBe(20);
      expect(res.driftPercentage).toBe(4);
      expect(res.adjustedOdometerKm).toBe(100500);
      expect(res.proof).toContain('tolérable');
    });

    it('doit déclencher une alerte d investigation en cas de dérive excessive (INVESTIGATION_REQUIRED)', () => {
      const res = ModeZeroKinematicEstimator.reconcileOdometerWithDvir({
        lastKnownOdometerKm: 100000,
        virtualOdometerKm: 100420,
        physicalDvirOdometerKm: 100500, // 80 km d écart sur 500 km = 16% > 10%
        maxAcceptableDriftPercent: 10.0,
      });

      expect(res.status).toBe('INVESTIGATION_REQUIRED');
      expect(res.driftPercentage).toBe(16);
      expect(res.proof).toContain('Divergence critique');
    });

    it('doit bloquer et signaler une fraude en cas de recul du compteur physique (NEGATIVE_DRIFT_ANOMALY)', () => {
      const res = ModeZeroKinematicEstimator.reconcileOdometerWithDvir({
        lastKnownOdometerKm: 100000,
        virtualOdometerKm: 100500,
        physicalDvirOdometerKm: 99800, // Compteur physique inférieur au dernier relevé certifié
      });

      expect(res.status).toBe('NEGATIVE_DRIFT_ANOMALY');
      expect(res.adjustedOdometerKm).toBe(100500); // Rejet du relevé frauduleux
      expect(res.proof).toContain('ALERTE FRAUDE');
    });
  });

  describe('Tâche 1.3 : Matrice Complète des 58 Wilayas d Algérie (JORADP)', () => {
    it('doit contenir exactement 58 wilayas officielles (de 01 à 58 sans trou)', () => {
      expect(ALGERIA_58_WILAYAS_MATRIX.length).toBe(58);

      for (let i = 1; i <= 58; i++) {
        const expectedCode = i < 10 ? `0${i}` : `${i}`;
        const found = ALGERIA_58_WILAYAS_MATRIX.find((w) => w.code === expectedCode);
        expect(found).toBeDefined();
        expect(found?.codeNumber).toBe(i);
      }
    });

    it('doit permettre la recherche par code chaîne ("16", "01"), nombre (16, 1) et nom ("Alger", "ورقلة")', () => {
      const algerByStr = getWilayaInfo('16');
      const algerByNum = getWilayaInfo(16);
      const algerByName = getWilayaInfo('Alger');
      const algerByNameAr = getWilayaInfo('الجزائر');

      expect(algerByStr?.nameFr).toBe('Alger');
      expect(algerByNum?.nameFr).toBe('Alger');
      expect(algerByName?.code).toBe('16');
      expect(algerByNameAr?.code).toBe('16');

      const adrarBySingleNum = getWilayaInfo(1);
      expect(adrarBySingleNum?.code).toBe('01');
      expect(adrarBySingleNum?.nameFr).toBe('Adrar');

      const ouarglaAr = getWilayaInfo('ورقلة');
      expect(ouarglaAr?.code).toBe('30');
      expect(ouarglaAr?.chefLieu).toBe('Ouargla');
    });

    it('doit fournir les coefficients de sévérité alpha_dz (huile, filtre, composite) dans des bornes valides', () => {
      for (const wilaya of ALGERIA_58_WILAYAS_MATRIX) {
        expect(wilaya.alphaDzOil).toBeGreaterThanOrEqual(0.50);
        expect(wilaya.alphaDzOil).toBeLessThanOrEqual(0.85);

        expect(wilaya.alphaDzFilter).toBeGreaterThanOrEqual(0.40);
        expect(wilaya.alphaDzFilter).toBeLessThanOrEqual(0.80);

        expect(wilaya.alphaDz).toBeGreaterThanOrEqual(0.45);
        expect(wilaya.alphaDz).toBeLessThanOrEqual(0.85);

        expect(wilaya.ambientTempSummerMaxC).toBeGreaterThanOrEqual(35);
        expect(wilaya.ambientTempSummerMaxC).toBeLessThanOrEqual(55);

        expect(wilaya.nameAr.length).toBeGreaterThan(0);
        expect(wilaya.constraints.length).toBeGreaterThan(0);
      }
    });

    it('doit retourner les coefficients spécifiques via getWilayaAlphaDz', () => {
      // In Salah (53) : Sahara extrême
      expect(getWilayaAlphaDz(53, 'oil')).toBe(0.55);
      expect(getWilayaAlphaDz(53, 'filter')).toBe(0.40);
      expect(getWilayaAlphaDz(53, 'composite')).toBe(0.48);

      // Sétif (19) : Hauts Plateaux
      expect(getWilayaAlphaDz(19, 'oil')).toBe(0.80);
      expect(getWilayaAlphaDz(19, 'filter')).toBe(0.75);

      // Wilaya inconnue : retour par défaut Tell (0.75)
      expect(getWilayaAlphaDz('99')).toBe(0.75);
    });
  });
});

