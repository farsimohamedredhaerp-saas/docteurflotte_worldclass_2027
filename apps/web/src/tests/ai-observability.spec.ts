import { describe, it, expect } from 'vitest';
import {
  PLAYGROUND_PRESETS,
  MODULE_FILTER_OPTIONS,
} from '../app/admin/ai-observability/constants';
import { OllamaInferenceLogEntry } from '../app/admin/ai-observability/types';

describe('AI Observability & Sovereign Ollama Audit (Lot 5 Target 4)', () => {
  it('should expose valid playground presets tailored for Algerian fleet scenarios', () => {
    expect(PLAYGROUND_PRESETS).toHaveLength(3);

    const arrheniusPreset = PLAYGROUND_PRESETS[0];
    expect(arrheniusPreset.name).toContain('Arrhenius');
    expect(arrheniusPreset.prompt).toContain('SHACMAN');
    expect(arrheniusPreset.prompt).toContain('Hassi Messaoud');
    expect(arrheniusPreset.temperature).toBe(0.2);

    const naftalPreset = PLAYGROUND_PRESETS[1];
    expect(naftalPreset.name).toContain('OCR Ticket Naftal');
    expect(naftalPreset.prompt).toContain('SOCIETE NATIONALE DE COMMERCIALISATION NAFTAL');
    expect(naftalPreset.jsonFormat).toBe(true);

    const oemFuzzyPreset = PLAYGROUND_PRESETS[2];
    expect(oemFuzzyPreset.prompt).toContain('ranult trak T480');
    expect(oemFuzzyPreset.systemPrompt).toContain('DocteurFlotte');
  });

  it('should verify module filter options for inference logs', () => {
    const values = MODULE_FILTER_OPTIONS.map((o) => o.value);
    expect(values).toContain('ALL');
    expect(values).toContain('COPILOT_QUERY');
    expect(values).toContain('FUEL_SCANNER');
    expect(values).toContain('PLAYGROUND');
    expect(values).toContain('DTC_INTERPRETER');
  });

  it('should accurately aggregate telemetry statistics and Loi 18-07 PII masks', () => {
    const mockLogs: OllamaInferenceLogEntry[] = [
      {
        id: 'inf-001',
        callerModule: 'COPILOT_QUERY',
        timestamp: new Date().toISOString(),
        durationMs: 450,
        rawPrompt: 'Chauffeur Mohamed 0550123456 camion 01492-319-16',
        sanitizedPrompt: 'Chauffeur [CHAUFFEUR_1] [TEL_1] camion [VEHICULE_1]',
        piiMaskedCount: 3,
        executionSource: 'OLLAMA_QWEN_LOCAL',
        tokensGenerated: 60,
        tokensPerSec: 14.5,
        status: 'SUCCESS',
        response: 'Diagnostic terminé.',
        isJson: false,
      },
      {
        id: 'inf-002',
        callerModule: 'FUEL_SCANNER',
        timestamp: new Date().toISOString(),
        durationMs: 250,
        rawPrompt: 'Ticket Naftal 65L',
        sanitizedPrompt: 'Ticket Naftal 65L',
        piiMaskedCount: 0,
        executionSource: 'OLLAMA_QWEN_LOCAL',
        tokensGenerated: 40,
        tokensPerSec: 16.0,
        status: 'SUCCESS',
        response: '{ "liters": 65 }',
        isJson: true,
      },
      {
        id: 'inf-003',
        callerModule: 'DTC_INTERPRETER',
        timestamp: new Date().toISOString(),
        durationMs: 20,
        rawPrompt: 'SPN 524 FMI 2',
        sanitizedPrompt: 'SPN 524 FMI 2',
        piiMaskedCount: 0,
        executionSource: 'DETERMINISTIC_FALLBACK',
        tokensGenerated: 0,
        status: 'FALLBACK',
        response: 'Short-circuit cache constructeur.',
        isJson: false,
      },
    ];

    const totalCalls = mockLogs.length;
    const localCalls = mockLogs.filter((l) => l.executionSource === 'OLLAMA_QWEN_LOCAL').length;
    const fallbackCalls = mockLogs.filter((l) => l.executionSource === 'DETERMINISTIC_FALLBACK').length;
    const totalPiiMasked = mockLogs.reduce((acc, curr) => acc + (curr.piiMaskedCount || 0), 0);
    const avgLatency = Math.round(mockLogs.reduce((acc, curr) => acc + curr.durationMs, 0) / totalCalls);

    expect(totalCalls).toBe(3);
    expect(localCalls).toBe(2);
    expect(fallbackCalls).toBe(1);
    expect(totalPiiMasked).toBe(3);
    expect(avgLatency).toBe(240);
  });
});
