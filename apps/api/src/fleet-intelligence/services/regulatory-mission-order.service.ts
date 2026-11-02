import { Injectable, Logger } from '@nestjs/common';
import * as crypto from 'crypto';
import {
  EnactaVehicleCategory,
  RegulatoryMissionOrderData,
  buildMissionOrderQrString,
} from '@docteurflotte/contracts';
import {
  AssetCategory,
  DispatchStatus,
  DriverStateDto,
  MissionRequestDto,
  VehicleStateDto,
  ViolationDetail,
} from '../dto/dispatch-decision.dto';
import { AlgerianRegulatoryGateService } from './regulatory-gate.service';

export interface MissionOrderIssuanceRequest {
  mission: MissionRequestDto;
  vehicle: VehicleStateDto & { vin?: string };
  driver: DriverStateDto & { nationalIdNumber?: string };
  companyInfo?: {
    legalName: string;
    tradeName?: string;
    nif: string;
    nis: string;
    rcNumber: string;
    aiNumber: string;
    headquartersWilayaCode: number;
    headquartersWilayaName: string;
  };
}

export interface VerificationResult {
  isValid: boolean;
  status: 'VALID' | 'EXPIRED' | 'TAMPERED';
  reason?: string;
  decodedOrder?: {
    orderNumber: string;
    registrationPlate: string;
    driverNin: string;
    originWilaya: number;
    destWilaya: number;
    validUntil: string;
    cargoNature: string;
  };
}

@Injectable()
export class RegulatoryMissionOrderService {
  private readonly logger = new Logger(RegulatoryMissionOrderService.name);

  private readonly hmacSecret: string;

  constructor(private readonly gateService: AlgerianRegulatoryGateService) {
    if (
      process.env.NODE_ENV === 'production' &&
      (!process.env.MISSION_ORDER_SIGNING_SECRET ||
        process.env.MISSION_ORDER_SIGNING_SECRET.length < 32)
    ) {
      throw new Error(
        'FATAL SECURITY: MISSION_ORDER_SIGNING_SECRET (min 32 chars) est obligatoire en production.',
      );
    }
    this.hmacSecret =
      process.env.MISSION_ORDER_SIGNING_SECRET || 'DZ-DOCTEURFLOTTE-SOUVERAIN-HMAC-2026';
  }

  /**
   * Évalue le statut de dispatch d un véhicule en appliquant la machine à états stricte
   */
  evaluateDispatchStatus(
    vehicle: VehicleStateDto,
    mission: MissionRequestDto,
  ): {
    status: DispatchStatus;
    blockingViolations: ViolationDetail[];
  } {
    const regViolations = this.gateService.evaluateVehicleRegulatoryCompliance(vehicle, mission);
    const techViolations = this.gateService.evaluatePredictiveAndTechnicalReadiness(
      vehicle,
      mission,
    );

    const hasCriticalDtc = (vehicle.activeDtcs || []).some((d) => d.severity === 'CRITICAL_STOP');
    const isOverheat = vehicle.coolingEwmaResidualC >= 11.0;
    const isVhiCritical = vehicle.vehicleHealthIndex < 50.0;

    if (regViolations.length > 0) {
      return {
        status: DispatchStatus.BLOCKED_REGULATORY,
        blockingViolations: regViolations,
      };
    }

    if (isVhiCritical || hasCriticalDtc || isOverheat) {
      return {
        status: DispatchStatus.BLOCKED_SAFETY,
        blockingViolations: techViolations,
      };
    }

    if (vehicle.vehicleHealthIndex < 80.0 || techViolations.length > 0) {
      return {
        status: DispatchStatus.MAINTENANCE_WARN,
        blockingViolations: techViolations,
      };
    }

    return {
      status: DispatchStatus.AVAILABLE,
      blockingViolations: [],
    };
  }

