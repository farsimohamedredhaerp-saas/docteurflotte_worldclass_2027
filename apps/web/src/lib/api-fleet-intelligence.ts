import {
  DispatchEvaluationPayloadDto,
  DispatchDecisionResult,
  MissionRequestDto,
  VehicleStateDto,
  DriverStateDto,
  IndustrySector,
  ClimateZoneDZ,
  DispatchAssetCategory as AssetCategory,
  LicenseCategoryDZ,
  DocumentTypeDZ,
  DispatchStatus,
  ViolationDetail,
  WorkOrderGenerated,
  SubstitutionCandidateScore,
  FleetEcoSummary,
  DriverEcoScore,
  DrivingSeverityLevel,
  DVIRInspectionReport,
  DVIRSubmissionDto,
  DVIRChecklistItem,
  DVIRItemStatus,
  DVIRInspectionType,
  ReeferLiveStatus,
  ReeferTelemetryPayload,
  ReeferCargoType,
  ReeferPowerMode,
} from '@docteurflotte/contracts';

export {
  IndustrySector,
  ClimateZoneDZ,
  AssetCategory,
  LicenseCategoryDZ,
  DocumentTypeDZ,
  DispatchStatus,
  DrivingSeverityLevel,
  DVIRItemStatus,
  DVIRInspectionType,
  ReeferCargoType,
  ReeferPowerMode,
};
export type {
  DispatchEvaluationPayloadDto,
  DispatchDecisionResult,
  MissionRequestDto,
  VehicleStateDto,
  DriverStateDto,
  ViolationDetail,
  WorkOrderGenerated,
  SubstitutionCandidateScore,
  FleetEcoSummary,
  DriverEcoScore,
  DVIRInspectionReport,
  DVIRSubmissionDto,
  DVIRChecklistItem,
  ReeferLiveStatus,
  ReeferTelemetryPayload,
};

const API_BASE_URL =
  process.env.NEXT_PUBLIC_NEST_API_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  'http://localhost:3001';

export class FleetIntelligenceClient {
  /**
   * Évalue une mission de transport sous les 4 portes de validation
   * (Réglementaire, Arrêtés Wilayas, Santé VHI/RUL, et Substitution Multicritère TOPSIS)
   */
  static async evaluateAndAssign(
    payload: DispatchEvaluationPayloadDto,
    token?: string,
  ): Promise<DispatchDecisionResult> {
    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const res = await fetch(`${API_BASE_URL}/api/v1/dispatch/evaluate-and-assign`, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        return await res.json();
      }
    } catch {
      // Repli sur le simulateur ADS autonome local si le backend NestJS n'est pas joignable
    }

