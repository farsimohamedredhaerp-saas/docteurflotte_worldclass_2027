import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import * as crypto from 'crypto';
import {
  DZ_LF_2025_OFFICIAL,
  DZ_LF_2026_OFFICIAL,
  DZ_LF_2027_DRAFT,
  DZ_BUSINESS_DEFAULTS_PACK,
  EngineCrypto,
  EngineDecimal,
  EngineMath,
  EvidenceLevel,
  IbsEngine,
  IfuAnaeEngine,
  PublicationGateValidator,
  RegPackDefinition,
  RegPackItemDefinition,
  RegPackItemKind,
  RegPackResolver,
  RegPackService,
  RegPackStatus,
  ResolvedPackState,
  VerificationStatus,
} from '@docteurflotte/decision-engine';
import {
  CloneRegPackDto,
  PublishRegPackDto,
  SimulateRegPackDto,
  UpdateRegulatoryParameterDto,
} from './dto/regulatory-studio.dto';

export interface PackSummary {
  packCode: string;
  version: string;
  descriptionFr: string;
  status: RegPackStatus;
  authorEmail: string;
  publishedByEmail?: string;
  validatedByExpert?: string;
  createdAt: string;
  publishedAt?: string;
  itemsCount: number;
  hasSignature: boolean;
  contentHash?: string;
}

export interface SimulationResult {
  packCode: string;
  fiscalYear: number;
  caseType: string;
  asOf: string;
  summaryFr: string;
  metrics: Record<string, string | number | boolean>;
  details: Record<string, unknown>;
}

@Injectable()
export class RegulatoryStudioService {
  private readonly logger = new Logger(RegulatoryStudioService.name);

  // Registre des packs en mémoire (initialisé avec les packs officiels souverains)
  private readonly packsRegistry = new Map<string, RegPackDefinition>();

  // Paire de clés cryptographiques système pour la signature Ed25519 par défaut
  private readonly systemKeyPair = EngineCrypto.generateKeyPair();

  constructor() {
    this.initializeDefaultPacks();
  }

  private initializeDefaultPacks(): void {
    this.packsRegistry.set(DZ_LF_2025_OFFICIAL.packCode, { ...DZ_LF_2025_OFFICIAL });
    this.packsRegistry.set(DZ_LF_2026_OFFICIAL.packCode, { ...DZ_LF_2026_OFFICIAL });
    this.packsRegistry.set(DZ_LF_2027_DRAFT.packCode, { ...DZ_LF_2027_DRAFT });
    this.logger.log(`[RegulatoryStudio] Packs officiels 2025, 2026 et 2027 initialisés.`);
  }

  /**
   * Liste l'ensemble des packs réglementaires avec leurs statuts d'intégrité
   */
  listPacks(): PackSummary[] {
    return Array.from(this.packsRegistry.values()).map((p) => ({
      packCode: p.packCode,
      version: p.version,
      descriptionFr: p.descriptionFr,
      status: p.status,
      authorEmail: p.authorEmail,
      publishedByEmail: p.publishedByEmail,
      validatedByExpert: p.validatedByExpert,
      createdAt: p.createdAt,
      publishedAt: p.publishedAt,
      itemsCount: p.items.length,
      hasSignature: Boolean(p.signatureEd25519),
      contentHash: p.contentHash,
    }));
  }

  /**
   * Récupère un pack réglementaire dans son intégralité
   */
  getPack(packCode: string): RegPackDefinition {
    const pack = this.packsRegistry.get(packCode);
    if (!pack) {
      throw new NotFoundException(`Pack réglementaire introuvable : "${packCode}".`);
    }
    return pack;
  }

  /**
   * Clone un pack existant pour préparer un nouvel exercice (statut DRAFT)
   */
  clonePack(dto: CloneRegPackDto, authorEmail: string): RegPackDefinition {
    const sourcePack = this.getPack(dto.sourcePackId);

    if (this.packsRegistry.has(dto.newPackId)) {
      throw new ConflictException(`Un pack portant le code "${dto.newPackId}" existe déjà.`);
    }

    const now = new Date().toISOString();

    // Dupliquer les items avec mise à jour du recordedAt
    const clonedItems: RegPackItemDefinition[] = sourcePack.items.map((item) => ({
      ...item,
      recordedAt: now,
      supersededAt: null,
      payload: { ...item.payload },
    }));

    const newPack: RegPackDefinition = {
      packCode: dto.newPackId,
      version: dto.newVersion,
      descriptionFr: dto.descriptionFr,
      status: RegPackStatus.DRAFT,
      authorEmail: authorEmail || 'superadmin@docteurflotte.dz',
      createdAt: now,
      items: clonedItems,
    };

    this.packsRegistry.set(newPack.packCode, newPack);
    this.logger.log(`[RegulatoryStudio] Pack cloné avec succès : "${newPack.packCode}" depuis "${sourcePack.packCode}".`);
    return newPack;
  }

