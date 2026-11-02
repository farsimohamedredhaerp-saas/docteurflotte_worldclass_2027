import { z } from 'zod';

export enum ToolExecutionPolicy {
  READ_COMPUTE = 'READ_COMPUTE',       // Exécution directe sans confirmation
  DRAFT_MUTATION = 'DRAFT_MUTATION',   // Génère un Draft nécessitant un Commit humain
}

// 1. Validation Zod stricte (Garde-fou Runtime)
export const TopsisReplacementSchema = z.object({
  matricule_en_panne: z.string().regex(/^\d{5,6}-\d{3}-\d{2}$/, 'Format matricule DZ invalide (ex: 00412-116-16)'),
  wilaya_actuelle: z.number().int().min(1).max(58),
  wilaya_destination: z.number().int().min(1).max(58),
  tonnage_requis_tonnes: z.number().min(1).max(60),
  motif_panne: z.string().min(3),
});

export const CreateWorkOrderSchema = z.object({
  matricule: z.string().regex(/^\d{5,6}-\d{3}-\d{2}$/),
  systeme_affecte: z.enum([
    'MOTEUR',
    'TRANSMISSION',
    'FREINAGE_PNEUMATIQUE',
    'ELECTRIQUE_ALTERNATEUR',
    'SUSPENSION_PNEUS',
    'HYDRAULIQUE',
  ]),
  pieces_suspectees: z.array(z.string()).min(1),
  priorite: z.enum(['CRITIQUE_IMMOBILISATION', 'HAUTE_48H', 'PREVENTIVE_PLANIFIEE']),
  diagnostic_initial: z.string(),
});

export const BlockFuelCardSchema = z.object({
  id_carte_naftal: z.string().startsWith('NFT-'),
  matricule_associe: z.string(),
  ecart_cusum_litres: z.number().positive(),
  motif_suspicion: z.string(),
});

export const PreCheckEnactaSchema = z.object({
  matricule: z.string().regex(/^\d{5,6}-\d{3}-\d{2}$/),
  inclure_historique_dtc_j1939: z.boolean().default(true),
});

// Politique de sécurité par outil
export const TOOL_POLICIES: Record<string, ToolExecutionPolicy> = {
  proposer_remplacement_topsis: ToolExecutionPolicy.READ_COMPUTE,
  generer_pre_controle_enacta: ToolExecutionPolicy.READ_COMPUTE,
  creer_ordre_reparation: ToolExecutionPolicy.DRAFT_MUTATION,
  bloquer_carte_carburant: ToolExecutionPolicy.DRAFT_MUTATION,
};

// 2. Définitions JSON Schema natives pour Qwen 2.5 (Ollama Tools API)
export const OLLAMA_FLEET_TOOLS = [
  {
    type: 'function',
    function: {
      name: 'proposer_remplacement_topsis',
      description: 'Exécute l’algorithme multicritère TOPSIS pour trouver le meilleur véhicule de remplacement disponible selon le VHI, la distance et le tonnage.',
      parameters: {
        type: 'object',
        required: ['matricule_en_panne', 'wilaya_actuelle', 'wilaya_destination', 'tonnage_requis_tonnes', 'motif_panne'],
        properties: {
          matricule_en_panne: { type: 'string', description: 'Matricule algérien du camion en panne (ex: 01894-112-16)' },
          wilaya_actuelle: { type: 'integer', description: 'Code Wilaya de la panne (1 à 58, ex: 17 pour Djelfa)' },
          wilaya_destination: { type: 'integer', description: 'Code Wilaya de livraison finale (ex: 3 pour Laghouat)' },
          tonnage_requis_tonnes: { type: 'number', description: 'Charge utile minimale requise en tonnes' },
          motif_panne: { type: 'string', description: 'Cause technique de la panne signalée' },
        },
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'creer_ordre_reparation',
      description: 'Prépare un Bon de Travail (Work Order) dans le module Maintenance suite à une panne ou alerte VHI.',
      parameters: {
        type: 'object',
        required: ['matricule', 'systeme_affecte', 'pieces_suspectees', 'priorite', 'diagnostic_initial'],
        properties: {
          matricule: { type: 'string', description: 'Matricule du véhicule concerné' },
          systeme_affecte: {
            type: 'string',
            enum: ['MOTEUR', 'TRANSMISSION', 'FREINAGE_PNEUMATIQUE', 'ELECTRIQUE_ALTERNATEUR', 'SUSPENSION_PNEUS', 'HYDRAULIQUE'],
          },
          pieces_suspectees: { type: 'array', items: { type: 'string' }, description: 'Liste des pièces à inspecter ou remplacer' },
          priorite: { type: 'string', enum: ['CRITIQUE_IMMOBILISATION', 'HAUTE_48H', 'PREVENTIVE_PLANIFIEE'] },
          diagnostic_initial: { type: 'string', description: 'Synthèse technique pour le chef d’atelier' },
        },
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'bloquer_carte_carburant',
      description: 'Met en quarantaine une carte carburant Naftal suite à une anomalie CUSUM ou double transaction.',
      parameters: {
        type: 'object',
        required: ['id_carte_naftal', 'matricule_associe', 'ecart_cusum_litres', 'motif_suspicion'],
        properties: {
          id_carte_naftal: { type: 'string', description: 'Identifiant carte commençant par NFT-' },
          matricule_associe: { type: 'string' },
          ecart_cusum_litres: { type: 'number', description: 'Volume manquant détecté en litres' },
          motif_suspicion: { type: 'string' },
        },
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'generer_pre_controle_enacta',
      description: 'Compile la télémétrie CAN J1939 et l’état mécanique face aux 133 points réglementaires ENACTA Algérie.',
      parameters: {
        type: 'object',
        required: ['matricule'],
        properties: {
          matricule: { type: 'string', description: 'Matricule du véhicule à auditer' },
          inclure_historique_dtc_j1939: { type: 'boolean', default: true },
        },
      },
    },
  },
];

