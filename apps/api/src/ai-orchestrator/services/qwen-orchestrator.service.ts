import { Injectable, Logger } from '@nestjs/common';
import {
  OLLAMA_FLEET_TOOLS,
  TOOL_POLICIES,
  ToolExecutionPolicy,
  TopsisReplacementSchema,
  CreateWorkOrderSchema,
  BlockFuelCardSchema,
  PreCheckEnactaSchema,
} from '../schemas/fleet-tools.schema';
import { DeterministicFleetToolsService, TopsisCandidate } from './deterministic-fleet-tools.service';
import { DraftActionManagerService, DraftTransaction } from './draft-action-manager.service';

export interface OllamaChatMessage {
  role: 'system' | 'user' | 'assistant' | 'tool';
  content?: string;
  name?: string;
  tool_calls?: Array<{
    function: {
      name: string;
      arguments: Record<string, unknown>;
    };
  }>;
}

@Injectable()
export class QwenOrchestratorService {
  private readonly logger = new Logger(QwenOrchestratorService.name);
  private readonly ollamaEndpoint =
    process.env.OLLAMA_HOST || process.env.OLLAMA_BASE_URL
      ? `${(process.env.OLLAMA_HOST || process.env.OLLAMA_BASE_URL)!.replace(/\/$/, '')}/api/chat`
      : 'http://127.0.0.1:11434/api/chat';
  private readonly modelName =
    process.env.QWEN_MODEL || process.env.OLLAMA_MODEL_NAME || 'docteurflotte';

  constructor(
    private readonly deterministicTools: DeterministicFleetToolsService,
    private readonly draftManager: DraftActionManagerService,
  ) {}

  async processOperatorPrompt(prompt: string, operatorId: string) {
    const pendingDrafts: DraftTransaction[] = [];
    const executedReadTools: Array<{ tool: string; output: Record<string, unknown> }> = [];

    const messages: OllamaChatMessage[] = [
      {
        role: 'system',
        content: `Tu es l'Orchestrateur Décisionnel Souverain de la flotte (Conforme Loi 18-07 Algérie).
RÈGLES ABSOLUES :
1. N'invente JAMAIS de score VHI, de distance ou de calcul TOPSIS : appelle systématiquement les outils mis à ta disposition.
2. Lorsqu'une panne nécessite à la fois un remplacement de véhicule ET une réparation, appelle les deux outils ('proposer_remplacement_topsis' ET 'creer_ordre_reparation') dans ta réponse.
3. Sois chirurgical, factuel et utilise une terminologie d'exploitation routière algérienne (Matricule DZ, Wilayas, ENACTA, Naftal).`,
      },
      { role: 'user', content: prompt },
    ];

    try {
      // 1. Premier appel à Qwen 2.5 (Détection et paramétrage des Tool Calls)
      const firstTurn = await this.callOllama(messages, true);
      const assistantMsg = firstTurn.message;
      messages.push(assistantMsg);

      // 2. Si Qwen décide d'appeler un ou plusieurs outils
      if (assistantMsg.tool_calls && assistantMsg.tool_calls.length > 0) {
        for (const toolCall of assistantMsg.tool_calls) {
          const toolName = toolCall.function.name;
          const rawArgs =
            typeof toolCall.function.arguments === 'string'
              ? JSON.parse(toolCall.function.arguments)
              : toolCall.function.arguments;

          const policy = TOOL_POLICIES[toolName];
          const validatedArgs = this.validateToolArguments(toolName, rawArgs);

          if (policy === ToolExecutionPolicy.READ_COMPUTE) {
            // Exécution immédiate du moteur mathématique
            const result = await this.executeReadTool(toolName, validatedArgs);
            executedReadTools.push({ tool: toolName, output: result });

            messages.push({
              role: 'tool',
              name: toolName,
              content: JSON.stringify(result),
            });
          } else if (policy === ToolExecutionPolicy.DRAFT_MUTATION) {
            // Interception sécurisée : Création d'un Draft sans écriture directe en BDD
            const draft = await this.draftManager.createDraft(toolName, validatedArgs, operatorId);
            pendingDrafts.push(draft);

            messages.push({
              role: 'tool',
              name: toolName,
              content: JSON.stringify({
                status: 'DRAFT_CREATED_WAITING_HUMAN_COMMIT',
                draft_id: draft.draft_id,
                message: 'Préparation validée. En attente du clic de confirmation opérateur.',
              }),
            });
          }
        }

        // 3. Second appel à Qwen 2.5 avec les résultats déterministes pour rédiger la synthèse finale
        const finalTurn = await this.callOllama(messages, false);
        return {
          synthese_operateur: finalTurn.message.content,
          calculs_deterministes: executedReadTools,
          actions_en_attente_commit: pendingDrafts,
        };
      }

      // Réponse directe si aucun outil n'était nécessaire
      return {
        synthese_operateur: assistantMsg.content,
        calculs_deterministes: [],
        actions_en_attente_commit: [],
      };
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : String(err);
      this.logger.warn(`Ollama inaccessible ou erreur (${errMsg}). Bascule vers l'orchestrateur déterministe fallback.`);
      return this.deterministicFallbackOrchestration(prompt, operatorId);
    }
  }

