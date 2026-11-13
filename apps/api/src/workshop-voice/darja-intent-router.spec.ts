import { DarjaIntentRouterService } from './darja-intent-router.service';
import { OemMake, OemComponentCode, OemFluidCompartment } from '@docteurflotte/contracts';

describe('DarjaIntentRouterService', () => {
  let router: DarjaIntentRouterService;

  beforeEach(() => {
    router = new DarjaIntentRouterService();
  });

  it('doit router la commande orale "zeyer culasse shacman" vers les couples officiels Weichai en moins de 50 ms', () => {
    const result = router.routeWorkshopQuery('zeyer culasse shacman');

    expect(result.detectedIntent).toBe('QUERY_TORQUE_SPEC');
    expect(result.detectedMake).toBe(OemMake.SHACMAN);
    expect(result.detectedComponent).toBe(OemComponentCode.CYLINDER_HEAD);
    expect(result.matchedTorqueSpec).toBeDefined();
    expect(result.matchedTorqueSpec?.stage1TorqueNm).toBe(60);
    expect(result.matchedTorqueSpec?.stage2TorqueNm).toBe(120);
    expect(result.matchedTorqueSpec?.stage3TorqueNm).toBe(240);
    expect(result.matchedTorqueSpec?.angleStage1Degrees).toBe(90);
    expect(result.executionTimeMs).toBeLessThan(50); // Moins de 50 ms
    expect(result.confidenceScore).toBeGreaterThanOrEqual(0.95);
    expect(result.answerDarjaAudioText).toContain('Newton');
  });

  it('doit router "chhal zit moteur shacman" vers la contenance exacte de 36L et la viscosité saharienne 20W50', () => {
    const result = router.routeWorkshopQuery('chhal fih zit moteur shacman');

    expect(result.detectedIntent).toBe('QUERY_FLUID_CAPACITY');
    expect(result.detectedMake).toBe(OemMake.SHACMAN);
    expect(result.detectedCompartment).toBe(OemFluidCompartment.ENGINE_SUMP);
    expect(result.matchedFluidCapacity?.capacityLiters).toBe(36.0);
    expect(result.matchedFluidCapacity?.saharanHeavyViscosity).toContain('20W50');
    expect(result.matchedFluidCapacity?.saharanIntervalKm).toBe(12000);
    expect(result.executionTimeMs).toBeLessThan(50);
  });

  it('doit router "chhal zit la boite" vers la boîte de vitesses Fast Fuller', () => {
    const result = router.routeWorkshopQuery('chhal zit la boite shacman');

    expect(result.detectedIntent).toBe('QUERY_FLUID_CAPACITY');
    expect(result.detectedCompartment).toBe(OemFluidCompartment.GEARBOX);
    expect(result.matchedFluidCapacity?.capacityLiters).toBe(14.5);
    expect(result.matchedFluidCapacity?.standardViscosity).toContain('85W90');
  });

  it('doit router "panne code spn 100" vers le diagnostic officiel de chute de pression d huile', () => {
    const result = router.routeWorkshopQuery('panne code spn 100 fmi 1 shacman');

    expect(result.detectedIntent).toBe('QUERY_DTC_FAULT');
    expect(result.matchedDtcFault?.faultCode).toBe('SPN 100 FMI 1');
    expect(result.matchedDtcFault?.severityLevel).toBe('CRITICAL');
    expect(result.answerDarjaAudioText).toContain('Zit el moteur naqess');
  });
});

