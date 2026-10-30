import { Test, TestingModule } from '@nestjs/testing';
import { CopilotService } from './copilot.service';
import { DatabaseService } from '../database/database.service';

describe('CopilotService', () => {
  let service: CopilotService;
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
        {
          provide: DatabaseService,
          useValue: dbMock,
        },
      ],
    }).compile();

    service = module.get<CopilotService>(CopilotService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should diagnose battery cranking drop with physical evidence and ROI', async () => {
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
  });

  it('should diagnose oil Arrhenius acceleration under severe heat', async () => {
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
});
