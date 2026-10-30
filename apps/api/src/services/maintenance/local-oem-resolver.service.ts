import { Injectable } from '@nestjs/common';
import {
  LocalOemResolverService as CoreResolver,
  ModeZeroKinematicEstimator,
  DecodedOemAssetProfile,
  OperatingZone,
  WMI_REGISTRY_MAP,
  SEVERE_DUTY_FACTORS,
  ALGERIA_58_WILAYAS_MATRIX,
  WilayaSeverityInfo,
  getWilayaInfo,
  getWilayaAlphaDz,
  ModeZeroEstimateInput,
  ModeZeroFuelDistanceEstimate,
  OdometerReconciliationInput,
  OdometerReconciliationResult,
} from '@docteurflotte/contracts';

@Injectable()
export class LocalOemResolverService {
  decodeVin(
    vin: string,
    zoneOrWilaya: OperatingZone | string | number = 'ZONE_3_SAHARA_DEEP_SOUTH'
  ): DecodedOemAssetProfile {
    return CoreResolver.decodeVin(vin, zoneOrWilaya);
  }

  estimateFuelDistance(input: ModeZeroEstimateInput): ModeZeroFuelDistanceEstimate {
    return ModeZeroKinematicEstimator.estimateFuelDistanceKm(input);
  }

  reconcileOdometerWithDvir(input: OdometerReconciliationInput): OdometerReconciliationResult {
    return ModeZeroKinematicEstimator.reconcileOdometerWithDvir(input);
  }

  getWilayas(): readonly WilayaSeverityInfo[] {
    return ALGERIA_58_WILAYAS_MATRIX;
  }

  getWilayaInfo(codeOrName: string | number): WilayaSeverityInfo | undefined {
    return getWilayaInfo(codeOrName);
  }

  getWilayaAlphaDz(
    codeOrName: string | number,
    component: 'oil' | 'filter' | 'composite' = 'composite'
  ): number {
    return getWilayaAlphaDz(codeOrName, component);
  }

  getWmiList() {
    return Object.entries(WMI_REGISTRY_MAP).map(([wmi, meta]) => ({
      wmi,
      make: meta.make,
      country: meta.country,
      category: meta.category,
      protocol: meta.protocol,
      isDomesticDz: !!meta.isDomesticDz,
    }));
  }

  getSevereDutyFactors() {
    return SEVERE_DUTY_FACTORS;
  }
}
