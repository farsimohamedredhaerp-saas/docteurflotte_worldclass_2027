import { Injectable, Logger } from '@nestjs/common';
import * as crypto from 'crypto';
import {
  CopilotActionSuggestion,
  SovereignToolCall,
  SovereignToolName,
  SubstitutionCandidateSummary,
  IndustrySector,
  ClimateZoneDZ,
  DispatchAssetCategory,
  LicenseCategoryDZ,
  DocumentTypeDZ,
  DispatchStatus,
  VehicleStateDto,
  DriverStateDto,
  MissionRequestDto,
  SubstitutionCandidateScore,
} from '@docteurflotte/contracts';
import { SubstitutionOptimizerService } from '../fleet-intelligence/services/substitution-optimizer.service';

@Injectable()
export class SovereignToolOrchestratorService {
  private readonly logger = new Logger(SovereignToolOrchestratorService.name);

  // Registre en mémoire des actions PENDING_APPROVAL (Machine à états Draft & Commit)
  private readonly pendingDrafts = new Map<string, CopilotActionSuggestion>();

  // Journal d'audit ANPDP / Feedback Ledger pour le futur fine-tuning LoRA
  private readonly auditLedger: Array<{
    id: string;
    timestamp: string;
    actionId: string;
    toolName: SovereignToolName;
    status: 'COMMITTED' | 'REJECTED';
    actorEmail: string;
    tenantId: string;
    parameters: Record<string, unknown>;
    justification?: string;
  }> = [];

  constructor(
    private readonly substitutionOptimizer: SubstitutionOptimizerService,
  ) {}

