// Fichier : apps/api/src/workshop-voice/dto/workshop-voice.dto.ts
import { z } from 'zod';

export const VoiceQuerySchema = z.object({
  transcribedText: z.string().min(2, "Le texte transcrit doit contenir au moins 2 caractères"),
  preferredLanguage: z.enum(['FR', 'DARJA_PHONETIC', 'AR']).default('FR').optional(),
  mechanicId: z.string().optional(),
  tenantId: z.string().optional(),
});

export type VoiceQueryDto = z.infer<typeof VoiceQuerySchema>;

export interface VoiceRouteResult {
  originalTranscript: string;
  normalizedIntent: string;
  isDeterministicShortCircuit: boolean;
  vehicleDetected?: string;
  subsystemDetected?: string;
  spokenResponseFr: string;
  spokenResponseDarja: string;
  structuredData?: Record<string, unknown>;
  sourceManualReference?: string;
  executionMs: number;
}

export interface WorkshopDictionaryEntry {
  darjaTerm: string;
  phoneticVariants: string[];
  frenchStandard: string;
  arabicStandard: string;
  subsystem: string;
  definition: string;
}
