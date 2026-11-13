import { TopographicConsistencyService, TopographicCheckpoint } from './topographic-consistency.service';

describe('TopographicConsistencyService', () => {
  let service: TopographicConsistencyService;

  beforeEach(() => {
    service = new TopographicConsistencyService();
  });

  it('doit valider un trajet cohérent avec le réseau routier physique Valhalla (écart inférieur à 12%)', () => {
    const prev: TopographicCheckpoint = {
      stationCode: 'ST-ALGER',
      stationName: 'Station Naftal Caroubier Alger',
      wilayaCode: 16,
      odometerKm: 100000,
      timestamp: '2026-11-01T08:00:00Z',
      latitude: 36.75,
      longitude: 3.05,
    };

    const curr: TopographicCheckpoint = {
      stationCode: 'ST-BLIDA',
      stationName: 'Station Naftal Chiffa Blida',
      wilayaCode: 9,
      odometerKm: 100053, // 53 km déclarés pour ~49.7 km attendus (+6.6% < 12%)
      timestamp: '2026-11-01T10:30:00Z',
      latitude: 36.47,
      longitude: 2.83,
    };

    const result = service.verifyOdometerConsistency('uuid-asset-1', '16-118-09', prev, curr, 12.0);

    expect(result.declaredDeltaKm).toBe(53);
    expect(result.valhallaExpectedMinKm).toBeGreaterThan(30);
    expect(result.hasDiscrepancyAlert).toBe(false);
    expect(result.isMaintenanceUpdatePermitted).toBe(true);
  });

  it('doit lever ODOMETER_INFLATION_ALERT si le kilométrage déclaré dépasse le tracé minimal Valhalla de plus de 12%', () => {
    const prev: TopographicCheckpoint = {
      stationCode: 'ST-ALGER',
      stationName: 'Station Alger',
      wilayaCode: 16,
      odometerKm: 120000,
      timestamp: '2026-11-01T08:00:00Z',
      latitude: 36.75,
      longitude: 3.05,
    };

    const curr: TopographicCheckpoint = {
      stationCode: 'ST-BOUMERDES',
      stationName: 'Station Boumerdes',
      wilayaCode: 35,
      odometerKm: 120150, // 150 km déclarés pour un trajet d environ 45-55 km
      timestamp: '2026-11-01T11:00:00Z',
      latitude: 36.76,
      longitude: 3.47,
    };

    const result = service.verifyOdometerConsistency('uuid-asset-1', '16-118-09', prev, curr, 12.0);

    expect(result.hasDiscrepancyAlert).toBe(true);
    expect(result.alertType).toBe('ODOMETER_INFLATION_ALERT');
    expect(result.discrepancyPercentage).toBeGreaterThan(12.0);
    expect(result.isMaintenanceUpdatePermitted).toBe(false);
    expect(result.discrepancyReason).toContain('ODOMETER_DISCREPANCY_ALERT');
  });

  it('doit lever ODOMETER_ROLLBACK_ALERT si l odomètre courant est inférieur à l odomètre précédent', () => {
    const prev: TopographicCheckpoint = {
      stationCode: 'ST-1',
      stationName: 'Station 1',
      wilayaCode: 16,
      odometerKm: 150000,
      timestamp: '2026-11-01T08:00:00Z',
    };

    const curr: TopographicCheckpoint = {
      stationCode: 'ST-2',
      stationName: 'Station 2',
      wilayaCode: 16,
      odometerKm: 148000, // Recul de 2000 km
      timestamp: '2026-11-01T14:00:00Z',
    };

    const result = service.verifyOdometerConsistency('uuid-asset-1', '16-118-09', prev, curr);

    expect(result.hasDiscrepancyAlert).toBe(true);
    expect(result.alertType).toBe('ODOMETER_ROLLBACK_ALERT');
    expect(result.declaredDeltaKm).toBe(-2000);
    expect(result.isMaintenanceUpdatePermitted).toBe(false);
  });
});
