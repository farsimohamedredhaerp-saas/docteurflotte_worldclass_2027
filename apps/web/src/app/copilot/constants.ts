import { OllamaStatusResponse, QuickPromptChip, Message } from './types';

export const DEFAULT_AI_STATUS: OllamaStatusResponse = {
  available: false,
  model: 'docteurflotte (qwen2.5:1.5b-instruct)',
  baseUrl: 'http://localhost:11434',
  sovereign: true,
  loi1807Compliant: true,
  mode: 'DETERMINISTIC_FALLBACK',
};

export const QUICK_PROMPT_CHIPS: QuickPromptChip[] = [
  {
    label: 'Batterie Kangoo (Cranking)',
    prompt: 'Quel est l’état de santé de la batterie du Kangoo ?',
  },
  {
    label: 'Huile MAN TGX (Arrhenius)',
    prompt: 'Faut-il vidanger l’huile du MAN TGX après la mission à Hassi Messaoud ?',
  },
  {
    label: 'Détection Vol Carburant (CUSUM)',
    prompt: 'Y a-t-il eu un vol de carburant ou un siphonnage Naftal récemment ?',
  },
  {
    label: 'Synthèse Risques Flotte',
    prompt: 'Fais-moi la synthèse des risques d’inaction de la flotte pour cette semaine.',
  },
];

export function buildInitialWelcomeMessage(): Message {
  return {
    id: 'msg-init',
    sender: 'copilot',
    text: `Bonjour. Je suis **DocteurFlotte Copilot**, votre assistant décisionnel et d'ingénierie de parc. 
J'analyse en continu les flux télématiques Traccar, les équations physiques déterministes (Arrhenius, Cranking, Thermique, Archard, CUSUM) et vos budgets en Dinars Algériens, avec enrichissement souverain local **Ollama / Qwen2.5** conforme à la **Loi 18-07 (ANPDP)**.
Que souhaitez-vous diagnostiquer ou arbitrer aujourd'hui ?`,
    timestamp: new Date().toLocaleTimeString('fr-DZ', { hour: '2-digit', minute: '2-digit' }),
  };
}

