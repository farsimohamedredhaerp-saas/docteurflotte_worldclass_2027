import { Test, TestingModule } from '@nestjs/testing';
import { CopilotService } from './copilot.service';
import { OllamaSovereignService } from './ollama-sovereign.service';
import { SovereignToolOrchestratorService } from './sovereign-tool-orchestrator.service';
import { SubstitutionOptimizerService } from '../fleet-intelligence/services/substitution-optimizer.service';
import { AlgerianRegulatoryGateService } from '../fleet-intelligence/services/regulatory-gate.service';
import { DatabaseService } from '../database/database.service';

describe('CopilotService & OllamaSovereignService', () => {
  let service: CopilotService;
  let ollamaService: OllamaSovereignService;
  let toolOrchestrator: SovereignToolOrchestratorService;
  let dbMock: any;

  beforeEach(async () => {
    dbMock = {
      query: jest.fn().mockResolvedValue({
        rows: [
          {
            id: 'ast-test-1',
            code: 'VEH-016-ALG',
            name: 'Renault Kangoo 1.5 dCi',
            category: 'LIGHT_COMMERCIAL',
            status: 'ACTIVE',
            current_meter_value: 120500,
            updated_at: new Date().toISOString(),
          },
        ],
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CopilotService,
        OllamaSovereignService,
        SovereignToolOrchestratorService,
        SubstitutionOptimizerService,
        AlgerianRegulatoryGateService,
        {
          provide: DatabaseService,
          useValue: dbMock,
        },
      ],
    }).compile();

    service = module.get<CopilotService>(CopilotService);
    ollamaService = module.get<OllamaSovereignService>(OllamaSovereignService);
    toolOrchestrator = module.get<SovereignToolOrchestratorService>(SovereignToolOrchestratorService);

    jest.spyOn(ollamaService, 'generate').mockResolvedValue(null);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
    expect(ollamaService).toBeDefined();
  });

  it('should sanitize PII according to Algerian Law 18-07 (ANPDP)', () => {
    const raw =
      'Véhicule matricule 01492-319-16 conduit par chauffeur tel +213 550 12 34 56 NIN 199016000012345678 email test@flotte.dz';
    const sanitized = ollamaService.sanitizePromptLoi1807(raw);
    expect(sanitized).toContain('[MATRICULE_ANONYMISE]');
    expect(sanitized).toContain('[TEL_ANONYMISE]');
    expect(sanitized).toContain('[NIN_ANONYMISE]');
    expect(sanitized).toContain('[EMAIL_ANONYMISE]');
    expect(sanitized).not.toContain('01492-319-16');
    expect(sanitized).not.toContain('550 12 34 56');
    expect(sanitized).not.toContain('test@flotte.dz');
  });

  it('should diagnose battery cranking drop with physical evidence and ROI (deterministic fallback)', async () => {
    jest.spyOn(ollamaService, 'generate').mockResolvedValue(null);

    const res = await service.ask(
      { prompt: 'Quel est l’état de santé de la batterie du Kangoo ?' },
      'tenant-123',
    );

    expect(res.category).toBe('DIAGNOSTIC');
    expect(res.evidences.length).toBeGreaterThan(0);
    expect(res.evidences[0].metric).toContain('Tension Cranking');
    expect(res.suggestedActions.length).toBeGreaterThan(0);
    expect(res.suggestedActions[0].type).toBe('CREATE_WORK_ORDER');
    expect(res.suggestedActions[0].roiMultiplier).toBeGreaterThan(1);
    expect(res.answer).toContain('8,92 V');
    expect(res.aiSource).toBe('DETERMINISTIC_FALLBACK');
  });

  it('should enrich deterministic diagnosis when local Ollama/Qwen is available', async () => {
    jest
      .spyOn(ollamaService, 'generate')
      .mockResolvedValue('Remplacement urgent recommandé avant mission Grand Sud (économie 68 500 DZD).');
    jest.spyOn(ollamaService, 'checkStatus').mockResolvedValue({
      available: true,
      model: 'docteurflotte:latest',
      baseUrl: 'http://localhost:11434',
      sovereign: true,
      loi1807Compliant: true,
      mode: 'OLLAMA_QWEN_LOCAL',
    });

    const res = await service.ask(
      { prompt: 'Quel est l’état de santé de la batterie du Kangoo ?' },
      'tenant-123',
    );

    expect(res.aiSource).toBe('OLLAMA_QWEN_LOCAL');
    expect(res.answer).toContain('[Analyse Enrichie Qwen2.5 Local]');
    expect(res.answer).toContain('68 500 DZD');
  });

  it('should diagnose oil Arrhenius acceleration under severe heat', async () => {
    jest.spyOn(ollamaService, 'generate').mockResolvedValue(null);

    const res = await service.ask(
      { prompt: 'Faut-il vidanger l’huile du MAN TGX après la mission à Hassi Messaoud ?' },
      'tenant-123',
    );

    expect(res.category).toBe('DIAGNOSTIC');
    expect(res.evidences.some((e) => e.algorithm.includes('Arrhenius'))).toBe(true);
    expect(res.answer).toContain('Arrhenius');
    expect(res.suggestedActions[0].netSavingsDzd).toBeGreaterThan(0);
  });

  it('should detect fuel CUSUM siphoning drop at v=0', async () => {
    jest.spyOn(ollamaService, 'generate').mockResolvedValue(null);

    const res = await service.ask(
      { prompt: 'Y a-t-il eu un vol de carburant ou un siphonnage Naftal récemment ?' },
      'tenant-123',
    );

    expect(res.category).toBe('FUEL_FRAUD');
    expect(res.evidences.some((e) => e.algorithm.includes('CUSUM'))).toBe(true);
    expect(res.answer).toContain('CUSUM');
    expect(res.suggestedActions[0].type).toBe('AUDIT_FUEL');
  });

  it('should return proactive fleet insights', async () => {
    const insights = await service.getInsights('tenant-123');
    expect(insights.length).toBeGreaterThan(0);
    expect(insights[0].impactDzd).toBeGreaterThan(0);
  });

  describe('Sovereign Function Calling & Human-in-the-Loop State Machine', () => {
    it('should detect tool intent and trigger TOPSIS vehicle substitution with PENDING_APPROVAL', async () => {
      jest.spyOn(ollamaService, 'generate').mockResolvedValue(null);

      const res = await service.ask(
        { prompt: 'Trouve un camion remplaçant pour la mission bloquée vers Ouargla dans le Sahara' },
        'tenant-dz',
      );

      expect(res.suggestedActions.length).toBeGreaterThan(0);
      const action = res.suggestedActions[0];
      expect(action.type).toBe('SUBSTITUTE_VEHICLE');
      expect(action.status).toBe('PENDING_APPROVAL');
      expect(action.requiresApproval).toBe(true);
      expect(action.toolCall?.tool).toBe('proposer_substitution_topsis');
      expect(action.candidateVehicles?.length).toBeGreaterThan(0);
      expect(action.candidateVehicles![0].topsisScore).toBeGreaterThan(0);
      expect(res.answer).toContain('TOPSIS');
      expect(res.answer).toContain('PENDING_APPROVAL');
    });

    it('should commit PENDING_APPROVAL action to EXECUTED with audit confirmation code', async () => {
      const res = await service.ask(
        { prompt: 'Trouve un remplaçant de secours' },
        'tenant-dz',
      );

      const pendingAction = res.suggestedActions[0];
      expect(pendingAction.status).toBe('PENDING_APPROVAL');

      // Operator commits the action via Human-in-the-Loop
      const commitRes: any = await service.executeAction(
        pendingAction.id,
        'Validation chef de parc après vérification chauffeur',
        'tenant-dz',
        'directeur-logistique@docteurflotte.dz',
      );

      expect(commitRes.success).toBe(true);
      expect(commitRes.status).toBe('EXECUTED');
      expect(commitRes.confirmationCode).toContain('ADS-COMMIT-');
      expect(commitRes.action.status).toBe('EXECUTED');
      expect(commitRes.action.approvedBy).toBe('directeur-logistique@docteurflotte.dz');
    });

    it('should reject PENDING_APPROVAL action and record audit reason', async () => {
      const res = await service.ask(
        { prompt: 'Programme la vidange atelier' },
        'tenant-dz',
      );

      const pendingAction = res.suggestedActions[0];
      expect(pendingAction.status).toBe('PENDING_APPROVAL');

      const rejectRes: any = await service.rejectAction(
        pendingAction.id,
        'Reporté pour la semaine prochaine après livraison',
        'tenant-dz',
        'chef-atelier@docteurflotte.dz',
      );

      expect(rejectRes.success).toBe(true);
      expect(rejectRes.status).toBe('REJECTED');
      expect(rejectRes.action.status).toBe('REJECTED');
    });
  });
});