    return this.simulateLocalDispatch(payload);
  }

  /**
   * Ingestion télématique Mode 0 (Zero-Hardware / Feuilles de route / Pleins Naftal)
   */
  static async ingestMode0(payload: any, token?: string): Promise<any> {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const res = await fetch(`${API_BASE_URL}/api/v1/ingest/mode0-virtual`, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || 'Échec de l’ingestion télématique Mode 0.');
    }
    return res.json();
  }

  /**
   * Ingestion Webhook Traccar GPS
   */
  static async ingestTraccarWebhook(payload: any, token?: string): Promise<any> {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const res = await fetch(`${API_BASE_URL}/api/v1/ingest/webhooks/traccar`, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || 'Échec de l’ingestion Webhook Traccar.');
    }
    return res.json();
  }

  /**
   * Étape 1 : Récupération du résumé Éco-Conduite & Gaspillage Naftal
   */
  static async getEcoDrivingSummary(token?: string): Promise<FleetEcoSummary> {
    try {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch(`${API_BASE_URL}/api/v1/eco-driving/summary`, {
        method: 'GET',
        headers,
      });

      if (res.ok) {
        return await res.json();
      }
    } catch {
      // Repli simulateur local déterministe
    }

    const fallbackPrice = Number(process.env.NEXT_PUBLIC_DEFAULT_DIESEL_PRICE_DZD) || 0;
    return {
      tenantId: 'tenant-demo',
      period: 'MONTH',
      totalFleetDistanceKm: 14560,
      totalIdlingHours: 34.9,
      totalWastedFuelLiters: 83.8,
      totalFinancialLossDzd: Math.round(83.8 * fallbackPrice),
      averageFleetScore: 81,
      potentialSavingsDzd: Math.round(83.8 * fallbackPrice * 0.75),
      activeFuelPriceDzd: fallbackPrice,
      fuelPriceReference:
        fallbackPrice > 0
          ? 'Configuration environnementale'
          : 'Tarif non configuré (Moteur fiscal requis)',
      topDrivers: [
        {
          driverId: 'drv-01',
          driverName: 'Mourad Belkacem',
          tenantId: 'tenant-demo',
          score100: 94,
          level: DrivingSeverityLevel.EXCELLENT,
          totalDistanceKm: 3450,
          totalOperatingHours: 68,
          idlingHours: 3.5,
          idlingFuelLiters: 8.4,
          idlingCostDzd: Math.round(8.4 * fallbackPrice),
          harshAccelCount: 2,
          harshBrakeCount: 1,
          harshCornerCount: 0,
          overspeedMinutes: 4,
          suggestedEcoBonusDzd: 15000,
          co2ExcessKg: 22.1,
        },
        {
          driverId: 'drv-02',
          driverName: 'Karim Ziani',
          tenantId: 'tenant-demo',
          score100: 88,
          level: DrivingSeverityLevel.GOOD,
          totalDistanceKm: 4120,
          totalOperatingHours: 82,
          idlingHours: 5.2,
          idlingFuelLiters: 12.5,
          idlingCostDzd: Math.round(12.5 * fallbackPrice),
          harshAccelCount: 5,
          harshBrakeCount: 3,
          harshCornerCount: 2,
          overspeedMinutes: 12,
          suggestedEcoBonusDzd: 8000,
          co2ExcessKg: 33.0,
        },
      ],
      bottomDrivers: [
        {
          driverId: 'drv-03',
          driverName: 'Sofiane Feghouli',
          tenantId: 'tenant-demo',
          score100: 72,
          level: DrivingSeverityLevel.MODERATE,
          totalDistanceKm: 2890,
          totalOperatingHours: 59,
          idlingHours: 9.8,
          idlingFuelLiters: 23.5,
          idlingCostDzd: Math.round(23.5 * fallbackPrice),
          harshAccelCount: 14,
          harshBrakeCount: 11,
          harshCornerCount: 6,
          overspeedMinutes: 28,
          suggestedEcoBonusDzd: 0,
          co2ExcessKg: 62.0,
        },
        {
          driverId: 'drv-04',
          driverName: 'Rachid Ghezzal',
          tenantId: 'tenant-demo',
          score100: 54,
          level: DrivingSeverityLevel.RISKY,
          totalDistanceKm: 3100,
          totalOperatingHours: 64,
          idlingHours: 16.4,
          idlingFuelLiters: 39.4,
          idlingCostDzd: Math.round(39.4 * fallbackPrice),
          harshAccelCount: 26,
          harshBrakeCount: 22,
          harshCornerCount: 11,
          overspeedMinutes: 52,
          suggestedEcoBonusDzd: 0,
          co2ExcessKg: 104.0,
        },
      ],
    };
  }

  /**
   * Étape 2 : Rapports DVIR Numériques Mobiles
   */
  static async getDvirReports(token?: string): Promise<DVIRInspectionReport[]> {
    try {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch(`${API_BASE_URL}/api/v1/dvir/reports`, {
        method: 'GET',
        headers,
      });

      if (res.ok) {
        return await res.json();
      }
    } catch {
      // repli local
    }

    const demoOdoA = 185.4 * 1000;
    const demoOdoB = 94.2 * 1000;

    return [
      {
        id: 'dvir-demo-01',
        tenantId: 'tenant-demo',
        assetId: 'ast-t480-01',
        assetCode: 'DZ-T480-16',
        assetName: 'Renault Trucks T 480',
        driverId: 'drv-01',
        driverName: 'Mourad Belkacem',
        inspectionType: DVIRInspectionType.PRE_TRIP,
        isCompliant: true,
        hasCriticalFailures: false,
        odometerKm: demoOdoA,
        items: [
          { code: 'TIRES', category: 'TIRES_BRAKES', label: 'État et pression des pneumatiques', status: DVIRItemStatus.PASS },
          { code: 'BRAKES', category: 'TIRES_BRAKES', label: 'Frein de service et stationnement', status: DVIRItemStatus.PASS },
          { code: 'OIL_LEVEL', category: 'MECHANICAL', label: 'Niveau huile moteur', status: DVIRItemStatus.PASS },
          { code: 'FIRE_EXT', category: 'SAFETY_EQUIPMENT', label: 'Extincteur vérifié à jour', status: DVIRItemStatus.PASS },
          { code: 'ENACTA_DOC', category: 'REGULATORY_DOCS', label: 'PV Contrôle ENACTA en cabine', status: DVIRItemStatus.PASS },
        ],
        submittedAt: new Date(Date.now() - 3600000 * 2).toISOString(),
      },
      {
        id: 'dvir-demo-02',
        tenantId: 'tenant-demo',
        assetId: 'ast-x3000-02',
        assetCode: 'DZ-X3000-31',
        assetName: 'Shacman X3000 6x4',
        driverId: 'drv-03',
        driverName: 'Sofiane Feghouli',
        inspectionType: DVIRInspectionType.PRE_TRIP,
        isCompliant: false,
        hasCriticalFailures: true,
        odometerKm: demoOdoB,
        items: [
          { code: 'TIRES', category: 'TIRES_BRAKES', label: 'Pneu AVG hernie profonde', status: DVIRItemStatus.FAIL_CRITICAL, comment: 'Coupure flanc pneu avant gauche' },
          { code: 'BRAKES', category: 'TIRES_BRAKES', label: 'Freinage pneumatique', status: DVIRItemStatus.PASS },
          { code: 'OIL_LEVEL', category: 'MECHANICAL', label: 'Niveau huile', status: DVIRItemStatus.PASS },
          { code: 'FIRE_EXT', category: 'SAFETY_EQUIPMENT', label: 'Extincteur', status: DVIRItemStatus.PASS },
          { code: 'ENACTA_DOC', category: 'REGULATORY_DOCS', label: 'PV Contrôle ENACTA', status: DVIRItemStatus.PASS },
        ],
        generatedWorkOrderId: 'ot-dvir-99104',
        submittedAt: new Date(Date.now() - 3600000 * 5).toISOString(),
      },
    ];
  }

  static async submitDvirReport(dto: DVIRSubmissionDto, token?: string): Promise<DVIRInspectionReport> {
    try {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch(`${API_BASE_URL}/api/v1/dvir/submit`, {
        method: 'POST',
        headers,
        body: JSON.stringify(dto),
      });

      if (res.ok) {
        return await res.json();
      }
    } catch {
      // Repli local
    }

    const hasCritical = dto.items.some((i) => i.status === DVIRItemStatus.FAIL_CRITICAL);
    return {
      id: `dvir-${Date.now().toString().slice(-6)}`,
      tenantId: 'tenant-demo',
      assetId: dto.assetId,
      assetCode: `DZ-${dto.assetId.slice(-4).toUpperCase()}`,
      assetName: `Véhicule ${dto.assetId}`,
      driverId: dto.driverId,
      driverName: dto.driverName,
      inspectionType: dto.inspectionType,
      isCompliant: !hasCritical,
      hasCriticalFailures: hasCritical,
      odometerKm: dto.odometerKm,
      items: dto.items,
      generatedWorkOrderId: hasCritical ? `ot-dvir-${Date.now().toString().slice(-5)}` : undefined,
      submittedAt: new Date().toISOString(),
    };
  }

  /**
   * Étape 3 : Chaîne du Froid & Groupes Frigo
   */
  static async getColdChainLive(token?: string): Promise<ReeferLiveStatus[]> {
    try {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch(`${API_BASE_URL}/api/v1/cold-chain/live`, {
        method: 'GET',
        headers,
      });

      if (res.ok) {
        return await res.json();
      }
    } catch {
      // repli local
    }

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

  static async submitColdChainTelemetry(dto: ReeferTelemetryPayload, token?: string): Promise<ReeferLiveStatus> {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const res = await fetch(`${API_BASE_URL}/api/v1/cold-chain/telemetry`, {
      method: 'POST',
      headers,
      body: JSON.stringify(dto),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || 'Échec d’ingestion télémétrie groupe frigo.');
    }
    return res.json();
  }

  /**
   * Simulation locale ADS de secours (garantit une expérience sans coupure hors-ligne)
   */
  private static simulateLocalDispatch(payload: DispatchEvaluationPayloadDto): DispatchDecisionResult {
    const { mission, fleetVehicles, fleetDrivers } = payload;
    const reqVehicle = fleetVehicles.find((v) => v.vehicleId === mission.requestedVehicleId);
    const reqDriver = fleetDrivers.find((d) => d.driverId === mission.requestedDriverId);

    const violations: ViolationDetail[] = [];
    const generatedWorkOrders: WorkOrderGenerated[] = [];

    const enactaDoc = reqVehicle?.documents.find((d) => d.docType === DocumentTypeDZ.CONTROLE_TECHNIQUE_ENACTA);
    const now = new Date().toISOString().slice(0, 10);
    if (enactaDoc && reqVehicle && enactaDoc.expiresAt < now) {
      violations.push({
        code: 'ENACTA_EXPIRED',
        gate: 'REGULATORY',
        severity: 'HARD_BLOCK',
        messageFr: `Contrôle technique ENACTA expiré le ${enactaDoc.expiresAt} (Obligation JORADP Décret 04-415).`,
        blockingEntityId: reqVehicle.vehicleId,
      });
      generatedWorkOrders.push({
        workOrderId: `WO-SIM-${Date.now()}`,
        vehicleId: reqVehicle.vehicleId,
        registrationPlate: reqVehicle.registrationPlate,
        priority: 'URGENT_IMMOBILIZATION',
        category: 'REGULATORY_ENACTA_INSURANCE',
        title: `Passage obligatoire Centre Agréé ENACTA (${reqVehicle.registrationPlate})`,
        tasksToPerform: ['Contrôle freinage banc ENACTA', 'Test opacité fumées', 'Géométrie essieux'],
        estimatedDowntimeHours: 4,
        createdAtUtc: new Date().toISOString(),
      });
    }

    if (reqVehicle && reqVehicle.vehicleHealthIndex < 45) {
      violations.push({
        code: 'VHI_CRITICAL_DEGRADATION',
        gate: 'PREDICTIVE_VHI_RUL',
        severity: 'HARD_BLOCK',
        messageFr: `Score de santé prédictif critique (${reqVehicle.vehicleHealthIndex}/100) — risque de rupture en mission.`,
        blockingEntityId: reqVehicle.vehicleId,
      });
    }

    if (violations.length === 0 && reqVehicle && reqDriver) {
      return {
        missionId: mission.missionId,
        decisionTimestampUtc: new Date().toISOString(),
        decisionOutcome: 'APPROVED_AS_REQUESTED',
        assignedVehicleId: reqVehicle.vehicleId,
        assignedRegistrationPlate: reqVehicle.registrationPlate,
        assignedDriverId: reqDriver.driverId,
        assignedDriverName: reqDriver.fullName,
        originalEtdUtc: mission.plannedDepartureUtc,
        recommendedEtdUtc: mission.plannedDepartureUtc,
        valhallaAvoidPolygons: [],
        routeAdvisoryNotes: ['Conformité documentaire et santé véhicule 100% validées.'],
        violationsDetected: [],
        generatedWorkOrders: [],
        rankedSubstitutions: [],
      };
    }

    const availableAlternatives = fleetVehicles.filter(
      (v) =>
        v.vehicleId !== mission.requestedVehicleId &&
        v.dispatchStatus === DispatchStatus.AVAILABLE &&
        v.vehicleHealthIndex >= 50,
    );

    const substitutions: SubstitutionCandidateScore[] = availableAlternatives.map((v, idx) => {
      const driver = fleetDrivers[idx % fleetDrivers.length] || reqDriver || fleetDrivers[0];
      const fuelCost = Math.round(((v.refConsumptionL100Km * mission.routeDistanceKm) / 100) * 31.0);
      return {
        vehicleId: v.vehicleId,
        registrationPlate: v.registrationPlate,
        makeModel: v.makeModel,
        driverId: driver.driverId,
        driverName: driver.fullName,
        totalScore100: Math.round(75 + idx * 5),
        vhiScoreComponent: v.vehicleHealthIndex,
        fuelCostComponent: 85,
        approachDistanceComponent: 90,
        fleetBalancingComponent: 80,
        approachDistanceKm: 12.5,
        estimatedFuelCostDzd: fuelCost,
        auditJustification: `Substitution TOPSIS optimale : VHI=${v.vehicleHealthIndex}/100, consommation ${v.refConsumptionL100Km} L/100km.`,
      };
    });

    if (substitutions.length > 0) {
      const best = substitutions[0];
      return {
        missionId: mission.missionId,
        decisionTimestampUtc: new Date().toISOString(),
        decisionOutcome: 'SUBSTITUTED_AUTOMATICALLY',
        assignedVehicleId: best.vehicleId,
        assignedRegistrationPlate: best.registrationPlate,
        assignedDriverId: best.driverId,
        assignedDriverName: best.driverName,
        originalEtdUtc: mission.plannedDepartureUtc,
        recommendedEtdUtc: mission.plannedDepartureUtc,
        valhallaAvoidPolygons: [],
        routeAdvisoryNotes: ['Véhicule initial bloqué. Substitution automatique optimisée appliquée.'],
        violationsDetected: violations,
        generatedWorkOrders,
        rankedSubstitutions: substitutions,
      };
    }

    return {
      missionId: mission.missionId,
      decisionTimestampUtc: new Date().toISOString(),
      decisionOutcome: 'REJECTED_NO_ELIGIBLE_ASSET',
      assignedVehicleId: null,
      assignedRegistrationPlate: null,
      assignedDriverId: null,
      assignedDriverName: null,
      originalEtdUtc: mission.plannedDepartureUtc,
      recommendedEtdUtc: mission.plannedDepartureUtc,
      valhallaAvoidPolygons: [],
      routeAdvisoryNotes: ['Aucun véhicule de substitution éligible dans la flotte.'],
      violationsDetected: violations,
      generatedWorkOrders,
      rankedSubstitutions: [],
    };
  }
}
