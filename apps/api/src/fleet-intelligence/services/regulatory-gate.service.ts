import { Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
import {
  AssetCategory,
  ClimateZoneDZ,
  DocumentTypeDZ,
  DriverStateDto,
  LicenseCategoryDZ,
  MissionRequestDto,
  VehicleStateDto,
  ViolationDetail,
  WorkOrderGenerated,
} from '../dto/dispatch-decision.dto';

interface WilayaRestrictionRule {
  wilayaCode: number;
  wilayaName: string;
  maxAllowedGvwrTons: number;
  restrictedWindowsMinutes: [number, number][]; // [startMinFromMidnight, endMinFromMidnight]
  bypassRingRoadName: string;
  bypassPolygonGeoJson: Record<string, unknown>;
}

@Injectable()
export class AlgerianRegulatoryGateService {
  readonly CLIMATE_SEVERITY_ALPHA: Record<ClimateZoneDZ, number> = {
    [ClimateZoneDZ.TELL_URBAN]: 0.75,
    [ClimateZoneDZ.HIGH_PLATEAUS]: 0.8,
    [ClimateZoneDZ.SAHARA_SOUTH]: 0.6,
  };

  readonly RUL_SAFETY_MULTIPLIER: Record<ClimateZoneDZ, number> = {
    [ClimateZoneDZ.TELL_URBAN]: 1.25,
    [ClimateZoneDZ.HIGH_PLATEAUS]: 1.3,
    [ClimateZoneDZ.SAHARA_SOUTH]: 1.5, // +50% de marge exigée pour le Grand Sud
  };

  readonly MIN_VHI_THRESHOLD: Record<ClimateZoneDZ, number> = {
    [ClimateZoneDZ.TELL_URBAN]: 50.0,
    [ClimateZoneDZ.HIGH_PLATEAUS]: 55.0,
    [ClimateZoneDZ.SAHARA_SOUTH]: 68.0,
  };

  // Arrêtés de Wilayas pré-configurés (Alger 16, Oran 31, Constantine 25)
  private readonly WILAYA_RESTRICTIONS_DB: Record<number, WilayaRestrictionRule> = {
    16: {
      wilayaCode: 16,
      wilayaName: 'Alger',
      maxAllowedGvwrTons: 5.5,
      restrictedWindowsMinutes: [
        [6 * 60 + 30, 9 * 60 + 30], // 06:30 - 09:30
        [16 * 60, 19 * 60 + 30],    // 16:00 - 19:30
      ],
      bypassRingRoadName: "2e Rocade Sud d'Alger (Boudouaou - Staouéli - Zéralda)",
      bypassPolygonGeoJson: {
        type: 'Polygon',
        coordinates: [
          [
            [3.01, 36.71],
            [3.21, 36.71],
            [3.21, 36.79],
            [3.01, 36.79],
            [3.01, 36.71],
          ],
        ],
      },
    },
    31: {
      wilayaCode: 31,
      wilayaName: 'Oran',
      maxAllowedGvwrTons: 7.5,
      restrictedWindowsMinutes: [
        [7 * 60, 9 * 60 + 30],
        [16 * 60 + 30, 19 * 60],
      ],
      bypassRingRoadName: "4e Boulevard Périphérique d'Oran / Pénétrante Est",
      bypassPolygonGeoJson: {
        type: 'Polygon',
        coordinates: [
          [
            [-0.68, 35.67],
            [-0.58, 35.67],
            [-0.58, 35.73],
            [-0.68, 35.73],
            [-0.68, 35.67],
          ],
        ],
      },
    },
    25: {
      wilayaCode: 25,
      wilayaName: 'Constantine',
      maxAllowedGvwrTons: 5.5,
      restrictedWindowsMinutes: [
        [6 * 60 + 45, 9 * 60 + 15],
        [16 * 60, 18 * 60 + 45],
      ],
      bypassRingRoadName: 'Contournement Autoroute Est-Ouest (El Khroub - Didouche Mourad)',
      bypassPolygonGeoJson: {
        type: 'Polygon',
        coordinates: [
          [
            [6.57, 36.33],
            [6.66, 36.33],
            [6.66, 36.39],
            [6.57, 36.39],
            [6.57, 36.33],
          ],
        ],
      },
    },
  };

  /**
   * PORTE 1 : Conformité Légale & Documentaire Véhicule (ENACTA, Assurance, Agréments)
   */
  evaluateVehicleRegulatoryCompliance(
    vehicle: VehicleStateDto,
    mission: MissionRequestDto,
  ): ViolationDetail[] {
    const violations: ViolationDetail[] = [];

    const depMs = new Date(mission.plannedDepartureUtc).getTime();
    // Fin de mission + 72 heures de marge de sécurité retour
    const requiredValidUntilMs =
      depMs + (mission.estimatedDrivingHours + 72) * 3600 * 1000;
    const requiredDateStr = new Date(requiredValidUntilMs).toISOString().slice(0, 10);

    const docsByType = new Map(vehicle.documents.map((d) => [d.docType, d]));

    const mandatoryDocs: DocumentTypeDZ[] = [
      DocumentTypeDZ.CONTROLE_TECHNIQUE_ENACTA,
      DocumentTypeDZ.ASSURANCE_RC_CATNAT,
      DocumentTypeDZ.VIGNETTE_AUTOMOBILE,
    ];

    const isHeavyCommercial = [
      AssetCategory.HEAVY_TRUCK_RIGID,
      AssetCategory.TRACTOR_TRAILER,
      AssetCategory.REEFER_TRUCK,
      AssetCategory.HAZMAT_TANKER,
    ].includes(vehicle.category);

    if (isHeavyCommercial) {
      mandatoryDocs.push(
        DocumentTypeDZ.AUTORISATION_CIRCULATION_MARCHANDISES,
        DocumentTypeDZ.CERTIFICAT_ETALONNAGE_CHRONOTACHYGRAPHE,
      );
    }

    if (mission.requiresHazmatAdr || vehicle.category === AssetCategory.HAZMAT_TANKER) {
      mandatoryDocs.push(DocumentTypeDZ.AGREMENT_MATIERES_DANGEREUSES_ADR);
    }

    if (mission.requiresReeferColdChain || vehicle.category === AssetCategory.REEFER_TRUCK) {
      mandatoryDocs.push(DocumentTypeDZ.CERTIFICAT_ATP_CHAINE_FROID);
    }

    for (const docType of mandatoryDocs) {
      const doc = docsByType.get(docType);
      if (!doc) {
        violations.push({
          code: `MISSING_${docType}`,
          gate: 'REGULATORY',
          severity: 'HARD_BLOCK',
          messageFr: `Document réglementaire manquant sur ${vehicle.registrationPlate} : ${docType}.`,
          blockingEntityId: vehicle.vehicleId,
        });
        continue;
      }

      if (doc.expiresAt < requiredDateStr) {
        violations.push({
          code: `EXPIRED_OR_EXPIRING_${docType}`,
          gate: 'REGULATORY',
          severity: 'HARD_BLOCK',
          messageFr: `${docType} (${doc.docNumber}) du véhicule ${vehicle.registrationPlate} expire le ${doc.expiresAt} (avant la fin sécurisée de mission fixée au ${requiredDateStr}). Risque de fourrière.`,
          blockingEntityId: vehicle.vehicleId,
        });
      }

      // Contrôle de la périodicité légale ENACTA (6 mois Poids Lourds vs 12 mois VUL)
      if (docType === DocumentTypeDZ.CONTROLE_TECHNIQUE_ENACTA) {
        const maxLegalDays = isHeavyCommercial ? 186 : 366;
        const spanDays = Math.round(
          (new Date(doc.expiresAt).getTime() - new Date(doc.issuedAt).getTime()) /
            (1000 * 3600 * 24),
        );
        if (spanDays > maxLegalDays) {
          violations.push({
            code: 'ENACTA_INVALID_PERIODICITY',
            gate: 'REGULATORY',
            severity: 'HARD_BLOCK',
            messageFr: `Anomalie périodicité ENACTA sur ${vehicle.registrationPlate} : validité de ${spanDays} jours alors que la réglementation algérienne impose ${Math.floor(maxLegalDays / 30)} mois pour ${vehicle.category}.`,
            blockingEntityId: vehicle.vehicleId,
          });
        }
      }
    }

    return violations;
  }

  /**
   * PORTE 1-BIS : Conformité Chauffeur (Permis C1/C2/E, Brevet Professionnel, Temps de conduite)
   */
  evaluateDriverCompliance(
    driver: DriverStateDto,
    vehicle: VehicleStateDto,
    mission: MissionRequestDto,
  ): ViolationDetail[] {
    const violations: ViolationDetail[] = [];

    if (!driver.isAvailable) {
      violations.push({
        code: 'DRIVER_UNAVAILABLE',
        gate: 'REGULATORY',
        severity: 'HARD_BLOCK',
        messageFr: `Le conducteur ${driver.fullName} est indisponible.`,
        blockingEntityId: driver.driverId,
      });
    }

    let requiredLicense = LicenseCategoryDZ.B;
    if (vehicle.category === AssetCategory.TRACTOR_TRAILER) {
      requiredLicense = LicenseCategoryDZ.E;
    } else if (vehicle.grossVehicleWeightTons > 19.0) {
      requiredLicense = LicenseCategoryDZ.C2;
    } else if (vehicle.grossVehicleWeightTons > 3.5) {
      requiredLicense = LicenseCategoryDZ.C1;
    }

    if (!driver.licenseCategories.includes(requiredLicense)) {
      violations.push({
        code: 'DRIVER_LICENSE_MISMATCH',
        gate: 'REGULATORY',
        severity: 'HARD_BLOCK',
        messageFr: `Le conducteur ${driver.fullName} ne possède pas le permis requis (${requiredLicense}) pour conduire ${vehicle.registrationPlate} (${vehicle.grossVehicleWeightTons}T).`,
        blockingEntityId: driver.driverId,
      });
    }

    if (
      [LicenseCategoryDZ.C1, LicenseCategoryDZ.C2, LicenseCategoryDZ.E].includes(requiredLicense) &&
      !driver.hasBrevetProfessionnel
    ) {
      violations.push({
        code: 'MISSING_BREVET_PROFESSIONNEL',
        gate: 'REGULATORY',
        severity: 'HARD_BLOCK',
        messageFr: `Brevet Professionnel Conducteur (BPC) manquant pour ${driver.fullName}.`,
        blockingEntityId: driver.driverId,
      });
    }

    if (
      (mission.requiresHazmatAdr || vehicle.category === AssetCategory.HAZMAT_TANKER) &&
      !driver.hasAdrHazmatCert
    ) {
      violations.push({
        code: 'MISSING_DRIVER_ADR_CERT',
        gate: 'REGULATORY',
        severity: 'HARD_BLOCK',
        messageFr: `Habilitation transport matières dangereuses (ADR) manquante pour ${driver.fullName}.`,
        blockingEntityId: driver.driverId,
      });
    }

    if (driver.continuousDrivingHours >= 4.5) {
      violations.push({
        code: 'DRIVER_CONTINUOUS_DRIVING_EXCEEDED',
        gate: 'REGULATORY',
        severity: 'HARD_BLOCK',
        messageFr: `Temps de conduite continu maximal (4h30) dépassé pour ${driver.fullName} (${driver.continuousDrivingHours}h).`,
        blockingEntityId: driver.driverId,
      });
    }

    if (driver.dailyDrivingHoursToday >= 9.0) {
      violations.push({
        code: 'DRIVER_DAILY_QUOTA_EXHAUSTED',
        gate: 'REGULATORY',
        severity: 'HARD_BLOCK',
        messageFr: `Quota journalier maximal de conduite (9h00) atteint pour ${driver.fullName}.`,
        blockingEntityId: driver.driverId,
      });
    }

    return violations;
  }

  /**
   * PORTE 2 : Restrictions Horaires & Tonnage par Wilaya (Calcul ETD optimal + Polygones Valhalla)
   */
  evaluateWilayaRestrictions(
    vehicle: VehicleStateDto,
    mission: MissionRequestDto,
  ): {
    recommendedEtdUtc: string;
    avoidPolygons: Record<string, unknown>[];
    advisoryNotes: string[];
  } {
    const depDate = new Date(mission.plannedDepartureUtc);
    let recommendedEtd = new Date(depDate.getTime());
    const avoidPolygons: Record<string, unknown>[] = [];
    const advisoryNotes: string[] = [];

    const originRule = this.WILAYA_RESTRICTIONS_DB[mission.originWilayaCode];
    if (originRule && vehicle.grossVehicleWeightTons > originRule.maxAllowedGvwrTons) {
      const depMinutes = depDate.getUTCHours() * 60 + depDate.getUTCMinutes();

      for (const [winStartMin, winEndMin] of originRule.restrictedWindowsMinutes) {
        if (depMinutes >= winStartMin && depMinutes <= winEndMin) {
          // Avancer le départ 30 minutes avant l'interdiction
          const earlyDep = new Date(depDate.getTime());
          earlyDep.setUTCHours(Math.floor((winStartMin - 30) / 60), (winStartMin - 30) % 60, 0, 0);

          recommendedEtd = earlyDep;
          avoidPolygons.push(originRule.bypassPolygonGeoJson);

          const startStr = `${String(Math.floor(winStartMin / 60)).padStart(2, '0')}:${String(winStartMin % 60).padStart(2, '0')}`;
          const endStr = `${String(Math.floor(winEndMin / 60)).padStart(2, '0')}:${String(winEndMin % 60).padStart(2, '0')}`;
          const earlyStr = earlyDep.toISOString().slice(11, 16);

          advisoryNotes.push(
            `[Arrêté Wilaya ${originRule.wilayaCode} - ${originRule.wilayaName}] Interdiction PL > ${originRule.maxAllowedGvwrTons}T entre ${startStr} et ${endStr}. Départ avancé automatiquement à ${earlyStr} UTC + Contournement via ${originRule.bypassRingRoadName}.`,
          );
        }
      }
    }

    const traversedWilayas = new Set([
      ...(mission.transitWilayaCodes || []),
      mission.destinationWilayaCode,
    ]);
    for (const wCode of traversedWilayas) {
      const wRule = this.WILAYA_RESTRICTIONS_DB[wCode];
      if (wRule && vehicle.grossVehicleWeightTons > wRule.maxAllowedGvwrTons) {
        avoidPolygons.push(wRule.bypassPolygonGeoJson);
        advisoryNotes.push(
          `[Routage PL Wilaya ${wRule.wilayaCode} - ${wRule.wilayaName}] Polygone d'évitement urbain injecté dans Valhalla via ${wRule.bypassRingRoadName}.`,
        );
      }
    }

    return {
      recommendedEtdUtc: recommendedEtd.toISOString(),
      avoidPolygons,
      advisoryNotes,
    };
  }

  /**
   * PORTE 3 : Adéquation Métier, Santé Prédictive (VHI) & Durée de Vie Utile Résiduelle (RUL)
   */
  evaluatePredictiveAndTechnicalReadiness(
    vehicle: VehicleStateDto,
    mission: MissionRequestDto,
  ): ViolationDetail[] {
    const violations: ViolationDetail[] = [];

    if (vehicle.maxPayloadTons < mission.requiredPayloadTons) {
      violations.push({
        code: 'INSUFFICIENT_PAYLOAD_CAPACITY',
        gate: 'CAPACITY_MATCH',
        severity: 'HARD_BLOCK',
        messageFr: `Charge utile insuffisante sur ${vehicle.registrationPlate} (${vehicle.maxPayloadTons}T max vs ${mission.requiredPayloadTons}T requis).`,
        blockingEntityId: vehicle.vehicleId,
      });
    }

    if (mission.requiresReeferColdChain && !vehicle.hasWorkingReefer) {
      violations.push({
        code: 'MISSING_WORKING_REEFER',
        gate: 'CAPACITY_MATCH',
        severity: 'HARD_BLOCK',
        messageFr: `Mission Chaîne du Froid : groupe frigorifique absent ou en panne sur ${vehicle.registrationPlate}.`,
        blockingEntityId: vehicle.vehicleId,
      });
    }

    if (mission.requiresPtoHydraulics && !vehicle.hasWorkingPto) {
      violations.push({
        code: 'MISSING_WORKING_PTO',
        gate: 'CAPACITY_MATCH',
        severity: 'HARD_BLOCK',
        messageFr: `Mission BTP/Hydraulique : prise de force (PTO) indisponible sur ${vehicle.registrationPlate}.`,
        blockingEntityId: vehicle.vehicleId,
      });
    }

    const minVhi = this.MIN_VHI_THRESHOLD[mission.targetClimateZone] ?? 50.0;
    if (vehicle.vehicleHealthIndex < minVhi) {
      violations.push({
        code: 'VHI_BELOW_SAFETY_THRESHOLD',
        gate: 'PREDICTIVE_VHI_RUL',
        severity: 'HARD_BLOCK',
        messageFr: `Indice de santé VHI de ${vehicle.registrationPlate} (${vehicle.vehicleHealthIndex}/100) inférieur au seuil minimal exigé (${minVhi}/100) pour la zone ${mission.targetClimateZone}.`,
        blockingEntityId: vehicle.vehicleId,
      });
    }

    for (const dtc of vehicle.activeDtcs || []) {
      if (dtc.severity === 'CRITICAL_STOP') {
        violations.push({
          code: `ACTIVE_CRITICAL_DTC_${dtc.code}`,
          gate: 'PREDICTIVE_VHI_RUL',
          severity: 'HARD_BLOCK',
          messageFr: `Code défaut calculateur critique actif sur ${vehicle.registrationPlate} : [${dtc.code}] ${dtc.description}.`,
          blockingEntityId: vehicle.vehicleId,
        });
      }
    }

    if (vehicle.coolingEwmaResidualC >= 7.5) {
      violations.push({
        code: 'PREDICTIVE_COOLING_RESIDUAL_ANOMALY',
        gate: 'PREDICTIVE_VHI_RUL',
        severity: 'HARD_BLOCK',
        messageFr: `Anomalie thermique prédictive sur le circuit de refroidissement de ${vehicle.registrationPlate} (Résidu EWMA = +${vehicle.coolingEwmaResidualC}°C). Risque de joint de culasse.`,
        blockingEntityId: vehicle.vehicleId,
      });
    }

    if (vehicle.batterySohPct < 45.0) {
      violations.push({
        code: 'PREDICTIVE_BATTERY_STARTER_FAILURE_RISK',
        gate: 'PREDICTIVE_VHI_RUL',
        severity: 'HARD_BLOCK',
        messageFr: `Santé batterie au démarrage (Cranking SOH) critique sur ${vehicle.registrationPlate} (${vehicle.batterySohPct}%).`,
        blockingEntityId: vehicle.vehicleId,
      });
    }

    if (vehicle.hasCriticalDvirFailure) {
      violations.push({
        code: 'DVIR_CRITICAL_FAILURE_BLOCK',
        gate: 'PREDICTIVE_VHI_RUL',
        severity: 'HARD_BLOCK',
        messageFr: `Inspection DVIR pré-trajet non conforme sur ${vehicle.registrationPlate} : anomalie critique constatée interdisant tout départ avant intervention d'atelier.`,
        blockingEntityId: vehicle.vehicleId,
      });
    }

    const alphaDz = this.CLIMATE_SEVERITY_ALPHA[mission.targetClimateZone] ?? 0.75;
    const safetyMult = this.RUL_SAFETY_MULTIPLIER[mission.targetClimateZone] ?? 1.25;
    const requiredRulKm = mission.routeDistanceKm * safetyMult;
    const requiredRulHours = mission.estimatedDrivingHours * safetyMult;

    for (const sub of vehicle.subsystemRuls || []) {
      if (!sub.isCriticalSafety) continue;
      const effectiveRulKm = sub.rulKm * alphaDz;
      const effectiveRulHours = sub.rulEngineHours * alphaDz;

      if (effectiveRulKm < requiredRulKm || effectiveRulHours < requiredRulHours) {
        violations.push({
          code: `INSUFFICIENT_RUL_${sub.taskCode}`,
          gate: 'PREDICTIVE_VHI_RUL',
          severity: 'HARD_BLOCK',
          messageFr: `RUL insuffisant pour [${sub.taskName}] sur ${vehicle.registrationPlate} : RUL effectif ajusté climat = ${Math.round(effectiveRulKm)} km / ${effectiveRulHours.toFixed(1)} h (Exigé : ${Math.round(requiredRulKm)} km / ${requiredRulHours.toFixed(1)} h).`,
          blockingEntityId: vehicle.vehicleId,
        });
      }
    }

    return violations;
  }

  /**
   * Génère automatiquement les Ordres de Travail (OT) Atelier ou Administratifs en cas de blocage
   */
  generateAutomatedWorkOrders(
    vehicle: VehicleStateDto,
    violations: ViolationDetail[],
  ): WorkOrderGenerated[] {
    const workOrders: WorkOrderGenerated[] = [];
    const mechTasks: string[] = [];
    const regTasks: string[] = [];

    for (const v of violations) {
      if (v.blockingEntityId !== vehicle.vehicleId) continue;
      if (v.gate === 'PREDICTIVE_VHI_RUL') mechTasks.push(`[${v.code}] ${v.messageFr}`);
      if (v.gate === 'REGULATORY') regTasks.push(`[${v.code}] ${v.messageFr}`);
    }

    const nowIso = new Date().toISOString();

    if (mechTasks.length > 0) {
      workOrders.push({
        workOrderId: `OT-MECH-${randomUUID().slice(0, 6).toUpperCase()}`,
        vehicleId: vehicle.vehicleId,
        registrationPlate: vehicle.registrationPlate,
        priority: 'URGENT_IMMOBILIZATION',
        category: 'MECHANICAL_PREDICTIVE',
        title: `Intervention Prédictive & Curative Bloquant Dispatch — ${vehicle.registrationPlate}`,
        tasksToPerform: mechTasks,
        estimatedDowntimeHours: 6.0,
        createdAtUtc: nowIso,
      });
    }

    if (regTasks.length > 0) {
      workOrders.push({
        workOrderId: `OT-REG-${randomUUID().slice(0, 6).toUpperCase()}`,
        vehicleId: vehicle.vehicleId,
        registrationPlate: vehicle.registrationPlate,
        priority: 'ADMINISTRATIVE_RENEWAL',
        category: 'REGULATORY_ENACTA_INSURANCE',
        title: `Mise en Conformité Réglementaire (ENACTA / Assurance) — ${vehicle.registrationPlate}`,
        tasksToPerform: regTasks,
        estimatedDowntimeHours: 24.0,
        createdAtUtc: nowIso,
      });
    }

    return workOrders;
  }

  /**
   * Évalue le calendrier des alertes préventives ENACTA (J-30, J-15, J-7, J-0)
   * selon le décret exécutif n° 03-223 du 10 juin 2003
   */
  evaluateEnactaAlertStatus(
    vehicle: VehicleStateDto,
    referenceDateUtc?: string,
  ): {
    daysUntilExpiry: number;
    alertLevel: 'OK' | 'ALERT_J30' | 'ALERT_J15' | 'ALERT_J7' | 'EXPIRED';
    isBlocked: boolean;
    periodicityMonths: number;
    legalReference: string;
    actionRequiredFr: string;
    actionRequiredAr: string;
  } {
    const isHeavy = [
      AssetCategory.HEAVY_TRUCK_RIGID,
      AssetCategory.TRACTOR_TRAILER,
      AssetCategory.REEFER_TRUCK,
      AssetCategory.HAZMAT_TANKER,
    ].includes(vehicle.category);

    const periodicityMonths = isHeavy ? 6 : 12;
    const legalReference = isHeavy
      ? 'Décret exécutif 03-223 Art. 7 (Poids Lourds semestriel)'
      : 'Décret exécutif 03-223 Art. 9 (VUL commercial annuel)';

    const enactaDoc = vehicle.documents.find(
      (d) => d.docType === DocumentTypeDZ.CONTROLE_TECHNIQUE_ENACTA,
    );

    if (!enactaDoc) {
      return {
        daysUntilExpiry: -999,
        alertLevel: 'EXPIRED',
        isBlocked: true,
        periodicityMonths,
        legalReference,
        actionRequiredFr: 'Contrôle technique ENACTA introuvable : passage immédiat obligatoire.',
        actionRequiredAr: 'الفحص التقني إيناكتا مفقود: يجب إجراء الفحص فورا.',
      };
    }

    const refMs = referenceDateUtc ? new Date(referenceDateUtc).getTime() : Date.now();
    const expMs = new Date(enactaDoc.expiresAt).getTime();
    const daysUntilExpiry = Math.ceil((expMs - refMs) / (1000 * 3600 * 24));

    if (daysUntilExpiry <= 0) {
      return {
        daysUntilExpiry,
        alertLevel: 'EXPIRED',
        isBlocked: true,
        periodicityMonths,
        legalReference,
        actionRequiredFr: `Contrôle technique ENACTA expiré depuis ${Math.abs(daysUntilExpiry)} jour(s). Statut BLOCKED_REGULATORY.`,
        actionRequiredAr: `انتهت صلاحية الفحص التقني منذ ${Math.abs(daysUntilExpiry)} يوم. حالة الحجز الإداري مفعلة.`,
      };
    }

    if (daysUntilExpiry <= 7) {
      return {
        daysUntilExpiry,
        alertLevel: 'ALERT_J7',
        isBlocked: false,
        periodicityMonths,
        legalReference,
        actionRequiredFr: `Alerte J-7 : Échéance ENACTA dans ${daysUntilExpiry} jour(s). Prise de rendez-vous urgente requise.`,
        actionRequiredAr: `تنبيه 7 أيام: موعد الفحص التقني بعد ${daysUntilExpiry} أيام. حجز موعد عاجل مطلوب.`,
      };
    }

    if (daysUntilExpiry <= 15) {
      return {
        daysUntilExpiry,
        alertLevel: 'ALERT_J15',
        isBlocked: false,
        periodicityMonths,
        legalReference,
        actionRequiredFr: `Alerte J-15 : Échéance ENACTA dans ${daysUntilExpiry} jours.`,
        actionRequiredAr: `تنبيه 15 يوم: الفحص التقني يستحق بعد ${daysUntilExpiry} يوما.`,
      };
    }

    if (daysUntilExpiry <= 30) {
      return {
        daysUntilExpiry,
        alertLevel: 'ALERT_J30',
        isBlocked: false,
        periodicityMonths,
        legalReference,
        actionRequiredFr: `Alerte J-30 : Échéance ENACTA dans ${daysUntilExpiry} jours. Planification au planning atelier.`,
        actionRequiredAr: `تنبيه 30 يوم: استحقاق الفحص التقني بعد ${daysUntilExpiry} يوما. الإدراج بجدول الورشة.`,
      };
    }

    return {
      daysUntilExpiry,
      alertLevel: 'OK',
      isBlocked: false,
      periodicityMonths,
      legalReference,
      actionRequiredFr: `Conforme. Prochain contrôle dans ${daysUntilExpiry} jours.`,
      actionRequiredAr: `مطابق للشروط. الفحص القادم بعد ${daysUntilExpiry} يوما.`,
    };
  }
}

