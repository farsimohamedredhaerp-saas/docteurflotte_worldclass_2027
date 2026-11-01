// Fichier : apps/api/src/workshop-voice/workshop-voice.service.ts
import { Injectable, Logger, Optional } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { SovereignRagService } from '../sovereign-rag/sovereign-rag.service';
import {
  VoiceQueryDto,
  VoiceRouteResult,
  WorkshopDictionaryEntry,
} from './dto/workshop-voice.dto';

export const DARJA_MECHANICAL_DICTIONARY: WorkshopDictionaryEntry[] = [
  {
    darjaTerm: 'zeyer culasse',
    phoneticVariants: ['zeyer culasse', 'serrage culasse', 'tziyar culasse', 'vis de culasse', 'couple culasse'],
    frenchStandard: 'Couple et angle de serrage de la culasse',
    arabicStandard: 'عزم وزاوية شد براغي رأس الأسطوانة',
    subsystem: 'MOTEUR',
    definition: 'Procédure de serrage au couple et angulaire des vis de culasse moteur.',
  },
  {
    darjaTerm: 'chhal zit',
    phoneticVariants: ['chhal zit', 'quantité zit', 'capacite huile', 'niveau zit', 'combien litre zit', 'vidange saharienne'],
    frenchStandard: 'Capacité et viscosité d huile moteur',
    arabicStandard: 'سعة ولزوجة زيت المحرك للمناطق الصحراوية',
    subsystem: 'MOTEUR',
    definition: 'Volume en litres et norme d huile moteur recommandée pour climat saharien.',
  },
  {
    darjaTerm: 'injecteur m grippi',
    phoneticVariants: ['injecteur mgrippi', 'injecteur m grippi', 'pompe mgrippia', 'pression rail', 'injecteurs', 'défaut injection'],
    frenchStandard: 'Grippage injecteur ou pompe haute pression Common Rail',
    arabicStandard: 'انسداد أو تعطل حواقن الوقود أو مضخة الضغط العالي',
    subsystem: 'INJECTION_CARBURANT',
    definition: 'Diagnostic pression de rampe trop basse ou débit de retour injecteur anormal (DTC P0087).',
  },
  {
    darjaTerm: 'disques farih',
    phoneticVariants: ['disques farih', 'plaquettes mkhasrine', 'usure frein', 'plaquettes finies', 'cote disque'],
    frenchStandard: 'Cotes d usure limite des plaquettes et disques de frein',
    arabicStandard: 'حدود تآكل صفائح وأقراص الفرامل الهوائية',
    subsystem: 'FREINAGE',
    definition: 'Épaisseur minimale réglementaire avant remplacement du disque et des plaquettes.',
  },
  {
    darjaTerm: 'reglage soupape',
    phoneticVariants: ['reglage soupape', 'jeu soupape', 'soupape admission', 'soupape echappement'],
    frenchStandard: 'Jeu aux soupapes admission et échappement à froid',
    arabicStandard: 'خلوص صمامات السحب والعادم على البارد',
    subsystem: 'MOTEUR',
    definition: 'Valeurs de réglage des culbuteurs en millimètres à froid.',
  },
  {
    darjaTerm: 'sonde nox',
    phoneticVariants: ['sonde nox', 'sonde khassra', 'capteur nox', 'spn 3216'],
    frenchStandard: 'Sonde NOx amont catalyseur SCR',
    arabicStandard: 'حساس أكاسيد النيتروجين قبل المحفز',
    subsystem: 'ECHAPPEMENT_FAP',
    definition: 'Contrôle électrique et alimentation de la sonde NOx (DTC SPN 3216 FMI 14).',
  },
  {
    darjaTerm: 'freinage enacta',
    phoneticVariants: ['freinage enacta', 'desequilibre frein', 'controle technique', 'bareme 133'],
    frenchStandard: 'Seuils réglementaires de freinage ENACTA Algérie',
    arabicStandard: 'المعايير القانونية لكفاءة وتوازن الفرامل إيناقتا',
    subsystem: 'SECURITE_HOMOLOGATION',
    definition: 'Seuils éliminatoires du Décret Exécutif 03-223 (50% efficacité, 20% déséquilibre).',
  },
];

@Injectable()
export class WorkshopVoiceService {
  private readonly logger = new Logger(WorkshopVoiceService.name);

  constructor(
    private readonly db: DatabaseService,
    @Optional() private readonly ragService?: SovereignRagService,
  ) {}

  /**
   * Retourne le glossaire mécanique franco-arabe algérien de référence.
   */
  getDictionary(): WorkshopDictionaryEntry[] {
    return DARJA_MECHANICAL_DICTIONARY;
  }

