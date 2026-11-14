import {
  OllamaStatusResponse,
  OllamaInferenceLogEntry,
  OllamaPlaygroundRequestDto,
  OllamaPlaygroundResponseDto,
} from '@docteurflotte/contracts';

export type ModuleFilter =
  | 'ALL'
  | 'COPILOT_QUERY'
  | 'FUEL_SCANNER'
  | 'PLAYGROUND'
  | 'DTC_INTERPRETER'
  | string;

export interface AggregatedStats {
  totalCalls: number;
  localCalls: number;
  fallbackCalls: number;
  totalPiiMasked: number;
  avgLatency: number;
  avgTokSec: number;
}

export interface PlaygroundPreset {
  name: string;
  description: string;
  prompt: string;
  systemPrompt: string;
  jsonFormat: boolean;
  temperature: number;
  maxTokens: number;
}

export interface AiObservabilityHeaderProps {
  status: OllamaStatusResponse | null;
  autoRefresh: boolean;
  onToggleAutoRefresh: () => void;
  onRefresh: () => void;
  onExportAuditLog: () => void;
}

export interface AiObservabilityKpisProps {
  status: OllamaStatusResponse | null;
  stats: AggregatedStats;
}

export interface InferenceInspectorConsoleProps {
  logs: OllamaInferenceLogEntry[];
  filteredLogs: OllamaInferenceLogEntry[];
  selectedLog: OllamaInferenceLogEntry | null;
  moduleFilter: string;
  onModuleFilterChange: (mod: string) => void;
  onSelectLog: (log: OllamaInferenceLogEntry) => void;
}

export interface AiPlaygroundPanelProps {
  prompt: string;
  onPromptChange: (val: string) => void;
  systemPrompt: string;
  onSystemPromptChange: (val: string) => void;
  jsonMode: boolean;
  onJsonModeChange: (val: boolean) => void;
  temperature: number;
  onTemperatureChange: (val: number) => void;
  maxTokens: number;
  onMaxTokensChange: (val: number) => void;
  isInferring: boolean;
  result: OllamaPlaygroundResponseDto | null;
  error: string | null;
  onRun: () => void;
  onApplyPreset: (preset: PlaygroundPreset) => void;
}

export interface SovereignPillarsSectionProps {
  token: string | null;
}

export type {
  OllamaStatusResponse,
  OllamaInferenceLogEntry,
  OllamaPlaygroundRequestDto,
  OllamaPlaygroundResponseDto,
};
