// Fichier : apps/api/src/copilot/ollama-sovereign.service.ts
import { Injectable, Logger } from '@nestjs/common';
import * as crypto from 'crypto';
import {
  OllamaStatusResponse,
  OllamaInferenceLogEntry,
  OllamaPlaygroundRequestDto,
  OllamaPlaygroundResponseDto,
  OllamaTelemetryInfo,
} from '@docteurflotte/contracts';

export type { OllamaStatusResponse, OllamaInferenceLogEntry, OllamaPlaygroundRequestDto, OllamaPlaygroundResponseDto };

@Injectable()
export class OllamaSovereignService {
  private readonly logger = new Logger(OllamaSovereignService.name);
  private readonly baseUrl = process.env.OLLAMA_BASE_URL || 'http://127.0.0.1:11434';
  private readonly model = process.env.OLLAMA_MODEL_NAME || 'docteurflotte';
  private readonly fallbackModel = 'qwen2.5:1.5b-instruct';
  private readonly timeoutMs = Number(process.env.OLLAMA_TIMEOUT_MS || 90000);

  // Journal d'audit d'inférence en mémoire circulaire (20 à 50 derniers appels)
  private readonly maxLogs = 50;
  private readonly logs: OllamaInferenceLogEntry[] = [];

  // Télémétrie d'inférence en temps réel
  private totalCalls = 0;
  private totalTokensGenerated = 0;
  private totalDurationMs = 0;
  private lastLatencyMs = 0;
  private isInferring = false;

  /**
   * Coupe-feu Loi 18-07 (ANPDP) : Purge toute donnée personnelle ou identifiante
   * (matricules algériens, numéros +213, NIN, emails) avant transmission au LLM local.
   */
  sanitizePromptLoi1807Detailed(rawText: string): {
    sanitized: string;
    piiCount: number;
    details: { matricules: number; phones: number; nins: number; emails: number };
  } {
    if (!rawText) {
      return { sanitized: '', piiCount: 0, details: { matricules: 0, phones: 0, nins: 0, emails: 0 } };
    }

    // Matricules algériens (formats: 01492-319-16, 01492 319 16, 16-12345-00, 12345-120-16)
    const matriculeRegex = /\b(?:\d{4,6}[-\s]\d{2,3}[-\s]\d{2}|\d{2}[-\s]\d{4,6}[-\s]\d{2,3})\b/g;
    // Numéros de téléphone algériens (+213, 00213 ou 0 suivi de 5/6/7 ou fixe 2/3/4 avec format continu ou espacé)
    const phoneRegex = /(?:\+213|00213|0)\s*(?:[567](?:[\s.-]?\d{2}){4}|(?:2[1-9]|3[0-8]|4[0-9])(?:[\s.-]?\d{2}){3})\b/g;
    const ninRegex = /\b\d{18}\b/g;
    const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;

    const matricules = (rawText.match(matriculeRegex) || []).length;
    const phones = (rawText.match(phoneRegex) || []).length;
    const nins = (rawText.match(ninRegex) || []).length;
    const emails = (rawText.match(emailRegex) || []).length;

    const sanitized = rawText
      .replace(matriculeRegex, '[MATRICULE_ANONYMISE]')
      .replace(phoneRegex, '[TEL_ANONYMISE]')
      .replace(ninRegex, '[NIN_ANONYMISE]')
      .replace(emailRegex, '[EMAIL_ANONYMISE]');

    return {
      sanitized,
      piiCount: matricules + phones + nins + emails,
      details: { matricules, phones, nins, emails },
    };
  }

  sanitizePromptLoi1807(rawText: string): string {
    return this.sanitizePromptLoi1807Detailed(rawText).sanitized;
  }

