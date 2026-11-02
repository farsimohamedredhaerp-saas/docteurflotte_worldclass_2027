import { Test, TestingModule } from '@nestjs/testing';
import { DeterministicFleetToolsService } from './services/deterministic-fleet-tools.service';
import { DraftActionManagerService } from './services/draft-action-manager.service';
import { QwenOrchestratorService } from './services/qwen-orchestrator.service';
import { AiOrchestratorController } from './ai-orchestrator.controller';

describe('AI Orchestrator Module (Pilier 2 - Function Calling & Draft-Commit)', () => {
  let deterministicTools: DeterministicFleetToolsService;
  let draftManager: DraftActionManagerService;
  let orchestrator: QwenOrchestratorService;
  let controller: AiOrchestratorController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AiOrchestratorController],
      providers: [
        DeterministicFleetToolsService,
        DraftActionManagerService,
        QwenOrchestratorService,
      ],
    }).compile();

    deterministicTools = module.get<DeterministicFleetToolsService>(DeterministicFleetToolsService);
    draftManager = module.get<DraftActionManagerService>(DraftActionManagerService);
    orchestrator = module.get<QwenOrchestratorService>(QwenOrchestratorService);
    controller = module.get<AiOrchestratorController>(AiOrchestratorController);

    // Par défaut dans les tests unitaires : simuler Ollama hors-ligne pour activer le fallback instantané
    jest.spyOn<any, any>(orchestrator, 'callOllama').mockRejectedValue(new Error('Ollama test mock'));
  });

  it('should be defined', () => {
    expect(deterministicTools).toBeDefined();
    expect(draftManager).toBeDefined();
    expect(orchestrator).toBeDefined();
    expect(controller).toBeDefined();
  });

  describe('1. Deterministic Fleet Tools (TOPSIS & ENACTA)', () => {
    it('should compute TOPSIS substitution with euclidean normalization and return ranked candidates', async () => {
      const res = await deterministicTools.executeTopsisSubstitution({
        matricule_en_panne: '01894-112-16',
        wilaya_actuelle: 17, // Djelfa
        tonnage_requis_tonnes: 24,
      });

      expect(res.best_candidate).toBeDefined();
      expect(res.best_candidate.matricule).toBeDefined();
      expect(res.best_candidate.vhi_score).toBeGreaterThanOrEqual(75);
      expect(res.best_candidate.score_topsis_final).toBeGreaterThan(0.5);
      expect(res.alternatives.length).toBeGreaterThan(0);
      // Vérifier que le classement est bien trié par score décroissant
      if (res.alternatives[0]?.score_topsis_final) {
        expect(res.best_candidate.score_topsis_final!).toBeGreaterThanOrEqual(res.alternatives[0].score_topsis_final);
      }
    });

    it('should compile ENACTA pre-check with 133 points and detect blocking anomalies', async () => {
      const audit = await deterministicTools.compileEnactaPreCheck('01894-112-16');

      expect(audit.matricule).toBe('01894-112-16');
      expect(audit.statut_pre_visite).toBe('RISQUE_CONTRE_VISITE_BLOQUANT');
      expect(audit.score_conformite_sur_133).toBe(128);
      expect(audit.anomalies_bloquantes.length).toBe(2);
      expect(audit.anomalies_bloquantes[0].code_enacta).toBe('FR-204');
    });
  });

  describe('2. Draft Action Manager (Human-in-the-Loop Isolation)', () => {
    it('should create a PENDING_APPROVAL draft transaction with tactical UI card', async () => {
      const draft = await draftManager.createDraft(
        'creer_ordre_reparation',
        {
          matricule: '01894-112-16',
          systeme_affecte: 'ELECTRIQUE_ALTERNATEUR',
          pieces_suspectees: ['Alternateur 24V', 'Courroie'],
          priorite: 'CRITIQUE_IMMOBILISATION',
          diagnostic_initial: 'Panne alternateur à Djelfa',
        },
        'chef-parc@docteurflotte.dz',
      );

      expect(draft.draft_id).toMatch(/^DRF-[A-Z0-9]{8}$/);
      expect(draft.status).toBe('PENDING_APPROVAL');
      expect(draft.ui_summary_card.badge).toContain('MAINTENANCE');
      expect(draft.ui_summary_card.impact_level).toBe('CRITICAL');
      expect(draft.operator_id).toBe('chef-parc@docteurflotte.dz');
    });

    it('should commit draft and generate work order receipt upon human validation', async () => {
      const draft = await draftManager.createDraft(
        'creer_ordre_reparation',
        {
          matricule: '01894-112-16',
          systeme_affecte: 'ELECTRIQUE_ALTERNATEUR',
          pieces_suspectees: ['Alternateur 24V'],
          priorite: 'CRITIQUE_IMMOBILISATION',
          diagnostic_initial: 'Panne alternateur',
        },
        'chef-parc@docteurflotte.dz',
      );

      const commitRes = await draftManager.commitDraft(draft.draft_id, 'directeur-logistique@docteurflotte.dz');
      expect(commitRes.committed).toBe(true);
      expect(commitRes.execution_receipt.work_order_id).toMatch(/^OT-2026-\d{4}$/);
      expect(commitRes.execution_receipt.statut_atelier).toBe('ASSIGNE_CHEF_ATELIER');

      const updatedDraft = draftManager.getDraft(draft.draft_id);
      expect(updatedDraft?.status).toBe('COMMITTED');
    });

    it('should reject draft upon operator rejection', async () => {
      const draft = await draftManager.createDraft(
        'bloquer_carte_carburant',
        {
          id_carte_naftal: 'NFT-9912',
          matricule_associe: '01894-112-16',
          ecart_cusum_litres: 42.0,
          motif_suspicion: 'Siphonnage suspect',
        },
        'auditeur@docteurflotte.dz',
      );

      const rejectRes = await draftManager.rejectDraft(draft.draft_id, 'chef-parc@docteurflotte.dz', 'Fausse alerte pente');
      expect(rejectRes.rejected).toBe(true);

      const updatedDraft = draftManager.getDraft(draft.draft_id);
      expect(updatedDraft?.status).toBe('REJECTED');
    });
  });

  describe('3. Multi-Tool Orchestration Loop & REST Controller', () => {
    it('should orchestrate simultaneous substitution and repair draft for breakdown scenario', async () => {
      const prompt =
        "Le camion 01894-112-16 (24 tonnes) est en panne d'alternateur à Djelfa (Wilaya 17). Trouve un véhicule de secours pour terminer sa livraison à Laghouat (Wilaya 3) et prépare l'ordre de réparation.";

      const res = await controller.handleCommand({ prompt }, { user: { email: 'chef-parc@docteurflotte.dz' }, tenantId: 'tenant-default' });

      expect(res.synthese_operateur).toBeDefined();
      expect(res.calculs_deterministes.length).toBeGreaterThan(0);
      expect(res.calculs_deterministes[0].tool).toBe('proposer_remplacement_topsis');
      expect((res.calculs_deterministes[0].output as Record<string, unknown>).best_candidate).toBeDefined();

      expect(res.actions_en_attente_commit.length).toBeGreaterThan(0);
      expect(res.actions_en_attente_commit[0].tool_name).toBe('creer_ordre_reparation');
      expect(res.actions_en_attente_commit[0].status).toBe('PENDING_APPROVAL');
      expect(res.actions_en_attente_commit[0].ui_summary_card.fields['Système']).toBe('ELECTRIQUE_ALTERNATEUR');

      // Operator commits the draft through the controller endpoint
      const draftId = res.actions_en_attente_commit[0].draft_id;
      const commitRes = await controller.commitPendingAction(draftId, {}, { user: { email: 'chef-parc@docteurflotte.dz' }, tenantId: 'tenant-default' });
      expect(commitRes.committed).toBe(true);
      expect(commitRes.execution_receipt.work_order_id).toBeDefined();
    });

    it('should handle simulated Qwen 2.5 tool-calling multi-turn response', async () => {
      // Simulation d'un premier tour où Qwen appelle les deux outils
      jest.spyOn<any, any>(orchestrator, 'callOllama')
        .mockResolvedValueOnce({
          message: {
            role: 'assistant',
            tool_calls: [
              {
                function: {
                  name: 'proposer_remplacement_topsis',
                  arguments: {
                    matricule_en_panne: '01894-112-16',
                    wilaya_actuelle: 17,
                    wilaya_destination: 3,
                    tonnage_requis_tonnes: 24,
                    motif_panne: 'Panne alternateur',
                  },
                },
              },
              {
                function: {
                  name: 'creer_ordre_reparation',
                  arguments: {
                    matricule: '01894-112-16',
                    systeme_affecte: 'ELECTRIQUE_ALTERNATEUR',
                    pieces_suspectees: ['Alternateur 24V'],
                    priorite: 'CRITIQUE_IMMOBILISATION',
                    diagnostic_initial: 'Panne alternateur',
                  },
                },
              },
            ],
          },
        })
        .mockResolvedValueOnce({
          message: {
            role: 'assistant',
            content: 'Synthèse finale rédigée par Qwen avec substitution TOPSIS et ordre de réparation préparé.',
          },
        });

      const prompt = 'Besoin de secours et de réparation pour camion en panne';
      const res = await controller.handleCommand({ prompt }, { user: { email: 'test@docteurflotte.dz' }, tenantId: 'tenant-default' });

      expect(res.synthese_operateur).toContain('Synthèse finale');
      expect(res.calculs_deterministes.length).toBe(1);
      expect(res.actions_en_attente_commit.length).toBe(1);
      expect(res.actions_en_attente_commit[0].status).toBe('PENDING_APPROVAL');
    });
  });
});
