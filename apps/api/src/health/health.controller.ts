import { Controller, Get, Res, HttpStatus } from '@nestjs/common';
import { Response } from 'express';
import { HealthService } from './health.service';
import { HealthResponse, ReadinessResponse, PlatformHealthSummary } from '@docteurflotte/contracts';

@Controller()
export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  @Get('health')
  getHealth(): HealthResponse {
    return this.healthService.getHealth();
  }

  @Get('platform/health-summary')
  async getPlatformHealthSummary(): Promise<PlatformHealthSummary> {
    return this.healthService.getPlatformHealthSummary();
  }

  @Get('ready')
  async getReadiness(@Res({ passthrough: true }) res: Response): Promise<ReadinessResponse> {
    const readiness = await this.healthService.getReadiness();
    if (readiness.status !== 'ready') {
      res.status(HttpStatus.SERVICE_UNAVAILABLE);
    }
    return readiness;
  }
}
