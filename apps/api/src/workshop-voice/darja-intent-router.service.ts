import { Injectable, Logger, Optional } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import {
  OemMake,
  OemComponentCode,
  OemFluidCompartment,
  OemTorqueSpec,
  OemFluidCapacity,
  OemDtcFault,
  OFFICIAL_OEM_TORQUE_SPECS,
  OFFICIAL_OEM_FLUID_CAPACITIES,
  OFFICIAL_OEM_DTC_FAULTS,
} from '@docteurflotte/contracts';

export type WorkshopQueryIntent =
  | 'QUERY_TORQUE_SPEC'
  | 'QUERY_FLUID_CAPACITY'
  | 'QUERY_DTC_FAULT'
  | 'WORKSHOP_GENERAL_HELP';

export interface DarjaIntentRoutingResult {
  rawTranscript: string;
  normalizedTranscript: string;
  detectedIntent: WorkshopQueryIntent;
  detectedMake?: OemMake;
  detectedComponent?: OemComponentCode;
  detectedCompartment?: OemFluidCompartment;
  matchedTorqueSpec?: OemTorqueSpec;
  matchedFluidCapacity?: OemFluidCapacity;
  matchedDtcFault?: OemDtcFault;
  executionTimeMs: number;
  answerFr: string;
  answerDarjaAudioText: string;
  confidenceScore: number;
}

@Injectable()
export class DarjaIntentRouterService {
  private readonly logger = new Logger(DarjaIntentRouterService.name);

  constructor(@Optional() private readonly db?: DatabaseService) { }

