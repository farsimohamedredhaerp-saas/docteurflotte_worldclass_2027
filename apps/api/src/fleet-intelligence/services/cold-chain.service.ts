import { Injectable, Logger } from '@nestjs/common';
import {
  ReeferCargoType,
  ReeferLiveStatus,
  ReeferPowerMode,
  ReeferTelemetryPayload,
} from '@docteurflotte/contracts';

@Injectable()
export class ColdChainService {
  private readonly logger = new Logger(ColdChainService.name);

  private readonly SAFE_RANGES: Record<ReeferCargoType, { min: number; max: number; label: string }> = {
    [ReeferCargoType.DAIRY]: { min: 2.0, max: 4.5, label: 'Lait & Produits Laitiers (+2°C à +4.5°C)' },
    [ReeferCargoType.FRESH_MEAT]: { min: 0.0, max: 2.5, label: 'Viandes Fraîches (0°C à +2.5°C)' },
    [ReeferCargoType.FROZEN]: { min: -25.0, max: -18.0, label: 'Surgelés (-25°C à -18°C)' },
    [ReeferCargoType.PHARMA]: { min: 2.0, max: 8.0, label: 'Vaccins & Pharmacie (+2°C à +8°C)' },
    [ReeferCargoType.PRODUCE]: { min: 6.0, max: 12.0, label: 'Fruits & Légumes (+6°C à +12°C)' },
    [ReeferCargoType.AMBIENT]: { min: 15.0, max: 25.0, label: 'Sec Tempéré (+15°C à +25°C)' },
  };

  evaluateReeferTelemetry(payload: ReeferTelemetryPayload): ReeferLiveStatus {
    const range = this.SAFE_RANGES[payload.cargoType] || { min: 2.0, max: 8.0, label: 'Standard' };
    const currentTemp = payload.returnTempC;
    const isWithinSafeRange = currentTemp >= range.min && currentTemp <= range.max;
    const tempDeltaC = Math.round(Math.abs(currentTemp - payload.setpointTempC) * 10) / 10;

    const kUnit = 1000;
    let excursionDurationMinutes = 0;
    let financialRiskDzd = 0;
    const estimatedCargoValueDzd = 4500 * kUnit;

    if (!isWithinSafeRange) {
      excursionDurationMinutes = 35;
      financialRiskDzd = Math.min(
        estimatedCargoValueDzd,
        Math.round(tempDeltaC * excursionDurationMinutes * 1500 + 120 * kUnit),
      );
      this.logger.warn(
        `[ALERTE RUPTURE CHAÎNE DU FROID] Caisse ${payload.assetId} (${payload.cargoType}) à ${currentTemp}°C au lieu de [${range.min}, ${range.max}]. Risque : ${financialRiskDzd} DA.`,
      );
    }

    return {
      assetId: payload.assetId,
      assetCode: `FRIGO-${payload.assetId.slice(-4).toUpperCase()}`,
      assetName: `Semi-Frigo ${payload.cargoType}`,
      cargoType: payload.cargoType,
      currentTempC: currentTemp,
      setpointTempC: payload.setpointTempC,
      tempDeltaC,
      isWithinSafeRange,
      doorOpen: payload.doorOpen,
      powerMode: payload.powerMode,
      lastUpdate: payload.recordedAt || new Date().toISOString(),
      excursionDurationMinutes,
      estimatedCargoValueDzd,
      financialRiskDzd,
    };
  }

  getLiveReeferFleet(): ReeferLiveStatus[] {
    const kUnit = 1000;
    return [
      {
        assetId: 'reefer-01',
        assetCode: 'FRIGO-16-01',
        assetName: 'Semi Lamberet Carrier Vector 1550 (Lait Soummam)',
        cargoType: ReeferCargoType.DAIRY,
        currentTempC: 3.2,
        setpointTempC: 3.0,
        tempDeltaC: 0.2,
        isWithinSafeRange: true,
        doorOpen: false,
        powerMode: ReeferPowerMode.DIESEL,
        lastUpdate: new Date().toISOString(),
        excursionDurationMinutes: 0,
        estimatedCargoValueDzd: 3800 * kUnit,
        financialRiskDzd: 0,
      },
      {
        assetId: 'reefer-02',
        assetCode: 'FRIGO-31-02',
        assetName: 'Semi Chereau Thermo King SLXi (Viande Bovine Oran)',
        cargoType: ReeferCargoType.FRESH_MEAT,
        currentTempC: 6.8,
        setpointTempC: 1.5,
        tempDeltaC: 5.3,
        isWithinSafeRange: false,
        doorOpen: true,
        powerMode: ReeferPowerMode.DIESEL,
        lastUpdate: new Date().toISOString(),
        excursionDurationMinutes: 42,
        estimatedCargoValueDzd: 7200 * kUnit,
        financialRiskDzd: 580 * kUnit,
      },
      {
        assetId: 'reefer-03',
        assetCode: 'FRIGO-09-03',
        assetName: 'Porteur Renault Master Frigo (Vaccins / Insuline Saidal)',
        cargoType: ReeferCargoType.PHARMA,
        currentTempC: 4.5,
        setpointTempC: 4.0,
        tempDeltaC: 0.5,
        isWithinSafeRange: true,
        doorOpen: false,
        powerMode: ReeferPowerMode.ELECTRIC_STANDBY,
        lastUpdate: new Date().toISOString(),
        excursionDurationMinutes: 0,
        estimatedCargoValueDzd: 12500 * kUnit,
        financialRiskDzd: 0,
      },
    ];
  }
}
