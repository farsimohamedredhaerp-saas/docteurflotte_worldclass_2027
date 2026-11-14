import type {
  CreateDecisionConfigDto,
  DecisionEngineSimulationResult,
  PlatformConfigPublication,
  PlatformDecisionEngineConfig,
} from '@docteurflotte/contracts';

export type {
  CreateDecisionConfigDto,
  DecisionEngineSimulationResult,
  PlatformConfigPublication,
  PlatformDecisionEngineConfig,
};

export type ModalMode = 'CREATE' | 'EDIT';

export interface ModalTabItem {
  id: number;
  label: string;
  category: string;
}