  /**
   * Route une requête en langage naturel (Darja phonétique ou français d atelier)
   * directement vers la donnée constructeur OEM officielle en moins de 50 ms.
   * Interroge dynamiquement les tables OEM si la base est connectée, avec fallback catalogue certifié.
   */
  async routeWorkshopQueryAsync(rawTranscript: string): Promise<DarjaIntentRoutingResult> {
    const startTime = performance.now();
    const clean = this.normalizeDarjaText(rawTranscript);
    const detectedMake = this.detectMake(clean);

    let detectedIntent: WorkshopQueryIntent = 'WORKSHOP_GENERAL_HELP';
    let detectedComponent: OemComponentCode | undefined;
    let detectedCompartment: OemFluidCompartment | undefined;
    let matchedTorqueSpec: OemTorqueSpec | undefined;
    let matchedFluidCapacity: OemFluidCapacity | undefined;
    let matchedDtcFault: OemDtcFault | undefined;

    const pool = this.db?.getPool();

    // A. Recherche Couple de serrage
    if (this.matchesAny(clean, ['zeyer', 'serrage', 'couple', 'tziyar', 'vis', 'boulon', 'boulonatt', 'tighten'])) {
      detectedIntent = 'QUERY_TORQUE_SPEC';
      detectedComponent = this.detectComponent(clean);
      const targetMake = detectedMake || OemMake.SHACMAN;

      if (pool) {
        try {
          const res = await pool.query<any>(
            `SELECT make, model_family as "modelFamily", engine_code as "engineCode",
                    component_code as "componentCode", component_name_fr as "componentNameFr",
                    component_name_darja as "componentNameDarja",
                    stage_1_torque_nm as "stage1TorqueNm", stage_2_torque_nm as "stage2TorqueNm",
                    stage_3_torque_nm as "stage3TorqueNm", angle_stage_1_degrees as "angleStage1Degrees",
                    notes_dz as "notesDz"
             FROM oem_torque_specs
             WHERE make = $1 AND ($2::text IS NULL OR component_code = $2)
             LIMIT 1`,
            [targetMake, detectedComponent || null],
          );
          if (res.rows.length > 0) {
            matchedTorqueSpec = res.rows[0];
          }
        } catch {
          // Fallback en mémoire
        }
      }

      if (!matchedTorqueSpec) {
        matchedTorqueSpec = OFFICIAL_OEM_TORQUE_SPECS.find(
          (s) => s.make === targetMake && (!detectedComponent || s.componentCode === detectedComponent),
        );
      }
    }
    // B. Recherche Contenance fluides / Huile
    else if (this.matchesAny(clean, ['chhal', 'zit', 'zyt', 'huile', 'capacite', 'litre', 'combien', 'vidange'])) {
      detectedIntent = 'QUERY_FLUID_CAPACITY';
      detectedCompartment = this.detectCompartment(clean);
      const targetMake = detectedMake || OemMake.SHACMAN;

      if (pool) {
        try {
          const res = await pool.query<any>(
            `SELECT make, model_family as "modelFamily", engine_code as "engineCode",
                    compartment_code as "compartmentCode", compartment_name_fr as "compartmentNameFr",
                    compartment_name_darja as "compartmentNameDarja",
                    capacity_liters as "capacityLiters", standard_viscosity as "standardViscosity",
                    saharan_heavy_viscosity as "saharanHeavyViscosity",
                    standard_interval_km as "standardIntervalKm", saharan_interval_km as "saharanIntervalKm"
             FROM oem_fluid_capacities
             WHERE make = $1 AND ($2::text IS NULL OR compartment_code = $2)
             LIMIT 1`,
            [targetMake, detectedCompartment || null],
          );
          if (res.rows.length > 0) {
            matchedFluidCapacity = res.rows[0];
          }
        } catch {
          // Fallback en mémoire
        }
      }

      if (!matchedFluidCapacity) {
        matchedFluidCapacity = OFFICIAL_OEM_FLUID_CAPACITIES.find(
          (f) => f.make === targetMake && (!detectedCompartment || f.compartmentCode === detectedCompartment),
        );
      }
    }
    // C. Recherche Code Défaut DTC / J1939
    else if (this.matchesAny(clean, ['code', 'dtc', 'spn', 'voyant', 'defaut', 'panne', 'moteur naqess'])) {
      detectedIntent = 'QUERY_DTC_FAULT';
      const targetMake = detectedMake || OemMake.SHACMAN;

      matchedDtcFault = OFFICIAL_OEM_DTC_FAULTS.find(
        (d) =>
          d.make === targetMake ||
          clean.includes(d.faultCode.toLowerCase().replace(/\s+/g, '')) ||
          clean.includes('spn 100') ||
          clean.includes('pression'),
      );
    }

    return this.buildRoutingResult(
      rawTranscript,
      clean,
      detectedIntent,
      detectedMake,
      detectedComponent,
      detectedCompartment,
      matchedTorqueSpec,
      matchedFluidCapacity,
      matchedDtcFault,
      startTime,
    );
  }

  /**
   * Version synchrone déterministe
   */
  routeWorkshopQuery(rawTranscript: string): DarjaIntentRoutingResult {
    const startTime = performance.now();
    const clean = this.normalizeDarjaText(rawTranscript);
    const detectedMake = this.detectMake(clean);

    let detectedIntent: WorkshopQueryIntent = 'WORKSHOP_GENERAL_HELP';
    let detectedComponent: OemComponentCode | undefined;
    let detectedCompartment: OemFluidCompartment | undefined;
    let matchedTorqueSpec: OemTorqueSpec | undefined;
    let matchedFluidCapacity: OemFluidCapacity | undefined;
    let matchedDtcFault: OemDtcFault | undefined;

    if (this.matchesAny(clean, ['zeyer', 'serrage', 'couple', 'tziyar', 'vis', 'boulon', 'boulonatt', 'tighten'])) {
      detectedIntent = 'QUERY_TORQUE_SPEC';
      detectedComponent = this.detectComponent(clean);
      const targetMake = detectedMake || OemMake.SHACMAN;
      matchedTorqueSpec = OFFICIAL_OEM_TORQUE_SPECS.find(
        (s) => s.make === targetMake && (!detectedComponent || s.componentCode === detectedComponent),
      );
    } else if (this.matchesAny(clean, ['chhal', 'zit', 'zyt', 'huile', 'capacite', 'litre', 'combien', 'vidange'])) {
      detectedIntent = 'QUERY_FLUID_CAPACITY';
      detectedCompartment = this.detectCompartment(clean);
      const targetMake = detectedMake || OemMake.SHACMAN;
      matchedFluidCapacity = OFFICIAL_OEM_FLUID_CAPACITIES.find(
        (f) => f.make === targetMake && (!detectedCompartment || f.compartmentCode === detectedCompartment),
      );
    } else if (this.matchesAny(clean, ['code', 'dtc', 'spn', 'voyant', 'defaut', 'panne', 'moteur naqess'])) {
      detectedIntent = 'QUERY_DTC_FAULT';
      const targetMake = detectedMake || OemMake.SHACMAN;
      matchedDtcFault = OFFICIAL_OEM_DTC_FAULTS.find(
        (d) =>
          d.make === targetMake ||
          clean.includes(d.faultCode.toLowerCase().replace(/\s+/g, '')) ||
          clean.includes('spn 100') ||
          clean.includes('pression'),
      );
    }

    return this.buildRoutingResult(
      rawTranscript,
      clean,
      detectedIntent,
      detectedMake,
      detectedComponent,
      detectedCompartment,
      matchedTorqueSpec,
      matchedFluidCapacity,
      matchedDtcFault,
      startTime,
    );
  }

