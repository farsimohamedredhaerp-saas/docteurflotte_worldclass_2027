import { Controller, Get, Query } from '@nestjs/common';
import { EcoDrivingService } from '../services/eco-driving.service';
import { FleetEcoSummary } from '@docteurflotte/contracts';

@Controller('api/v1/eco-driving')
export class EcoDrivingController {
  constructor(private readonly ecoDrivingService: EcoDrivingService) {}

  @Get('summary')
  async getSummary(@Query('tenantId') tenantId?: string): Promise<FleetEcoSummary> {
    return this.ecoDrivingService.getFleetSummary(tenantId || 'tenant-demo');
  }
}
