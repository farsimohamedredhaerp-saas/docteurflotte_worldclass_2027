import { Injectable } from '@nestjs/common';

export interface TopsisCandidate {
  matricule: string;
  modele: string;
  vhi_score: number; // Vehicle Health Index (0-100)
  distance_km: number; // Distance par rapport au point de panne
  conso_moyenne_l100: number; // L/100km
  capacite_tonnes: number;
  score_topsis_final?: number;
}

@Injectable()
export class DeterministicFleetToolsService {
  /**
   * Algorithme TOPSIS déterministe (Technique for Order of Preference by Similarity to Ideal Solution)
   * Pondérations : VHI (40% - Max), Proximité (35% - Min), Consommation (25% - Min)
   */
  async executeTopsisSubstitution(params: {
    matricule_en_panne: string;
    wilaya_actuelle: number;
    tonnage_requis_tonnes: number;
  }): Promise<{ best_candidate: TopsisCandidate; alternatives: TopsisCandidate[] }> {
    // Simulation de requête SQL TimescaleDB des véhicules disponibles (status = 'IDLE' et VHI >= 75)
    const candidates: TopsisCandidate[] = [
      {
        matricule: '00512-118-16',
        modele: 'Renault Kerax 440 DXi',
        vhi_score: 91,
        distance_km: 38,
        conso_moyenne_l100: 36.5,
        capacite_tonnes: 26,
      },
      {
        matricule: '01209-115-09',
        modele: 'Shacman X3000 420',
        vhi_score: 84,
        distance_km: 19,
        conso_moyenne_l100: 39.2,
        capacite_tonnes: 30,
      },
      {
        matricule: '00881-114-16',
        modele: 'Iveco Trakker 410',
        vhi_score: 79,
        distance_km: 65,
        conso_moyenne_l100: 35.8,
        capacite_tonnes: 25,
      },
    ].filter((c) => c.capacite_tonnes >= params.tonnage_requis_tonnes);

    if (candidates.length === 0) {
      throw new Error(`Aucun véhicule disponible avec une capacité utile d'au moins ${params.tonnage_requis_tonnes} tonnes.`);
    }

    const weights = { vhi: 0.4, dist: 0.35, conso: 0.25 };

    // 1. Normalisation vectorielle euclidienne
    const normVhi = Math.sqrt(candidates.reduce((acc, c) => acc + Math.pow(c.vhi_score, 2), 0)) || 1.0;
    const normDist = Math.sqrt(candidates.reduce((acc, c) => acc + Math.pow(c.distance_km, 2), 0)) || 1.0;
    const normConso = Math.sqrt(candidates.reduce((acc, c) => acc + Math.pow(c.conso_moyenne_l100, 2), 0)) || 1.0;

    const weightedMatrix = candidates.map((c) => ({
      ...c,
      v_vhi: (c.vhi_score / normVhi) * weights.vhi, // Critère à maximiser
      v_dist: (c.distance_km / normDist) * weights.dist, // Critère à minimiser
      v_conso: (c.conso_moyenne_l100 / normConso) * weights.conso, // Critère à minimiser
    }));

    // 2. Solutions idéales positive (A+) et négative (A-)
    const idealPositive = {
      vhi: Math.max(...weightedMatrix.map((m) => m.v_vhi)),
      dist: Math.min(...weightedMatrix.map((m) => m.v_dist)),
      conso: Math.min(...weightedMatrix.map((m) => m.v_conso)),
    };
    const idealNegative = {
      vhi: Math.min(...weightedMatrix.map((m) => m.v_vhi)),
      dist: Math.max(...weightedMatrix.map((m) => m.v_dist)),
      conso: Math.max(...weightedMatrix.map((m) => m.v_conso)),
    };

    // 3. Calcul des distances euclidiennes S+ et S- et du score de proximité C*
    const scored = weightedMatrix
      .map((m) => {
        const sPlus = Math.sqrt(
          Math.pow(m.v_vhi - idealPositive.vhi, 2) +
            Math.pow(m.v_dist - idealPositive.dist, 2) +
            Math.pow(m.v_conso - idealPositive.conso, 2),
        );
        const sMinus = Math.sqrt(
          Math.pow(m.v_vhi - idealNegative.vhi, 2) +
            Math.pow(m.v_dist - idealNegative.dist, 2) +
            Math.pow(m.v_conso - idealNegative.conso, 2),
        );
        const score = sPlus + sMinus === 0 ? 1.0 : Number((sMinus / (sPlus + sMinus)).toFixed(4));
        return {
          matricule: m.matricule,
          modele: m.modele,
          vhi_score: m.vhi_score,
          distance_km: m.distance_km,
          conso_moyenne_l100: m.conso_moyenne_l100,
          capacite_tonnes: m.capacite_tonnes,
          score_topsis_final: score,
        };
      })
      .sort((a, b) => (b.score_topsis_final ?? 0) - (a.score_topsis_final ?? 0));

    return { best_candidate: scored[0], alternatives: scored.slice(1) };
  }

  /**
   * Pré-audit réglementaire ENACTA (Croisement DTC J1939 + Échéances)
   */
  async compileEnactaPreCheck(matricule: string) {
    return {
      matricule,
      statut_pre_visite: 'RISQUE_CONTRE_VISITE_BLOQUANT',
      score_conformite_sur_133: 128,
      anomalies_bloquantes: [
        {
          code_enacta: 'FR-204',
          section: 'Freinage Pneumatique',
          detail: 'Temps de montée en pression réservoir auxiliaire > 4.2s (Seuil max: 3.5s) détecté sur bus CAN SPN 1087.',
          action_requise: 'Purger le dessiccateur d’air et vérifier le clapet 4 voies.',
        },
        {
          code_enacta: 'PL-102',
          section: 'Émissions & Antipollution',
          detail: 'DTC actif SPN 3226 (Capteur NOx aval défaillant) — Allumage voyant MIL tableau de bord.',
          action_requise: 'Remplacement sonde ou nettoyage injecteur AdBlue avant passage au banc.',
        },
      ],
    };
  }
}