  private buildRoutingResult(
    rawTranscript: string,
    clean: string,
    detectedIntent: WorkshopQueryIntent,
    detectedMake?: OemMake,
    detectedComponent?: OemComponentCode,
    detectedCompartment?: OemFluidCompartment,
    matchedTorqueSpec?: OemTorqueSpec,
    matchedFluidCapacity?: OemFluidCapacity,
    matchedDtcFault?: OemDtcFault,
    startTime = performance.now(),
  ): DarjaIntentRoutingResult {
    let answerFr = '';
    let answerDarjaAudioText = '';

    if (matchedTorqueSpec) {
      answerFr = `Serrage Culasse/Pièce ${matchedTorqueSpec.make} (${matchedTorqueSpec.engineCode}) : Passe 1: ${matchedTorqueSpec.stage1TorqueNm} Nm, Passe 2: ${matchedTorqueSpec.stage2TorqueNm || '-'} Nm, Passe 3: ${matchedTorqueSpec.stage3TorqueNm || '-'} Nm, Angle: +${matchedTorqueSpec.angleStage1Degrees || 0}°. ${matchedTorqueSpec.notesDz || ''}`;
      answerDarjaAudioText = `Serrage ${matchedTorqueSpec.componentNameDarja || matchedTorqueSpec.componentNameFr} : Zeyer d abord f ${matchedTorqueSpec.stage1TorqueNm} Newton, men ba3d ${matchedTorqueSpec.stage2TorqueNm} Nm, w zidlou zawiya f ${matchedTorqueSpec.angleStage1Degrees} daraja.`;
    } else if (matchedFluidCapacity) {
      answerFr = `Contenance ${matchedFluidCapacity.compartmentNameFr} ${matchedFluidCapacity.make} (${matchedFluidCapacity.engineCode}) : ${matchedFluidCapacity.capacityLiters} Litres. Viscosité saharienne: ${matchedFluidCapacity.saharanHeavyViscosity}. Intervalle: ${matchedFluidCapacity.saharanIntervalKm} km.`;
      answerDarjaAudioText = `Fih ${matchedFluidCapacity.capacityLiters} litra zit f ${matchedFluidCapacity.compartmentNameDarja || matchedFluidCapacity.compartmentNameFr}. F el Sahara dir zit ${matchedFluidCapacity.saharanHeavyViscosity} w baddel f ${matchedFluidCapacity.saharanIntervalKm} km.`;
    } else if (matchedDtcFault) {
      answerFr = `Défaut ${matchedDtcFault.faultCode} (${matchedDtcFault.make}) : ${matchedDtcFault.descriptionFr}. Action: ${matchedDtcFault.immediateActionFr}`;
      answerDarjaAudioText = matchedDtcFault.darjaAudioCue || `Défaut ${matchedDtcFault.faultCode} : ${matchedDtcFault.descriptionFr}.`;
    } else {
      answerFr = `Demande d atelier reçue pour ${detectedMake || 'véhicule'}. Veuillez préciser la pièce (culasse, bielle) ou le fluide (moteur, boîte, pont).`;
      answerDarjaAudioText = `Koul-li wach rak theb tchouf: zit el moteur, zit el boite, wela serrage el culasse?`;
    }

    const executionTimeMs = Math.round((performance.now() - startTime) * 100) / 100;

    return {
      rawTranscript,
      normalizedTranscript: clean,
      detectedIntent,
      detectedMake,
      detectedComponent,
      detectedCompartment,
      matchedTorqueSpec,
      matchedFluidCapacity,
      matchedDtcFault,
      executionTimeMs,
      answerFr,
      answerDarjaAudioText,
      confidenceScore: matchedTorqueSpec || matchedFluidCapacity || matchedDtcFault ? 0.96 : 0.65,
    };
  }