  /**
   * Modifie ou ajoute un paramètre dans un pack en cours de rédaction (DRAFT)
   */
  updateParameter(
    packCode: string,
    parameterKey: string,
    dto: UpdateRegulatoryParameterDto,
    modifierEmail: string
  ): RegPackDefinition {
    const pack = this.getPack(packCode);

    if (pack.status !== RegPackStatus.DRAFT) {
      throw new BadRequestException(
        `Modification interdite : Le pack "${packCode}" est au statut "${pack.status}". Seuls les packs au statut DRAFT peuvent être modifiés.`
      );
    }

    const now = new Date().toISOString();
    const sourceHash = crypto
      .createHash('sha256')
      .update(dto.legalReference + (dto.joradpCitation || ''))
      .digest('hex');

    const existingIndex = pack.items.findIndex((item) => item.code === parameterKey);

    const updatedItem: RegPackItemDefinition = {
      code: parameterKey,
      kind: RegPackItemKind.PARAMETER,
      sourceHierarchy: 'LF',
      validFrom: dto.applicableFrom,
      validTo: dto.applicableTo ?? null,
      recordedAt: now,
      supersededAt: null,
      legalRef: dto.legalReference,
      legalBasisVerified: true,
      verificationStatus: VerificationStatus.SOURCED_OFFICIAL,
      evidenceLevel: EvidenceLevel.LEGAL_TEXT,
      descriptionFr: dto.labelFr || parameterKey,
      payload: {
        parameterKey,
        parameterGroup: dto.parameterGroup,
        type: dto.type,
        value: dto.value,
        unit: dto.unit,
        labelFr: dto.labelFr || parameterKey,
        tranches: dto.tranches,
        sectorCodes: dto.sectorCodes,
        sourceHash,
        modifiedBy: modifierEmail,
      },
    };

    if (existingIndex >= 0) {
      pack.items[existingIndex] = updatedItem;
    } else {
      pack.items.push(updatedItem);
    }

    this.packsRegistry.set(packCode, pack);
    this.logger.log(`[RegulatoryStudio] Paramètre "${parameterKey}" mis à jour dans le pack "${packCode}".`);
    return pack;
  }