  /**
   * Normalise un terme oral en darja ou français familier vers l'intention mécanique canonique.
   */
  normalizeIntent(rawTranscript: string): {
    matchedEntry: WorkshopDictionaryEntry | null;
    detectedVehicle: string | null;
  } {
    const text = rawTranscript.toLowerCase().trim();

    // 1. Détection du véhicule lourd
    let detectedVehicle: string | null = null;
    if (text.includes('kerax') || text.includes('dxi') || text.includes('renault')) {
      detectedVehicle = 'RENAULT_TRUCKS';
    } else if (text.includes('shacman') || text.includes('weichai') || text.includes('wp12') || text.includes('x3000')) {
      detectedVehicle = 'SHACMAN';
    } else if (text.includes('actros') || text.includes('mercedes') || text.includes('om501')) {
      detectedVehicle = 'MERCEDES_BENZ';
    } else if (text.includes('enacta') || text.includes('visite') || text.includes('controle')) {
      detectedVehicle = 'ENACTA_DZ';
    }

    // 2. Correspondance avec le glossaire phonétique
    let matchedEntry: WorkshopDictionaryEntry | null = null;
    for (const entry of DARJA_MECHANICAL_DICTIONARY) {
      for (const variant of entry.phoneticVariants) {
        if (text.includes(variant)) {
          matchedEntry = entry;
          break;
        }
      }
      if (matchedEntry) break;
    }

    return { matchedEntry, detectedVehicle };
  }

  /**
   * Routeur Déterministe d'Atelier en Court-Circuit (< 400 ms).
   * Interroge directement sovereign_knowledge_vault en SQL SANS passer par un LLM lent.
   */
  async processVoiceQuery(dto: VoiceQueryDto): Promise<VoiceRouteResult> {
    const startTime = performance.now();
    const { matchedEntry, detectedVehicle } = this.normalizeIntent(dto.transcribedText);

    // Cas 1 : Intention identifiée pour un court-circuit déterministe
    if (matchedEntry) {
      const pool = this.db.getPool();
      let dbRecord: any = null;

      if (pool) {
        const query = `
          SELECT section_title, content, structured_specs, model_series, manufacturer
          FROM sovereign_knowledge_vault
          WHERE 
            subsystem = $1
            AND ($2::text IS NULL OR manufacturer = $2)
          ORDER BY 
            CASE WHEN manufacturer = $2 THEN 1 ELSE 2 END,
            created_at ASC
          LIMIT 1;
        `;
        const res = await pool.query(query, [matchedEntry.subsystem, detectedVehicle]);
        if (res.rows.length > 0) {
          dbRecord = res.rows[0];
        }
      }

      // Formatage des réponses vocales bilingues instantanées
      const { spokenFr, spokenDarja } = this.formatSpokenResponse(
        matchedEntry,
        detectedVehicle || dbRecord?.manufacturer || 'Véhicule Flotte',
        dbRecord?.structured_specs || {},
      );

      const elapsed = Math.round(performance.now() - startTime);
      this.logger.log(
        `[WorkshopVoice] Court-circuit déterministe résolu en ${elapsed} ms : "${dto.transcribedText}" -> ${matchedEntry.frenchStandard}`,
      );

      return {
        originalTranscript: dto.transcribedText,
        normalizedIntent: matchedEntry.frenchStandard,
        isDeterministicShortCircuit: true,
        vehicleDetected: detectedVehicle || undefined,
        subsystemDetected: matchedEntry.subsystem,
        spokenResponseFr: spokenFr,
        spokenResponseDarja: spokenDarja,
        structuredData: dbRecord?.structured_specs || {},
        sourceManualReference: dbRecord ? `${dbRecord.manufacturer} (${dbRecord.model_series}) - ${dbRecord.section_title}` : 'Manuel Constructeur Algérie',
        executionMs: elapsed,
      };
    }

    // Cas 2 : Demande libre / complexe — Résolution intelligente via le RAG Hybride & Fallback Web
    if (this.ragService) {
      try {
        const ragResult = await this.ragService.searchHybrid(
          {
            query: dto.transcribedText,
            limit: 1,
            include_synthesis: true,
            enable_web_search: true,
          },
          dto.tenantId,
        );

        if (ragResult.results.length > 0) {
          const topDoc = ragResult.results[0];
          const elapsed = Math.round(performance.now() - startTime);

          const spokenFr =
            ragResult.synthesis ||
            `Documentation trouvée pour ${topDoc.manufacturer} (${topDoc.model_series}) : ${topDoc.section_title}. Consultez les spécifications sur votre écran.`;
          const spokenDarja = `L9ina el ma3loumat ta3 ${topDoc.manufacturer} : ${topDoc.section_title}. Chof l'ecran fiha kolchi.`;

          this.logger.log(
            `[WorkshopVoice] Requête libre résolue via RAG/Web en ${elapsed} ms : "${dto.transcribedText}" -> ${topDoc.section_title}`,
          );

          return {
            originalTranscript: dto.transcribedText,
            normalizedIntent: topDoc.section_title,
            isDeterministicShortCircuit: false,
            vehicleDetected: topDoc.manufacturer,
            subsystemDetected: topDoc.subsystem,
            spokenResponseFr: spokenFr,
            spokenResponseDarja: spokenDarja,
            structuredData: topDoc.structured_specs,
            sourceManualReference: `${topDoc.manufacturer} (${topDoc.model_series}) - ${topDoc.section_title}`,
            executionMs: elapsed,
          };
        }
      } catch (ragErr) {
        this.logger.warn(`Échec de la résolution RAG d'atelier: ${ragErr}`);
      }
    }

    // Cas 3 : Repli si aucun document trouvé
    const elapsed = Math.round(performance.now() - startTime);
    return {
      originalTranscript: dto.transcribedText,
      normalizedIntent: 'REQUETE_EXPLORATOIRE_ATELIER',
      isDeterministicShortCircuit: false,
      vehicleDetected: detectedVehicle || undefined,
      spokenResponseFr: `Demande d'atelier transmise au Copilote décisionnel : "${dto.transcribedText}". Recherche approfondie en cours.`,
      spokenResponseDarja: `Talab mecanicien rahou yet'3alaj fel Copilote : "${dto.transcribedText}".`,
      executionMs: elapsed,
    };
  }