  private normalizeDarjaText(input: string): string {
    return (input || '')
      .toLowerCase()
      .trim()
      .replace(/['’\-]/g, ' ')
      .replace(/\s+/g, ' ');
  }

  private detectMake(clean: string): OemMake | undefined {
    if (this.matchesAny(clean, ['shacman', 'chakman', 'weichai', 'wp10', 'wp12', 'f3000', 'x3000'])) {
      return OemMake.SHACMAN;
    }
    if (this.matchesAny(clean, ['renault', 'kerax', 'dxi', 'dti', 'k440', 'rvi', 'magnum'])) {
      return OemMake.RENAULT_TRUCKS;
    }
    if (this.matchesAny(clean, ['man', 'tgx', 'tgs', 'd26', 'd20'])) {
      return OemMake.MAN;
    }
    if (this.matchesAny(clean, ['actros', 'mercedes', 'om501', 'om502', '3340', 'benz'])) {
      return OemMake.MERCEDES_ACTROS;
    }
    return undefined;
  }

  private detectComponent(clean: string): OemComponentCode {
    if (this.matchesAny(clean, ['culasse', 'rass', 'chapeau culasse', 'joint de culasse'])) {
      return OemComponentCode.CYLINDER_HEAD;
    }
    if (this.matchesAny(clean, ['bielle', 'chapeau bielle', 'bayla'])) {
      return OemComponentCode.CON_ROD;
    }
    if (this.matchesAny(clean, ['palier', 'vilebrequin', 'vilo'])) {
      return OemComponentCode.MAIN_BEARING;
    }
    if (this.matchesAny(clean, ['injecteur', 'porte injecteur', 'bride'])) {
      return OemComponentCode.INJECTOR_CLAMP;
    }
    if (this.matchesAny(clean, ['volant', 'volant moteur'])) {
      return OemComponentCode.FLYWHEEL;
    }
    if (this.matchesAny(clean, ['roue', 'rwayed', 'ecrou', 'boulonatt rwayed'])) {
      return OemComponentCode.WHEEL_NUTS;
    }
    return OemComponentCode.CYLINDER_HEAD;
  }

  private detectCompartment(clean: string): OemFluidCompartment {
    if (this.matchesAny(clean, ['boite', 'la boite', 'gearbox', 'vitesse', 'rapport'])) {
      return OemFluidCompartment.GEARBOX;
    }
    if (this.matchesAny(clean, ['pont', 'el pont', 'differentiel', 'axle', 'tandem'])) {
      return OemFluidCompartment.REAR_AXLE;
    }
    if (this.matchesAny(clean, ['eau', 'maa', 'radiateur', 'refroidissement', 'liquide'])) {
      return OemFluidCompartment.COOLING_SYSTEM;
    }
    if (this.matchesAny(clean, ['assisté', 'direction', 'volant direction'])) {
      return OemFluidCompartment.POWER_STEERING;
    }
    return OemFluidCompartment.ENGINE_SUMP;
  }

  private matchesAny(text: string, keywords: string[]): boolean {
    return keywords.some((kw) => text.includes(kw));
  }
}