  private mapAssetToEnactaCategory(cat: AssetCategory): EnactaVehicleCategory {
    switch (cat) {
      case AssetCategory.HEAVY_TRUCK_RIGID:
        return EnactaVehicleCategory.HEAVY_TRUCK_RIGID;
      case AssetCategory.TRACTOR_TRAILER:
        return EnactaVehicleCategory.TRACTOR_TRAILER;
      case AssetCategory.HAZMAT_TANKER:
        return EnactaVehicleCategory.HAZMAT_TANKER;
      case AssetCategory.REEFER_TRUCK:
        return EnactaVehicleCategory.REEFER_TRUCK;
      case AssetCategory.VAN:
        return EnactaVehicleCategory.COMMERCIAL_VAN_VUL;
      case AssetCategory.LIGHT_VEHICLE:
      default:
        return EnactaVehicleCategory.LIGHT_PASSENGER;
    }
  }

  /**
   * Génère un Ordre de Mission Réglementaire bilingue (FR/AR)
   * avec signature cryptographique HMAC-SHA256 et QR Code vérifiable hors-ligne.
   */
  issueRegulatoryMissionOrder(request: MissionOrderIssuanceRequest): RegulatoryMissionOrderData {
    const { mission, vehicle, driver } = request;

    const dispatchCheck = this.evaluateDispatchStatus(vehicle, mission);
    if (
      dispatchCheck.status === DispatchStatus.BLOCKED_REGULATORY ||
      dispatchCheck.status === DispatchStatus.BLOCKED_SAFETY
    ) {
      const reason = dispatchCheck.blockingViolations.map((v) => v.messageFr).join('; ');
      throw new Error(
        `Impossible d émettre un Ordre de Mission : Le véhicule ${vehicle.registrationPlate} est verrouillé en statut [${dispatchCheck.status}]. Raisons : ${reason}`,
      );
    }

    const company = request.companyInfo ?? {
      legalName: 'SOCIÉTÉ ALGÉRIENNE DE TRANSPORT & LOGISTIQUE EURL',
      tradeName: 'ALGERIA FLEET LOGISTICS',
      nif: '001616012345678',
      nis: '00161601234',
      rcNumber: '16/00-1234567B22',
      aiNumber: '16012345678',
      headquartersWilayaCode: 16,
      headquartersWilayaName: 'Alger',
    };

    const depDate = new Date(mission.plannedDepartureUtc);
    const validUntilMs = depDate.getTime() + (mission.estimatedDrivingHours + 72) * 3600 * 1000;
    const validUntilIso = new Date(validUntilMs).toISOString();

    const orderNumber = `OM-${depDate.getUTCFullYear()}-${String(mission.originWilayaCode).padStart(2, '0')}${String(
      Math.floor(1000 + Math.random() * 9000),
    )}`;

    const cargoNature = mission.requiresHazmatAdr
      ? 'HYDROCARBURES / MATIÈRES DANGEREUSES (ADR)'
      : mission.requiresReeferColdChain
      ? 'PRODUITS PHARMACEUTIQUES / FRAIS (ATP)'
      : 'MARCHANDISES GÉNÉRALES & FRET INDUSTRIEL';

    const enactaDoc = vehicle.documents.find((d) => d.docType.includes('ENACTA'));
    const insuranceDoc = vehicle.documents.find((d) => d.docType.includes('ASSURANCE'));

    const qrPayload = buildMissionOrderQrString({
      orderNumber,
      registrationPlate: vehicle.registrationPlate,
      driverNin: driver.nationalIdNumber || '198516012345678901',
      originWilaya: mission.originWilayaCode,
      destWilaya: mission.destinationWilayaCode,
      validUntil: validUntilIso.slice(0, 10),
      cargoNature: mission.requiresHazmatAdr ? 'HAZMAT' : 'FRET',
    });

    const signatureToken = this.signPayload(qrPayload);

    const orderData: RegulatoryMissionOrderData = {
      orderNumber,
      issueDateIso: new Date().toISOString(),
      validUntilIso,
      companyInfo: company,
      vehicle: {
        vehicleId: vehicle.vehicleId,
        registrationPlate: vehicle.registrationPlate,
        makeModel: vehicle.makeModel,
        chassisVin: vehicle.vin || 'DZ-SNVI-ROUIBA-2026-X1',
        category: this.mapAssetToEnactaCategory(vehicle.category),
        enactaExpiryDate: enactaDoc?.expiresAt || '2026-12-31',
        insurancePolicyNumber: insuranceDoc?.docNumber || 'SAA-POL-2026-001',
        insuranceCompany: 'Société Nationale d Assurance (SAA)',
      },
      driver: {
        driverId: driver.driverId,
        fullName: driver.fullName,
        nationalIdNumber: driver.nationalIdNumber || '198516012345678901',
        licenseCategory: driver.licenseCategories.join(', '),
        brevetProfessionnelNumber: driver.hasBrevetProfessionnel
          ? `BPC-DZ-${driver.driverId.slice(0, 6).toUpperCase()}`
          : undefined,
        adrHazmatCertificateNumber: driver.hasAdrHazmatCert
          ? `ADR-HAZMAT-DZ-2026`
          : undefined,
      },
      mission: {
        missionId: mission.missionId,
        originName: mission.originName,
        originWilayaCode: mission.originWilayaCode,
        destinationName: mission.destinationName,
        destinationWilayaCode: mission.destinationWilayaCode,
        transitWilayaCodes: mission.transitWilayaCodes || [],
        cargoNature,
        cargoWeightTons: mission.requiredPayloadTons,
        routeDistanceKm: mission.routeDistanceKm,
        departureTimeUtc: mission.plannedDepartureUtc,
      },
      qrVerificationPayload: qrPayload,
      offlineSignatureToken: signatureToken,
    };

    this.logger.log(
      `[Ordre de Mission] Émis avec succès : ${orderNumber} | Véhicule: ${vehicle.registrationPlate} | Chauffeur: ${driver.fullName} | Signature: ${signatureToken.slice(0, 12)}...`,
    );

    return orderData;
  }

