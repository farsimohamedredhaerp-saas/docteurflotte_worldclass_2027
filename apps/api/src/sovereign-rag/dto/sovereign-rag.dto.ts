// Fichier : apps/api/src/sovereign-rag/dto/sovereign-rag.dto.ts
import { z } from 'zod';

export enum KnowledgeCategory {
  OEM_MANUAL = 'OEM_MANUAL',
  ENACTA_REGULATION = 'ENACTA_REGULATION',
  WORKSHOP_PROCEDURE = 'WORKSHOP_PROCEDURE',
  DTC_INDEX = 'DTC_INDEX',
}

export enum VehicleSubsystem {
  MOTEUR = 'MOTEUR',
  FREINAGE = 'FREINAGE',
  TRANSMISSION = 'TRANSMISSION',
  ECHAPPEMENT_FAP = 'ECHAPPEMENT_FAP',
  INJECTION_CARBURANT = 'INJECTION_CARBURANT',
  CHASSIS_SUSPENSION = 'CHASSIS_SUSPENSION',
  SECURITE_HOMOLOGATION = 'SECURITE_HOMOLOGATION',
}

export const QueryKnowledgeSchema = z.object({
  query: z.string().min(2, "La requête de recherche doit contenir au moins 2 caractères"),
  manufacturer: z.string().optional(),
  model_series: z.string().optional(),
  subsystem: z.string().optional(),
  category: z.nativeEnum(KnowledgeCategory).optional(),
  limit: z.number().int().min(1).max(20).optional(),
  include_synthesis: z.boolean().optional(),
});

export type QueryKnowledgeDto = z.infer<typeof QueryKnowledgeSchema>;

export const IngestKnowledgeItemSchema = z.object({
  category: z.nativeEnum(KnowledgeCategory),
  manufacturer: z.string().min(2),
  model_series: z.string().min(2),
  subsystem: z.string().min(2),
  section_title: z.string().min(3),
  content: z.string().min(10),
  structured_specs: z.record(z.string(), z.any()).default({}),
  tenant_id: z.string().uuid().optional(),
});

export type IngestKnowledgeItemDto = z.infer<typeof IngestKnowledgeItemSchema>;

export interface KnowledgeSearchResult {
  id: string;
  category: string;
  manufacturer: string;
  model_series: string;
  subsystem: string;
  section_title: string;
  content: string;
  structured_specs: Record<string, any>;
  lexical_rank: number;
  semantic_rank: number;
  rrf_score: number;
}

export interface KnowledgeQueryResponse {
  query: string;
  total_found: number;
  results: KnowledgeSearchResult[];
  rrf_fused: boolean;
  synthesis?: string;
  execution_ms: number;
}