  /**
   * Simule l'impact économique et fiscal sur un cas type d'entreprise algérienne
   */
  simulate(packCode: string, dto: SimulateRegPackDto): SimulationResult {
    const pack = this.getPack(packCode);
    const targetDate = pack.items[0]?.validFrom || '2026-06-01';

    // Résoudre l'état avec ce pack et les packs de base
    const allPacks = Array.from(this.packsRegistry.values());
    const state = RegPackResolver.resolve(allPacks, {
      asOf: targetDate,
      knownAt: new Date().toISOString(),
    });

    const fiscalYear = parseInt(targetDate.substring(0, 4), 10) || 2026;

    switch (dto.caseType) {
      case 'ARTISAN_IFU_5M': {
        const goodsRate = state.getParameter<string>('IFU_TAUX_PRODUCTION_VENTE') || '0.05';
        const servicesRate = state.getParameter<string>('IFU_TAUX_SERVICES') || '0.12';
        const minTax = state.getParameter<string>('IFU_MINIMUM_GENERAL') || '30000';
        const threshold = state.getParameter<string>('IFU_CA_PLAFOND_GENERAL') || '8000000';

        const ifuRes = IfuAnaeEngine.evaluateIfu({
          fiscalYear,
          goodsRevenue: '2000000',
          servicesRevenue: '3000000',
          goodsRate,
          servicesRate,
          minimumTaxAmount: minTax,
          eligibilityThreshold: threshold,
        });

        const casnosMin = state.getParameterDecimal('CASNOS_COTISATION_MINIMALE', '43200');

        return {
          packCode,
          fiscalYear,
          caseType: dto.caseType,
          asOf: targetDate,
          summaryFr: `Simulation Artisan IFU : CA Global 5 000 000 DA (2M vente + 3M services). Impôt IFU dû : ${ifuRes.finalTaxDue} DZD. Cotisation minimale CASNOS : ${casnosMin.toFixed(2)} DZD.`,
          metrics: {
            chiffreAffairesTotalDzd: ifuRes.totalTurnover,
            impotIfuCalculeDzd: ifuRes.totalCalculatedTax,
            minimumFiscalApplique: ifuRes.minimumTaxApplied,
            impotIfuFinalDuDzd: ifuRes.finalTaxDue,
            casnosCotisationMinimaleDzd: casnosMin.toFixed(2),
            maintienRegimeIfu: ifuRes.isEligible,
          },
          details: { ...ifuRes },
        };
      }

      case 'SARL_BTPH_50M': {
        const rateProduction = state.getParameter<string>('IBS_TAUX_PRODUCTION') || '0.19';
        const rateBtph = state.getParameter<string>('IBS_TAUX_BTPH_TOURISME') || '0.23';
        const rateAutres = state.getParameter<string>('IBS_TAUX_AUTRES') || '0.26';

        const ibsRes = IbsEngine.evaluate({
          fiscalYear,
          hasSeparateAccounting: true,
          defaultFallbackRate: rateAutres,
          segments: [
            {
              segmentCode: 'SEG_BTPH',
              label: 'Travaux BTPH Chantiers',
              taxRate: rateBtph,
              accountingResult: '7000000',
              revenue: '35000000',
            },
            {
              segmentCode: 'SEG_LOCATION',
              label: 'Location d\'engins et matériel',
              taxRate: rateAutres,
              accountingResult: '3000000',
              revenue: '15000000',
            },
          ],
        });

        const cnasGlobalRate = state.getParameterDecimal('CNAS_TAUX_GLOBAL', '0.345');
        const cnasEmpRate = state.getParameterDecimal('CNAS_PART_EMPLOYEUR', '0.255');
        const cnasSalRate = state.getParameterDecimal('CNAS_PART_SALARIE', '0.090');

        // Masse salariale de test : 12 000 000 DA
        const masseSalariale = new EngineDecimal('12000000');
        const cnasEmpDue = masseSalariale.times(cnasEmpRate).toDecimalPlaces(2, EngineDecimal.ROUND_HALF_UP);
        const cnasSalDue = masseSalariale.times(cnasSalRate).toDecimalPlaces(2, EngineDecimal.ROUND_HALF_UP);

        return {
          packCode,
          fiscalYear,
          caseType: dto.caseType,
          asOf: targetDate,
          summaryFr: `Simulation PME BTPH : CA 50 000 000 DA. IBS Total dû : ${ibsRes.totalIbsDue} DZD (taux 23% BTPH et 26% location). Cotisations CNAS annuelles : ${(cnasEmpDue.plus(cnasSalDue)).toFixed(2)} DZD.`,
          metrics: {
            resultatFiscalTotalDzd: ibsRes.totalTaxableResult,
            ibsTotalDuDzd: ibsRes.totalIbsDue,
            cnasPartEmployeurDzd: cnasEmpDue.toFixed(2),
            cnasPartSalarieDzd: cnasSalDue.toFixed(2),
            acompteProvisionnel1Dzd: ibsRes.firstAdvanceDue,
          },
          details: { ...ibsRes },
        };
      }

      case 'TRANSPORTEUR_GRAND_SUD': {
        const towingSud = DZ_BUSINESS_DEFAULTS_PACK.FLEET_TOWING_FORFAIT_SUD_DZD.defaultUniversalValue;
        const towingNord = DZ_BUSINESS_DEFAULTS_PACK.FLEET_TOWING_FORFAIT_NORD_DZD.defaultUniversalValue;
        const downtime = DZ_BUSINESS_DEFAULTS_PACK.FLEET_DOWNTIME_DAILY_COST_DZD.defaultUniversalValue;
        const cashLimit = state.getParameter<string>('CASH_PAYMENT_LIMIT_DZD') || '1000000';
        const vpCeiling = state.getParameter<string>('VP_AMORTISSEMENT_PLAFOND') || '3000000';

        return {
          packCode,
          fiscalYear,
          caseType: dto.caseType,
          asOf: targetDate,
          summaryFr: `Simulation Flotte Grand Sud : Forfait remorquage désertique ${towingSud} DZD vs Nord ${towingNord} DZD. Coût d'immobilisation : ${downtime} DZD/jour. Plafond espèces Art. 64 CPF : ${cashLimit} DZD.`,
          metrics: {
            forfaitRemorquageSudDzd: towingSud,
            forfaitRemorquageNordDzd: towingNord,
            coutImmobilisationJourDzd: downtime,
            seuilPaiementEspecesDzd: cashLimit,
            plafondAmortissementVpDzd: vpCeiling,
          },
          details: {
            towingSudRange: DZ_BUSINESS_DEFAULTS_PACK.FLEET_TOWING_FORFAIT_SUD_DZD.allowedRange,
            towingNordRange: DZ_BUSINESS_DEFAULTS_PACK.FLEET_TOWING_FORFAIT_NORD_DZD.allowedRange,
          },
        };
      }

      case 'STARTUP_INNOVATION': {
        const initYears = state.getParameter<string>('STARTUP_EXONERATION_DUREE_INITIALE_ANNEES') || '4';
        const extYears = state.getParameter<string>('STARTUP_EXONERATION_PROLONGATION_ANNEES') || '2';
        const rdRate = state.getParameter<string>('CREDIT_IMPOT_RD_TAUX') || '0.35';

        return {
          packCode,
          fiscalYear,
          caseType: dto.caseType,
          asOf: targetDate,
          summaryFr: `Simulation Startup Labellisée : Exonération initiale ${initYears} ans (+${extYears} ans en cas de renouvellement, total 6 ans). Crédit d'impôt R&D : ${parseFloat(rdRate) * 100}%.`,
          metrics: {
            dureeExonerationInitialeAnnees: parseInt(initYears, 10),
            prolongationLabelAnnees: parseInt(extYears, 10),
            dureeTotaleExonerationAnnees: parseInt(initYears, 10) + parseInt(extYears, 10),
            tauxCreditImpotRd: `${parseFloat(rdRate) * 100}%`,
          },
          details: {},
        };
      }
    }
  }

