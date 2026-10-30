import { Body, Controller, Get, Post } from '@nestjs/common';
import { ColdChainService } from '../services/cold-chain.service';
import { ReeferLiveStatus, ReeferTelemetryPayload } from '@docteurflotte/contracts';

@Controller('api/v1/cold-chain')
export class ColdChainController {
  constructor(private readonly coldChainService: ColdChainService) {}

  @Get('live')
  getLiveStatus(): ReeferLiveStatus[] {
    return this.coldChainService.getLiveReeferFleet();
  }

  @Post('telemetry')
  ingestTelemetry(@Body() payload: ReeferTelemetryPayload): ReeferLiveStatus {
    return this.coldChainService.evaluateReeferTelemetry(payload);
  }
}