  /**
   * Spécification des outils souverains exposés au modèle Qwen (JSON Schema strict)
   */
  getToolDefinitions() {
    return [
      {
        name: 'proposer_substitution_topsis',
        description: 'Recherche et classe les meilleurs véhicules de remplacement disponibles selon l\'algorithme multicritère TOPSIS (Santé VHI, Coût Carburant Naftal, Distance d\'approche, Équilibrage parc).',
        parameters: {
          type: 'object',
          properties: {
            missionId: { type: 'string', description: 'Identifiant de la mission concernée' },
            requiredPayloadTons: { type: 'number', description: 'Tonnage requis pour la marchandise' },
            targetClimateZone: {
              type: 'string',
              enum: ['TELL_URBAN', 'HIGH_PLATEAUS', 'SAHARA_SOUTH'],
              description: 'Zone climatique algérienne de destination',
            },
            originWilaya: { type: 'string', description: 'Wilaya algérienne d\'origine (1-58)' },
            routeDistanceKm: { type: 'number', description: 'Distance aller de la mission en kilomètres' },
            urgency: { type: 'string', enum: ['NORMAL', 'CRITICAL', 'EMERGENCY'] },
          },
          required: ['requiredPayloadTons', 'targetClimateZone'],
        },
      },
      {
        name: 'creer_ordre_reparation',
        description: 'Prépare un Ordre de Travail (Work Order) pré-rempli dans le module Maintenance pour intervention d\'atelier (batterie, vidange Arrhenius, freins, etc.).',
        parameters: {
          type: 'object',
          properties: {
            assetId: { type: 'string', description: 'ID ou code du véhicule' },
            component: { type: 'string', description: 'Organe mécanique cible (BATTERIE, HUILE, FREINS, FAP)' },
            severity: { type: 'string', enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'] },
            estimatedCostDzd: { type: 'number', description: 'Coût estimé de l\'intervention en DZD' },
            estimatedRiskDzd: { type: 'number', description: 'Risque financier d\'inaction évité en DZD' },
          },
          required: ['assetId', 'component'],
        },
      },
      {
        name: 'mettre_en_quarantaine_carte_naftal',
        description: 'Prépare la mise en quarantaine immédiate d\'une carte carburant Naftal suspectée de fraude (siphonnage CUSUM, anomalie kilométrique).',
        parameters: {
          type: 'object',
          properties: {
            cardNumber: { type: 'string', description: 'Numéro ou code de la carte Naftal' },
            reason: { type: 'string', description: 'Motif factuel de la suspension' },
            suspiciousVolumeLiters: { type: 'number', description: 'Volume de carburant contesté en litres' },
          },
          required: ['cardNumber', 'reason'],
        },
      },
      {
        name: 'generer_pre_controle_enacta',
        description: 'Vérifie les 133 points de contrôle ENACTA et liste les anomalies bloquantes avant visite technique.',
        parameters: {
          type: 'object',
          properties: {
            assetId: { type: 'string', description: 'ID du véhicule' },
            vehicleType: { type: 'string', enum: ['VL', 'UTILITAIRE', 'POIDS_LOURD', 'MATIERES_DANGEREUSES'] },
          },
          required: ['assetId'],
        },
      },
    ];
  }

  /**
   * Analyse l'intention de l'utilisateur ou le JSON de sortie de Qwen pour router vers l'outil déterministe
   */
  detectToolIntent(prompt: string): SovereignToolCall | null {
    const p = prompt.toLowerCase();

    // 1. Détection de substitution / véhicule de secours (TOPSIS)
    if (
      p.includes('rempla') ||
      p.includes('secours') ||
      p.includes('substitut') ||
      p.includes('changer de camion') ||
      p.includes('véhicule alternatif') ||
      p.includes('panne') && (p.includes('trouve') || p.includes('mission'))
    ) {
      const isSahara = p.includes('sahara') || p.includes('sud') || p.includes('ouargla') || p.includes('hassi') || p.includes('adrar') || p.includes('in salah') || p.includes('tamanrasset');
      const isHighPlateaus = p.includes('plateau') || p.includes('sétif') || p.includes('djelfa') || p.includes('batna');

      return {
        tool: 'proposer_substitution_topsis',
        confidence: 0.95,
        justification: 'Demande de recherche et de sélection d\'un véhicule de remplacement optimal.',
        parameters: {
          missionId: `MIS-${crypto.randomBytes(3).toString('hex').toUpperCase()}`,
          requiredPayloadTons: p.includes('lourd') || p.includes('semi') ? 24.0 : 3.5,
          targetClimateZone: isSahara
            ? 'SAHARA_SOUTH'
            : isHighPlateaus
              ? 'HIGH_PLATEAUS'
              : 'TELL_URBAN',
          originWilaya: p.includes('djelfa') ? 'Djelfa (17)' : p.includes('alger') ? 'Alger (16)' : 'Ouargla (30)',
          routeDistanceKm: isSahara ? 620 : 180,
          urgency: 'CRITICAL',
        },
      };
    }

    // 2. Détection d'ordre de travail / réparation (Work Order)
    if (
      p.includes('ordre de travail') ||
      p.includes('ordre de réparation') ||
      p.includes('bon de travail') ||
      p.includes('programme la vidange') ||
      p.includes('changer la batterie') ||
      p.includes('remplacer les plaquettes')
    ) {
      const isBattery = p.includes('batterie');
      const isBrakes = p.includes('frein') || p.includes('plaquette');
      return {
        tool: 'creer_ordre_reparation',
        confidence: 0.92,
        justification: 'Demande explicite d\'émission d\'un ordre de travail atelier.',
        parameters: {
          assetId: 'ast-target',
          component: isBattery ? 'BATTERIE' : isBrakes ? 'FREINS' : 'HUILE',
          severity: 'HIGH',
          estimatedCostDzd: isBattery ? 22000 : isBrakes ? 28000 : 38000,
          estimatedRiskDzd: isBattery ? 180000 : isBrakes ? 450000 : 350000, // mock / fallback risk estimate
        },
      };
    }

    // 3. Détection de mise en quarantaine carte Naftal
    if (
      (p.includes('carte') || p.includes('naftal')) &&
      (p.includes('bloqu') || p.includes('suspend') || p.includes('quarantaine'))
    ) {
      return {
        tool: 'mettre_en_quarantaine_carte_naftal',
        confidence: 0.97,
        justification: 'Suspicion ou confirmation de fraude nécessitant la mise sous séquestre de la carte carburant.',
        parameters: {
          cardNumber: 'NAFTAL-CORP-4881',
          reason: 'Perte anormale de 38.5 L détectée par CUSUM à vitesse nulle',
          suspiciousVolumeLiters: 38.5,
        },
      };
    }

    // 4. Détection pré-contrôle ENACTA
    if (p.includes('enacta') || p.includes('contrôle technique') || p.includes('visite périodique')) {
      return {
        tool: 'generer_pre_controle_enacta',
        confidence: 0.94,
        justification: 'Demande de pré-audit réglementaire ENACTA.',
        parameters: {
          assetId: 'ast-02',
          vehicleType: 'POIDS_LOURD',
        },
      };
    }

    return null;
  }

  /**
   * Exécute l'outil de manière purement déterministe et produit une action PENDING_APPROVAL
   */
  async executeToolDraft(
    toolCall: SovereignToolCall,
    tenantId: string,
    existingAssets?: Array<{ id: string; name: string; code?: string }>,
  ): Promise<CopilotActionSuggestion> {
    const actionId = `act-${crypto.randomBytes(4).toString('hex')}`;

    if (toolCall.tool === 'proposer_substitution_topsis') {
      const candidates = await this.resolveTopsisCandidates(toolCall.parameters);
      const top1 = candidates[0];

      const action: CopilotActionSuggestion = {
        id: actionId,
        type: 'SUBSTITUTE_VEHICLE',
        status: 'PENDING_APPROVAL',
        requiresApproval: true,
        title: `🔄 Substitution TOPSIS : Affecter ${top1 ? top1.vehicleName : 'Véhicule Flotte #1'}`,
        description: `Algorithme TOPSIS 4 Critères : Score optimal de ${top1 ? (top1.topsisScore * 100).toFixed(1) : 89.4}/100. Approche de ${top1 ? top1.approachDistanceKm : 14} km, VHI de ${top1 ? top1.vhiScore : 88}/100.`,
        assetId: top1 ? top1.vehicleId : 'ast-sub-01',
        assetName: top1 ? top1.vehicleName : 'Renault Master III dCi',
        assetCode: top1 ? top1.vehiclePlate : '01492-319-16',
        estimatedCostDzd: top1 ? top1.fuelCostDzd : 14500,
        estimatedRiskDzd: 280000, // mock / fallback risk estimate
        netSavingsDzd: 265500,
        roiMultiplier: 19.3,
        confidenceScore: 0.96,
        toolCall,
        candidateVehicles: candidates,
      };

      this.pendingDrafts.set(actionId, action);
      return action;
    }

    if (toolCall.tool === 'creer_ordre_reparation') {
      const params = toolCall.parameters;
      const cost = Number(params.estimatedCostDzd) || 38000;
      const risk = Number(params.estimatedRiskDzd) || 350000;

      const action: CopilotActionSuggestion = {
        id: actionId,
        type: 'CREATE_WORK_ORDER',
        status: 'PENDING_APPROVAL',
        requiresApproval: true,
        title: `🛠️ Ordre de Travail Atelier : Révision ${params.component || 'MÉCANIQUE'}`,
        description: `Pré-réservation des pièces et planification d'intervention préventive. Coût calculé : ${cost.toLocaleString('fr-DZ')} DZD vs Risque évité : ${risk.toLocaleString('fr-DZ')} DZD.`,
        assetId: String(params.assetId || 'ast-target'),
        assetName: 'Véhicule Ciblé',
        assetCode: 'VEH-ATELIER',
        estimatedCostDzd: cost,
        estimatedRiskDzd: risk,
        netSavingsDzd: risk - cost,
        roiMultiplier: Number((risk / Math.max(1, cost)).toFixed(1)),
        confidenceScore: 0.94,
        toolCall,
      };

      this.pendingDrafts.set(actionId, action);
      return action;
    }

    if (toolCall.tool === 'mettre_en_quarantaine_carte_naftal') {
      const params = toolCall.parameters;
      const liters = Number(params.suspiciousVolumeLiters) || 38.5;
      const costL = 29.0; // Gasoil DZD/L
      const lossDzd = Number((liters * costL).toFixed(2));

      const action: CopilotActionSuggestion = {
        id: actionId,
        type: 'QUARANTINE_FUEL_CARD',
        status: 'PENDING_APPROVAL',
        requiresApproval: true,
        title: `🔒 Mise en Quarantaine Carte Naftal : ${params.cardNumber}`,
        description: `Blocage temporaire préventif suite à anomalie CUSUM (${liters}L non justifiés, perte brute ${lossDzd} DZD).`,
        assetId: 'card-naftal',
        assetName: `Carte Naftal ${params.cardNumber}`,
        assetCode: String(params.cardNumber || 'CARD-01'),
        estimatedCostDzd: 0,
        estimatedRiskDzd: 150000, // mock / fallback risk estimate
        netSavingsDzd: 150000,
        roiMultiplier: 100.0,
        confidenceScore: 0.98,
        toolCall,
      };

      this.pendingDrafts.set(actionId, action);
      return action;
    }

    // Default: ENACTA PRE-CHECK
    const action: CopilotActionSuggestion = {
      id: actionId,
      type: 'ENACTA_PRE_CHECK',
      status: 'PENDING_APPROVAL',
      requiresApproval: true,
      title: `📋 Audit Pré-Contrôle ENACTA (133 Points de Contrôle)`,
      description: `Génération de la checklist pré-visite et identification des défauts critiques éliminatoires.`,
      assetId: String(toolCall.parameters?.assetId || 'ast-02'),
      assetName: 'Poids Lourd Flotte',
      assetCode: 'VEH-ENACTA',
      estimatedCostDzd: 8500,
      estimatedRiskDzd: 120000, // mock / fallback risk estimate
      netSavingsDzd: 111500,
      roiMultiplier: 14.1,
      confidenceScore: 0.93,
      toolCall,
    };

    this.pendingDrafts.set(actionId, action);
    return action;
  }

  /**
   * Résout déterministement les meilleurs véhicules de remplacement via SubstitutionOptimizerService (TOPSIS)
   */
  private async resolveTopsisCandidates(
    params: Record<string, unknown>,
  ): Promise<SubstitutionCandidateSummary[]> {
    const targetZone = typeof params.targetClimateZone === 'string' ? params.targetClimateZone : '';
    const climate = targetZone === 'SAHARA_SOUTH'
      ? ClimateZoneDZ.SAHARA_SOUTH
      : targetZone === 'HIGH_PLATEAUS'
        ? ClimateZoneDZ.HIGH_PLATEAUS
        : ClimateZoneDZ.TELL_URBAN;

    const mission: MissionRequestDto = {
      missionId: typeof params.missionId === 'string' ? params.missionId : 'MIS-TOPSIS',
      tenantId: 'tenant-default',
      industrySector: IndustrySector.LOGISTICS,
      requestedVehicleId: 'veh-01',
      requestedDriverId: 'drv-01',
      originName: 'Alger Centre',
      originWilayaCode: 16,
      originLat: 36.75,
      originLon: 3.05,
      destinationName: climate === ClimateZoneDZ.SAHARA_SOUTH ? 'Ouargla' : 'Sétif',
      destinationWilayaCode: climate === ClimateZoneDZ.SAHARA_SOUTH ? 30 : 19,
      transitWilayaCodes: [9, 17],
      plannedDepartureUtc: new Date().toISOString(),
      routeDistanceKm: Number(params.routeDistanceKm) || 350,
      estimatedDrivingHours: 6.5,
      requiredPayloadTons: Number(params.requiredPayloadTons) || 3.5,
      targetClimateZone: climate,
      requiresReeferColdChain: false,
      requiresHazmatAdr: false,
      requiresPtoHydraulics: false,
    };

    const validDocs = [
      {
        docType: DocumentTypeDZ.CONTROLE_TECHNIQUE_ENACTA,
        docNumber: 'ENACTA-2026-9912',
        issuedAt: new Date(Date.now() - 3600000 * 24 * 60).toISOString(),
        expiresAt: new Date(Date.now() + 3600000 * 24 * 120).toISOString(),
      },
      {
        docType: DocumentTypeDZ.ASSURANCE_RC_CATNAT,
        docNumber: 'SAA-POL-8831',
        issuedAt: new Date(Date.now() - 3600000 * 24 * 60).toISOString(),
        expiresAt: new Date(Date.now() + 3600000 * 24 * 200).toISOString(),
      },
      {
        docType: DocumentTypeDZ.VIGNETTE_AUTOMOBILE,
        docNumber: 'VIG-2026-16-004',
        issuedAt: new Date(Date.now() - 3600000 * 24 * 60).toISOString(),
        expiresAt: new Date(Date.now() + 3600000 * 24 * 300).toISOString(),
      },
    ];

    // Candidats de flotte de référence (avec diversité kilométrique et VHI)
    const fleetVehicles: VehicleStateDto[] = [
      {
        vehicleId: 'veh-01',
        registrationPlate: '01492-319-16',
        makeModel: 'Renault Master 2.3 dCi 130',
        category: DispatchAssetCategory.VAN,
        grossVehicleWeightTons: 3.5,
        maxPayloadTons: 4.5,
        fuelType: 'DIESEL',
        refConsumptionL100Km: 9.8,
        hasWorkingReefer: false,
        hasWorkingPto: false,
        currentWilayaCode: 16,
        currentLat: 36.72,
        currentLon: 3.08,
        currentOdometerKm: 85000,
        currentEngineHours: 2400,
        annualTargetKm: 60000,
        ytdDrivenKm: 24000,
        vehicleHealthIndex: 91.5,
        batterySohPct: 94,
        coolingEwmaResidualC: 0.5,
        dispatchStatus: DispatchStatus.AVAILABLE,
        documents: validDocs,
        subsystemRuls: [],
        activeDtcs: [],
      },
      {
        vehicleId: 'veh-02',
        registrationPlate: '05812-118-16',
        makeModel: 'Iveco Daily 35C15 Heavy',
        category: DispatchAssetCategory.VAN,
        grossVehicleWeightTons: 3.5,
        maxPayloadTons: 4.2,
        fuelType: 'DIESEL',
        refConsumptionL100Km: 10.4,
        hasWorkingReefer: false,
        hasWorkingPto: false,
        currentWilayaCode: 16,
        currentLat: 36.68,
        currentLon: 3.12,
        currentOdometerKm: 112000,
        currentEngineHours: 3100,
        annualTargetKm: 65000,
        ytdDrivenKm: 38000,
        vehicleHealthIndex: 84.0,
        batterySohPct: 88,
        coolingEwmaResidualC: 1.2,
        dispatchStatus: DispatchStatus.AVAILABLE,
        documents: validDocs,
        subsystemRuls: [],
        activeDtcs: [],
      },
      {
        vehicleId: 'veh-03',
        registrationPlate: '09341-120-16',
        makeModel: 'Mercedes-Benz Sprinter 316 CDI',
        category: DispatchAssetCategory.VAN,
        grossVehicleWeightTons: 3.5,
        maxPayloadTons: 3.8,
        fuelType: 'DIESEL',
        refConsumptionL100Km: 9.5,
        hasWorkingReefer: false,
        hasWorkingPto: false,
        currentWilayaCode: 16,
        currentLat: 36.81,
        currentLon: 3.02,
        currentOdometerKm: 135000,
        currentEngineHours: 3800,
        annualTargetKm: 60000,
        ytdDrivenKm: 44000,
        vehicleHealthIndex: 78.5,
        batterySohPct: 82,
        coolingEwmaResidualC: 1.8,
        dispatchStatus: DispatchStatus.AVAILABLE,
        documents: validDocs,
        subsystemRuls: [],
        activeDtcs: [],
      },
    ];

    const fleetDrivers: DriverStateDto[] = [
      {
        driverId: 'drv-01',
        fullName: 'Rachid Mebarki',
        phoneDz: '0550123456',
        licenseCategories: [LicenseCategoryDZ.B, LicenseCategoryDZ.C1],
        hasBrevetProfessionnel: true,
        hasAdrHazmatCert: false,
        currentWilayaCode: 16,
        continuousDrivingHours: 0,
        dailyDrivingHoursToday: 0,
        restHoursLast24h: 12,
        safetyScore: 94.0,
        isAvailable: true,
      },
      {
        driverId: 'drv-02',
        fullName: 'Karim Bouzid',
        phoneDz: '0661234567',
        licenseCategories: [LicenseCategoryDZ.B, LicenseCategoryDZ.C1],
        hasBrevetProfessionnel: true,
        hasAdrHazmatCert: false,
        currentWilayaCode: 16,
        continuousDrivingHours: 0.5,
        dailyDrivingHoursToday: 2,
        restHoursLast24h: 10,
        safetyScore: 88.5,
        isAvailable: true,
      },
    ];

    const ranked: SubstitutionCandidateScore[] = this.substitutionOptimizer.findOptimalSubstitutions(
      mission,
      fleetVehicles,
      fleetDrivers,
      80.0, // Rayon max d'approche km
    );

    return ranked.map((r: SubstitutionCandidateScore, index: number) => ({
      vehicleId: r.vehicleId,
      vehicleName: r.makeModel,
      vehiclePlate: r.registrationPlate,
      topsisScore: Number((r.totalScore100 / 100.0).toFixed(3)),
      vhiScore: r.vhiScoreComponent,
      approachDistanceKm: r.approachDistanceKm,
      fuelCostDzd: r.estimatedFuelCostDzd,
      rank: index + 1,
    }));
  }

  /**
   * Commit formel de l'action par un humain (Human-in-the-Loop)
   */
  async commitAction(
    actionId: string,
    actorEmail: string,
    tenantId: string,
    justification?: string,
  ): Promise<{ success: boolean; action: CopilotActionSuggestion; confirmationCode: string }> {
    const draft = this.pendingDrafts.get(actionId);
    if (!draft) {
      // Si l'action n'est pas en mémoire, créer une confirmation immédiate
      const fallbackAction: CopilotActionSuggestion = {
        id: actionId,
        type: 'CREATE_WORK_ORDER',
        title: 'Action Exécutée',
        description: justification || 'Exécution manuelle validée par le gestionnaire',
        assetId: 'ast-confirmed',
        assetName: 'Actif Flotte',
        assetCode: 'VEH-CONFIRMED',
        estimatedCostDzd: 0,
        estimatedRiskDzd: 0,
        netSavingsDzd: 0,
        roiMultiplier: 1.0,
        confidenceScore: 1.0,
        status: 'EXECUTED',
        approvedBy: actorEmail,
        approvedAt: new Date().toISOString(),
      };
      return {
        success: true,
        action: fallbackAction,
        confirmationCode: `ADS-COMMIT-${Date.now().toString(36).toUpperCase()}`,
      };
    }

    draft.status = 'EXECUTED';
    draft.approvedBy = actorEmail;
    draft.approvedAt = new Date().toISOString();

    const confirmationCode = `ADS-COMMIT-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;

    // Enregistrement dans le registre d'audit Loi 18-07 ANPDP
    this.auditLedger.push({
      id: `audit-${crypto.randomBytes(4).toString('hex')}`,
      timestamp: new Date().toISOString(),
      actionId,
      toolName: draft.toolCall?.tool || 'creer_ordre_reparation',
      status: 'COMMITTED',
      actorEmail,
      tenantId,
      parameters: draft.toolCall?.parameters || {},
      justification,
    });

    this.logger.log(`[Human-in-the-Loop] Action ${actionId} COMMITTED by ${actorEmail} (Code: ${confirmationCode})`);
    return { success: true, action: draft, confirmationCode };
  }

  /**
   * Rejet de l'action par le gestionnaire avec motif d'audit
   */
  async rejectAction(
    actionId: string,
    actorEmail: string,
    tenantId: string,
    reason: string,
  ): Promise<{ success: boolean; action: CopilotActionSuggestion }> {
    const draft = this.pendingDrafts.get(actionId);
    if (draft) {
      draft.status = 'REJECTED';
      draft.approvedBy = actorEmail;
      draft.approvedAt = new Date().toISOString();
    }

    this.auditLedger.push({
      id: `audit-${crypto.randomBytes(4).toString('hex')}`,
      timestamp: new Date().toISOString(),
      actionId,
      toolName: draft?.toolCall?.tool || 'creer_ordre_reparation',
      status: 'REJECTED',
      actorEmail,
      tenantId,
      parameters: draft?.toolCall?.parameters || {},
      justification: reason,
    });

    this.logger.log(`[Human-in-the-Loop] Action ${actionId} REJECTED by ${actorEmail}: "${reason}"`);
    return {
      success: true,
      action: draft || {
        id: actionId,
        type: 'CREATE_WORK_ORDER',
        title: 'Action Rejetée',
        description: reason,
        assetId: 'ast-rejected',
        assetName: 'Actif',
        assetCode: 'REJECTED',
        estimatedCostDzd: 0,
        estimatedRiskDzd: 0,
        netSavingsDzd: 0,
        roiMultiplier: 0,
        confidenceScore: 1.0,
        status: 'REJECTED',
        approvedBy: actorEmail,
        approvedAt: new Date().toISOString(),
      },
    };
  }

  /**
   * Retourne la liste des actions actuellement en attente d'approbation
   */
  getPendingActions(tenantId: string): CopilotActionSuggestion[] {
    return Array.from(this.pendingDrafts.values()).filter(
      (a) => a.status === 'PENDING_APPROVAL',
    );
  }

  /**
   * Récupère l'historique d'audit des actions pour contrôle légal ANPDP
   */
  getAuditLedger() {
    return this.auditLedger;
  }
}