  /**
   * Télémétrie d'état complète
   */
  async checkStatus(): Promise<OllamaStatusResponse> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 3000);

    const avgTokensPerSec =
      this.totalDurationMs > 0
        ? Number(((this.totalTokensGenerated / (this.totalDurationMs / 1000))).toFixed(1))
        : 11.2; // Valeur de calibrage Qwen 1.5B sur CPU

    const telemetry: OllamaTelemetryInfo = {
      threads: 3,
      maxContextTokens: 2048,
      temperature: 0.2,
      keepAlive: '5m',
      totalCalls: this.totalCalls,
      avgTokensPerSec,
      lastLatencyMs: this.lastLatencyMs,
      isInferring: this.isInferring,
      totalTokensGenerated: this.totalTokensGenerated,
    };

    try {
      const res = await fetch(`${this.baseUrl}/api/tags`, {
        method: 'GET',
        signal: controller.signal,
      });
      clearTimeout(timer);

      if (!res.ok) {
        return this.buildOfflineStatus(telemetry);
      }

      const data = (await res.json()) as { models?: Array<{ name: string }> };
      const models = (data.models || []).map((m) => m.name);
      const activeModel =
        models.find((m) => m.includes(this.model)) ||
        models.find((m) => m.includes('qwen')) ||
        models[0] ||
        this.model;

      return {
        available: models.length > 0,
        model: activeModel,
        baseUrl: this.baseUrl,
        sovereign: true,
        loi1807Compliant: true,
        mode: models.length > 0 ? 'OLLAMA_QWEN_LOCAL' : 'DETERMINISTIC_FALLBACK',
        telemetry,
      };
    } catch {
      clearTimeout(timer);
      return this.buildOfflineStatus(telemetry);
    }
  }

  private buildOfflineStatus(telemetry?: OllamaTelemetryInfo): OllamaStatusResponse {
    return {
      available: false,
      model: `${this.model} (${this.fallbackModel})`,
      baseUrl: this.baseUrl,
      sovereign: true,
      loi1807Compliant: true,
      mode: 'DETERMINISTIC_FALLBACK',
      telemetry: telemetry || {
        threads: 3,
        maxContextTokens: 2048,
        temperature: 0.2,
        keepAlive: '5m',
        totalCalls: this.totalCalls,
        avgTokensPerSec: 0,
        lastLatencyMs: this.lastLatencyMs,
        isInferring: false,
        totalTokensGenerated: this.totalTokensGenerated,
      },
    };
  }

  /**
   * Retourne l'historique récent des appels d'inférence (chronologique inverse)
   */
  getLogs(): OllamaInferenceLogEntry[] {
    return [...this.logs];
  }

  private pushLog(entry: OllamaInferenceLogEntry): void {
    this.logs.unshift(entry);
    if (this.logs.length > this.maxLogs) {
      this.logs.pop();
    }
  }

  /**
   * Génère une réponse texte ou JSON structuré via Ollama / Qwen en local.
   * Retourne `null` si Ollama est éteint ou dépasse le timeout (Fail-Safe).
   */
  async generate(
    prompt: string,
    options?: {
      system?: string;
      jsonFormat?: boolean;
      temperature?: number;
      maxTokens?: number;
      callerModule?: 'COPILOT_QUERY' | 'FUEL_SCANNER' | 'PLAYGROUND' | 'DTC_INTERPRETER' | 'OEM_RESOLVER';
    },
  ): Promise<string | null> {
    const startTime = performance.now();
    const { sanitized: safePrompt, piiCount } = this.sanitizePromptLoi1807Detailed(prompt);
    const callerModule = options?.callerModule || 'COPILOT_QUERY';
    const isJson = Boolean(options?.jsonFormat);
    const logId = `inf-${crypto.randomUUID().slice(0, 8)}`;

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.timeoutMs);
    this.isInferring = true;

    try {
      const status = await this.checkStatus();
      if (!status.available) {
        clearTimeout(timer);
        this.isInferring = false;
        this.pushLog({
          id: logId,
          timestamp: new Date().toISOString(),
          callerModule,
          rawPrompt: prompt,
          sanitizedPrompt: safePrompt,
          piiMaskedCount: piiCount,
          response: '[Service Ollama non joignable - Bascule déterministe]',
          isJson,
          status: 'FALLBACK',
          executionSource: 'DETERMINISTIC_FALLBACK',
          durationMs: Math.round(performance.now() - startTime),
        });
        return null;
      }

      const payload: Record<string, unknown> = {
        model: status.model,
        prompt: safePrompt,
        stream: false,
        keep_alive: '60m',
        options: {
          temperature: options?.temperature ?? 0.2,
          num_predict: options?.maxTokens ?? 450,
          num_thread: 4,
          num_ctx: 2048,
        },
      };

      if (options?.system) {
        payload.system = options.system;
      }
      if (options?.jsonFormat) {
        payload.format = 'json';
      }

      const res = await fetch(`${this.baseUrl}/api/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });

      clearTimeout(timer);
      this.isInferring = false;
      const durationMs = Math.round(performance.now() - startTime);

      if (!res.ok) {
        this.pushLog({
          id: logId,
          timestamp: new Date().toISOString(),
          callerModule,
          rawPrompt: prompt,
          sanitizedPrompt: safePrompt,
          piiMaskedCount: piiCount,
          response: `[Erreur HTTP Ollama: ${res.status}]`,
          isJson,
          status: 'ERROR',
          executionSource: 'DETERMINISTIC_FALLBACK',
          durationMs,
        });
        return null;
      }

      interface OllamaGeneratePayload {
        response?: string;
        eval_count?: number;
        eval_duration?: number;
      }

      const data = (await res.json()) as OllamaGeneratePayload;
      const responseText = data.response ? data.response.trim() : '';

      const tokensGenerated = data.eval_count ?? Math.max(1, Math.round(responseText.length / 4));
      const evalDurationSec = data.eval_duration ? data.eval_duration / 1e9 : durationMs / 1000;
      const tokensPerSec = evalDurationSec > 0 ? Number((tokensGenerated / evalDurationSec).toFixed(1)) : 0;

      this.totalCalls += 1;
      this.totalTokensGenerated += tokensGenerated;
      this.totalDurationMs += durationMs;
      this.lastLatencyMs = durationMs;

      this.pushLog({
        id: logId,
        timestamp: new Date().toISOString(),
        callerModule,
        rawPrompt: prompt,
        sanitizedPrompt: safePrompt,
        piiMaskedCount: piiCount,
        response: responseText,
        isJson,
        status: 'SUCCESS',
        executionSource: 'OLLAMA_QWEN_LOCAL',
        durationMs,
        tokensGenerated,
        tokensPerSec,
      });

      return responseText || null;
    } catch (err: unknown) {
      clearTimeout(timer);
      this.isInferring = false;
      const durationMs = Math.round(performance.now() - startTime);
      const msg = err instanceof Error ? err.message : String(err);
      this.logger.debug(`Ollama local non joignable (fallback déterministe actif): ${msg}`);

      this.pushLog({
        id: logId,
        timestamp: new Date().toISOString(),
        callerModule,
        rawPrompt: prompt,
        sanitizedPrompt: safePrompt,
        piiMaskedCount: piiCount,
        response: `[Timeout ou indisponibilité: ${msg}]`,
        isJson,
        status: 'FALLBACK',
        executionSource: 'DETERMINISTIC_FALLBACK',
        durationMs,
      });

      return null;
    }
  }

  /**
   * Exécute un test interactif depuis le Playground d'observabilité
   */
  async runPlayground(dto: OllamaPlaygroundRequestDto): Promise<OllamaPlaygroundResponseDto> {
    const startTime = performance.now();
    const { sanitized, piiCount } = this.sanitizePromptLoi1807Detailed(dto.prompt);

    const response = await this.generate(dto.prompt, {
      system: dto.systemPrompt,
      jsonFormat: dto.jsonFormat,
      temperature: dto.temperature ?? 0.2,
      maxTokens: dto.maxTokens ?? 350,
      callerModule: dto.callerModule || 'PLAYGROUND',
    });

    const durationMs = Math.round(performance.now() - startTime);
    const tokensGenerated = response ? Math.max(1, Math.round(response.length / 4)) : 0;
    const tokensPerSec = durationMs > 0 ? Number(((tokensGenerated / (durationMs / 1000))).toFixed(1)) : 0;

    return {
      id: `play-${crypto.randomUUID().slice(0, 8)}`,
      response: response || '[Réponse vide ou bascule déterministe déclenchée]',
      rawPrompt: dto.prompt,
      sanitizedPrompt: sanitized,
      piiMaskedCount: piiCount,
      executionSource: response ? 'OLLAMA_QWEN_LOCAL' : 'DETERMINISTIC_FALLBACK',
      durationMs,
      tokensGenerated,
      tokensPerSec,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Extraction structurée d'un ticket carburant Naftal bruité via Qwen local (Format JSON).
   */
  async extractNaftalReceiptJson(rawTicketText: string): Promise<{
    liters?: number;
    fuelType?: 'Gasoil' | 'Super' | 'Sans Plomb' | 'GPL';
    stationName?: string;
    stationWilaya?: string;
    totalAmountDzd?: number;
  } | null> {
    const prompt = `Extrais les informations de ce ticket de carburant algérien (Naftal/station) au format JSON strict :
{
  "liters": number,
  "fuelType": "Gasoil" | "Sans Plomb" | "Super" | "GPL",
  "stationName": string,
  "stationWilaya": string,
  "totalAmountDzd": number
}

Texte du ticket :
"""
${rawTicketText}
"""`;

    const rawJson = await this.generate(prompt, {
      jsonFormat: true,
      temperature: 0.1,
      maxTokens: 200,
      callerModule: 'FUEL_SCANNER',
    });

    if (!rawJson) return null;

    try {
      const jsonMatch = rawJson.match(/\{[\s\S]*\}/);
      return JSON.parse(jsonMatch ? jsonMatch[0] : rawJson);
    } catch {
      return null;
    }
  }
}