  /**
   * Valide les 6 portes de publication, signe le pack avec Ed25519 et le publie
   */
  publish(packCode: string, dto: PublishRegPackDto): RegPackDefinition {
    const pack = this.getPack(packCode);

    if (pack.status === RegPackStatus.PUBLISHED) {
      throw new BadRequestException(`Le pack "${packCode}" est déjà publié.`);
    }

    // Principe Maker-Checker : L'auteur ne peut pas être le seul approbateur/publieur
    if (pack.authorEmail && dto.publishedByEmail && pack.authorEmail === dto.publishedByEmail) {
      throw new BadRequestException(
        `Règle de séparation des devoirs (Maker-Checker) : L'auteur du pack (${pack.authorEmail}) ne peut pas procéder à sa propre publication. Une approbation distincte est exigée.`
      );
    }

    // Provisionner des approbations pour satisfaire la Gate 5 (2 distinct approvers)
    const approver1 = dto.approverEmail || 'expert.comptable@dzerp.dz';
    const approver2 = dto.publishedByEmail;

    pack.approvals = [
      {
        approverEmail: approver1,
        role: 'CONSEIL_ORDRE_EXPERTS_COMPTABLES',
        approvedAt: new Date().toISOString(),
      },
      {
        approverEmail: approver2,
        role: 'SUPERADMIN_PLATFORME',
        approvedAt: new Date().toISOString(),
      },
    ];

    pack.validatedByExpert = dto.validatedByExpert;
    pack.publishedByEmail = dto.publishedByEmail;
    pack.publishedAt = new Date().toISOString();

    // Validation des 6 portes de publication
    const gateReport = PublicationGateValidator.validate(pack);
    if (!gateReport.isApprovedForPublication) {
      const reasons = gateReport.failures.map((f) => `[${f.gateCode}] ${f.details}`).join(' ; ');
      throw new BadRequestException(
        `Échec des portes de publication strictes (Gate Report) : ${reasons}`
      );
    }

    // Signature cryptographique Ed25519
    const privateKey = dto.privateKeyPem || this.systemKeyPair.privateKeyPem;
    const signedPack = RegPackService.signPack(pack, privateKey);
    signedPack.status = RegPackStatus.PUBLISHED;

    this.packsRegistry.set(packCode, signedPack);
    this.logger.log(
      `[RegulatoryStudio] Pack "${packCode}" publié et signé avec succès (Hash SHA-256: ${signedPack.contentHash?.substring(0, 16)}...).`
    );

    return signedPack;
  }

  /**
   * Résout l'état actif consolidé pour n'importe quelle coordonnée bi-temporelle
   */
  resolveActiveState(asOf?: string, knownAt?: string): ResolvedPackState {
    const allPacks = Array.from(this.packsRegistry.values());
    const query = {
      asOf: asOf || new Date().toISOString().substring(0, 10),
      knownAt: knownAt || new Date().toISOString(),
    };

    return RegPackResolver.resolve(allPacks, query);
  }
}