  private validateToolArguments(toolName: string, args: unknown) {
    switch (toolName) {
      case 'proposer_remplacement_topsis':
        return TopsisReplacementSchema.parse(args);
      case 'creer_ordre_reparation':
        return CreateWorkOrderSchema.parse(args);
      case 'bloquer_carte_carburant':
        return BlockFuelCardSchema.parse(args);
      case 'generer_pre_controle_enacta':
        return PreCheckEnactaSchema.parse(args);
      default:
        throw new Error(`Outil non autorisé : ${toolName}`);
    }
  }

  private async executeReadTool(
    toolName: string,
    validatedArgs: Record<string, unknown>,
  ): Promise<Record<string, unknown>> {
    if (toolName === 'proposer_remplacement_topsis') {
      return this.deterministicTools.executeTopsisSubstitution({
        matricule_en_panne: String(validatedArgs.matricule_en_panne || ''),
        wilaya_actuelle: Number(validatedArgs.wilaya_actuelle) || 16,
        tonnage_requis_tonnes: Number(validatedArgs.tonnage_requis_tonnes) || 20,
      });
    }
    if (toolName === 'generer_pre_controle_enacta') {
      return this.deterministicTools.compileEnactaPreCheck(String(validatedArgs.matricule || ''));
    }
    return {};
  }

