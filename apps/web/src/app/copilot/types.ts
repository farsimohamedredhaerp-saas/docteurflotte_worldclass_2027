import {
  CopilotResponse,
  CopilotInsightItem,
  CopilotActionSuggestion,
  OllamaStatusResponse,
} from '@docteurflotte/contracts';

export interface Message {
  id: string;
  sender: 'user' | 'copilot';
  text: string;
  responsePayload?: CopilotResponse;
  timestamp: string;
}

export interface QuickPromptChip {
  label: string;
  prompt: string;
}

export interface CopilotHeaderProps {
  aiStatus: OllamaStatusResponse;
}

export interface CopilotChatMessageProps {
  message: Message;
  onExecuteAction: (action: CopilotActionSuggestion) => void;
  onRejectAction: (action: CopilotActionSuggestion) => void;
}

export interface CopilotChatThreadProps {
  messages: Message[];
  isLoading: boolean;
  onExecuteAction: (action: CopilotActionSuggestion) => void;
  onRejectAction: (action: CopilotActionSuggestion) => void;
  bottomRef: React.RefObject<HTMLDivElement | null>;
}

export interface CopilotPromptInputProps {
  inputValue: string;
  onInputChange: (val: string) => void;
  isLoading: boolean;
  onSend: (prompt?: string) => void;
  chips: QuickPromptChip[];
}

export interface CopilotProactiveRailProps {
  insights: CopilotInsightItem[];
  onSelectInsightPrompt: (prompt: string) => void;
}

export type {
  CopilotResponse,
  CopilotInsightItem,
  CopilotActionSuggestion,
  OllamaStatusResponse,
};