  /**
   * Signe un payload de manière cryptographique avec HMAC-SHA256
   */
  signPayload(payload: string): string {
    return crypto.createHmac('sha256', this.hmacSecret).update(payload).digest('hex');
  }

  /**
   * Vérifie un Ordre de Mission en mode 100% hors-ligne (Contrôle Gendarmerie / DGSN)
   * Protégé contre RangeError sur timingSafeEqual lorsque la longueur du jeton diffère.
   */
  verifyMissionOrderOfflineToken(qrPayload: string, signatureToken: string): VerificationResult {
    if (!qrPayload || !signatureToken || typeof signatureToken !== 'string') {
      return {
        isValid: false,
        status: 'TAMPERED',
        reason: 'Payload QR ou jeton de signature manquant',
      };
    }

    if (!/^[0-9a-fA-F]{64}$/.test(signatureToken.trim())) {
      return {
        isValid: false,
        status: 'TAMPERED',
        reason: 'Signature cryptographique invalide (Falsification détectée)',
      };
    }

    const expectedSignature = this.signPayload(qrPayload);
    const sigBuf = Buffer.from(signatureToken.trim(), 'hex');
    const expBuf = Buffer.from(expectedSignature, 'hex');

    if (sigBuf.length !== expBuf.length || !crypto.timingSafeEqual(sigBuf, expBuf)) {
      return {
        isValid: false,
        status: 'TAMPERED',
        reason: 'Signature cryptographique invalide (Falsification détectée)',
      };
    }

    const parts = qrPayload.split('|');
    if (parts.length < 8 || parts[0] !== 'DZOM') {
      return {
        isValid: false,
        status: 'TAMPERED',
        reason: 'Format de trame QR non reconnu',
      };
    }

    const validUntilDateStr = parts[6];
    const nowStr = new Date().toISOString().slice(0, 10);

    if (validUntilDateStr < nowStr) {
      return {
        isValid: false,
        status: 'EXPIRED',
        reason: `Ordre de mission expiré depuis le ${validUntilDateStr}`,
        decodedOrder: {
          orderNumber: parts[1],
          registrationPlate: parts[2],
          driverNin: parts[3],
          originWilaya: Number(parts[4]),
          destWilaya: Number(parts[5]),
          validUntil: parts[6],
          cargoNature: parts[7],
        },
      };
    }

    return {
      isValid: true,
      status: 'VALID',
      decodedOrder: {
        orderNumber: parts[1],
        registrationPlate: parts[2],
        driverNin: parts[3],
        originWilaya: Number(parts[4]),
        destWilaya: Number(parts[5]),
        validUntil: parts[6],
        cargoNature: parts[7],
      },
    };
  }
}