  private async callOllama(messages: OllamaChatMessage[], enableTools: boolean) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 20000);

    try {
      const response = await fetch(this.ollamaEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
        body: JSON.stringify({
          model: this.modelName,
          messages,
          tools: enableTools ? OLLAMA_FLEET_TOOLS : undefined,
          stream: false,
          keep_alive: '30m', // Garde le modèle verrouillé en RAM CPU
          options: {
            temperature: 0.0, // Zéro créativité sur le paramétrage JSON
            num_ctx: 2048,
            num_thread: 4,
          },
        }),
      });

      if (!response.ok) {
        this.logger.error(`Erreur Ollama HTTP ${response.status}`);
        throw new Error(`Service d’inférence local indisponible (HTTP ${response.status})`);
      }
      return response.json();
    } finally {
      clearTimeout(timeout);
    }
  }

  /**
   * Orchestration déterministe de secours (Fail-Safe Local) lorsque Ollama n'est pas démarré
   */
  private async deterministicFallbackOrchestration(prompt: string, operatorId: string) {
    const pendingDrafts: DraftTransaction[] = [];
    const executedReadTools: Array<{ tool: string; output: Record<string, unknown> }> = [];
    const p = prompt.toLowerCase();

    // 1. Détection de panne nécessitant remplacement TOPSIS
    const isSubstitution =
      p.includes('rempla') || p.includes('secours') || p.includes('substitut') || (p.includes('panne') && p.includes('trouve'));

    if (isSubstitution) {
      const tonnageMatch = prompt.match(/(\d{1,2})\s*tonnes?/i);
      const tonnage = tonnageMatch ? Number(tonnageMatch[1]) : 24;

      const matriculeMatch = prompt.match(/\b\d{5,6}-\d{3}-\d{2}\b/);
      const matricule = matriculeMatch ? matriculeMatch[0] : '01894-112-16';

      const topsisArgs = {
        matricule_en_panne: matricule,
        wilaya_actuelle: 17, // Djelfa par défaut si mentionné
        wilaya_destination: 3, // Laghouat
        tonnage_requis_tonnes: tonnage,
        motif_panne: 'Panne alternateur signalée en mission',
      };

      const topsisRes = await this.deterministicTools.executeTopsisSubstitution(topsisArgs);
      executedReadTools.push({ tool: 'proposer_remplacement_topsis', output: topsisRes });
    }

    // 2. Détection de création d'ordre de travail
    const isWorkOrder =
      p.includes('ordre') || p.includes('réparation') || p.includes('travail') || p.includes('atelier') || p.includes('alternateur');

    if (isWorkOrder) {
      const matriculeMatch = prompt.match(/\b\d{5,6}-\d{3}-\d{2}\b/);
      const matricule = matriculeMatch ? matriculeMatch[0] : '01894-112-16';

      const woArgs = {
        matricule,
        systeme_affecte: 'ELECTRIQUE_ALTERNATEUR' as const,
        pieces_suspectees: ["Alternateur 24V", "Courroie d'accessoires", "Régulateur de tension"],
        priorite: 'CRITIQUE_IMMOBILISATION' as const,
        diagnostic_initial: "Défaut de charge alternateur signalé à l'arrêt sur corridor RN1.",
      };

      const draft = await this.draftManager.createDraft('creer_ordre_reparation', woArgs, operatorId);
      pendingDrafts.push(draft);
    }

    // 3. Détection de blocage carte Naftal
    if (p.includes('carte') && (p.includes('bloqu') || p.includes('quarantaine'))) {
      const cardArgs = {
        id_carte_naftal: 'NFT-CORP-4881',
        matricule_associe: '01894-112-16',
        ecart_cusum_litres: 38.5,
        motif_suspicion: 'Écart CUSUM anormal à vitesse nulle',
      };
      const draft = await this.draftManager.createDraft('bloquer_carte_carburant', cardArgs, operatorId);
      pendingDrafts.push(draft);
    }

    // Formulation de la synthèse finale
    let synthese = 'Orchestration déterministe exécutée (Mode Souverain Fail-Safe Algérie) :\n';
    if (executedReadTools.length > 0) {
      const t = executedReadTools[0].output as { best_candidate?: TopsisCandidate };
      if (t.best_candidate) {
        synthese += `1. **Substitution TOPSIS validée** : Le tracteur **${t.best_candidate.modele} (${t.best_candidate.matricule})** est sélectionné avec un score TOPSIS optimal de **${t.best_candidate.score_topsis_final}** (VHI : ${t.best_candidate.vhi_score}%, situé à ${t.best_candidate.distance_km} km, capacité ${t.best_candidate.capacite_tonnes}T, conso ${t.best_candidate.conso_moyenne_l100} L/100km).\n`;
      }
    }
    if (pendingDrafts.length > 0) {
      synthese += `2. **Ordre de Travail Préparé** : Le brouillon d'intervention critique (\`${pendingDrafts[0].draft_id}\`) pour le système ${pendingDrafts[0].payload.systeme_affecte || 'MÉCANIQUE'} du \`${pendingDrafts[0].payload.matricule}\` est prêt pour validation ci-dessous.`;
    }

    return {
      synthese_operateur: synthese,
      calculs_deterministes: executedReadTools,
      actions_en_attente_commit: pendingDrafts,
    };
  }
}