  /**
   * Génère les textes vocaux concis prêts pour la synthèse vocale Web Speech / Piper TTS.
   */
  private formatSpokenResponse(
    entry: WorkshopDictionaryEntry,
    vehicle: string,
    specs: Record<string, any>,
  ): { spokenFr: string; spokenDarja: string } {
    switch (entry.darjaTerm) {
      case 'zeyer culasse': {
        const p1 = specs.step1_torque_nm || 60;
        const p2 = specs.step2_torque_nm || (vehicle === 'SHACMAN' ? 180 : 150);
        const ang = specs.step3_angle_deg || specs.step4_angle_deg || (vehicle === 'SHACMAN' ? 90 : 270);
        return {
          spokenFr: `Culasse ${vehicle} : Serrage en plusieurs passes. Passe 1 à ${p1} Newton-mètres, passe 2 à ${p2} Newton-mètres, puis serrage angulaire final à ${ang} degrés. Vis neuves huilées obligatoires.`,
          spokenDarja: `Zeyer culasse ta3 ${vehicle} : Dir ${p1} Nm fel bdaya, men ba3d ${p2} Nm, w fel lekher dawar ${ang} daraja b'zawiya. Lazem les vis jdad w mzeytin.`,
        };
      }

      case 'chhal zit': {
        const cap = specs.oil_capacity_liters || 36.0;
        const visc = specs.oil_viscosity || '15W-40';
        const norm = specs.oil_standard || 'API CI-4';
        return {
          spokenFr: `Capacité d'huile ${vehicle} : ${cap} Litres avec les filtres. Préconisation pour climat saharien : Huile ${visc} répondant à la norme ${norm}. Intervalle sévère à 15 000 kilomètres.`,
          spokenDarja: `Quantité zit ta3 ${vehicle} : ${cap} litres m3a les filtres. Fel sahwa lazem zit ${visc} norme ${norm}. Vidange kol 15 alef kilometre.`,
        };
      }

      case 'disques farih': {
        const minWear = specs.pad_thickness_min_wear_mm || 3.0;
        const newThick = specs.pad_thickness_new_mm || 21.0;
        const discRebut = specs.disc_thickness_min_mm || 37.0;
        return {
          spokenFr: `Freinage ${vehicle} : Épaisseur minimale des plaquettes à ${minWear} millimètres pour ${newThick} mm à neuf. Cote de rebut du disque ventilé à ${discRebut} millimètres.`,
          spokenDarja: `Freinage ${vehicle} : Les plaquettes lazem ykounou kter men ${minWear} mm. Disque ta3 l'frein ki yelhaq ${discRebut} mm lazem yetbadal fawran.`,
        };
      }

      case 'injecteur m grippi': {
        const maxBar = specs.rail_pressure_max_bar || 1600;
        const maxLeak = specs.max_injector_leak_ml_per_min || 25;
        return {
          spokenFr: `Injection Common Rail ${vehicle} : Pression de rampe normale ${maxBar} bar. Fuite maximale autorisée au retour d'injecteur : ${maxLeak} millilitres par minute. Contrôler le préfiltre décanteur d'eau.`,
          spokenDarja: `Système Common Rail ${vehicle} : Pression ta3 l'rail ${maxBar} bar. Retour injecteur ma ydepasich ${maxLeak} ml f'dqiqa. Chouf filtre décanteur.`,
        };
      }

      case 'freinage enacta': {
        const minEff = specs.min_service_brake_efficiency_pct || 50.0;
        const maxImb = specs.max_steering_axle_imbalance_pct || 20.0;
        return {
          spokenFr: `Contrôle ENACTA : Efficacité minimale du frein de service requise à ${minEff} pour cent. Déséquilibre maximal toléré sur l'essieu avant directeur à ${maxImb} pour cent.`,
          spokenDarja: `Contrôle technique ENACTA : L'kofaa ta3 l'frein lazem tfout ${minEff} fel mya. Déséquilibre fel essieu l'qodami ma ydepasich ${maxImb} fel mya.`,
        };
      }

      default:
        return {
          spokenFr: `Procédure d'atelier trouvée pour ${vehicle} sur le sous-système ${entry.subsystem}.`,
          spokenDarja: `M3loumat technique mawjouda l' ${vehicle} fel sous-système ${entry.subsystem}.`,
        };
    }
  }
}

