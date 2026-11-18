import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { HealthController } from './health.controller';
import { HealthService } from './health.service';
import { Response } from 'express';

describe('HealthController', () => {
  let controller: HealthController;
  let service: HealthService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [HealthController],
      providers: [
        HealthService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string, defaultValue?: string) => {
              if (key === 'NODE_ENV') return 'test';
              return defaultValue;
            }),
          },
        },
      ],
    }).compile();

    controller = module.get<HealthController>(HealthController);
    service = module.get<HealthService>(HealthService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('GET /health', () => {
    it('should return ok health status with service metadata and memory metrics', () => {
      const response = controller.getHealth();
      expect(response).toBeDefined();
      expect(response.status).toBe('ok');
      expect(response.service).toBe('docteurflotte-api');
      expect(response.version).toBe('0.1.0');
      expect(typeof response.uptime).toBe('number');
      expect(typeof response.timestamp).toBe('string');
      expect(response.environment).toBe('test');
      expect(response.memory).toBeDefined();
      expect(typeof response.memory?.ramUsagePercent).toBe('number');
    });
  });

  describe('GET /health/memory', () => {
    it('should return valid system and process memory metrics', () => {
      const memory = controller.getSystemMemory();
      expect(memory).toBeDefined();
      expect(typeof memory.totalRamMb).toBe('number');
      expect(typeof memory.freeRamMb).toBe('number');
      expect(typeof memory.usedRamMb).toBe('number');
      expect(typeof memory.ramUsagePercent).toBe('number');
      expect(typeof memory.processWorkingSetMb).toBe('number');
      expect(typeof memory.isSaturated).toBe('boolean');
      expect(['OPTIMAL', 'WARNING', 'CRITICAL']).toContain(memory.status);
    });
  });

  describe('GET /ready', () => {
    it('should return not_ready and status 503 when dependencies are unconfigured', async () => {
      const mockResponse = {
        status: jest.fn().mockReturnThis(),
      } as unknown as Response;

      const result = await controller.getReadiness(mockResponse);
      expect(result).toBeDefined();
      expect(result.status).toBe('not_ready');
      expect(mockResponse.status).toHaveBeenCalledWith(503);
    });
  });
});
