import { Body, Controller, Get, Post, Query, Req } from '@nestjs/common';
import { ColdChainService } from '../services/cold-chain.service';
import {
  ReeferLiveStatus,
  ReeferTelemetryPayload,
  ReeferUnit,
  CreateReeferUnitDto,
  ReeferHaccpCertificate,
  GenerateHaccpCertificateDto,
} from '@docteurflotte/contracts';

@Controller('api/v1/cold-chain')
export class ColdChainController {
  constructor(private readonly coldChainService: ColdChainService) {}

  @Get('live')
  async getLiveStatus(@Req() req: any, @Query('tenantId') queryTenantId?: string): Promise<ReeferLiveStatus[]> {
    const tenantId = req.user?.tenantId || queryTenantId;
    return this.coldChainService.getLiveReeferFleet(tenantId);
  }

  @Get('units')
  async listUnits(@Req() req: any, @Query('tenantId') queryTenantId?: string): Promise<ReeferUnit[]> {
    const tenantId = req.user?.tenantId || queryTenantId;
    if (!tenantId) {
      return [];
    }
    return this.coldChainService.listReeferUnits(tenantId);
  }

  @Post('units')
  async createUnit(@Body() dto: CreateReeferUnitDto, @Req() req: any): Promise<ReeferUnit> {
    const tenantId = req.user?.tenantId || 'demo-tenant-id';
    return this.coldChainService.createReeferUnit(tenantId, dto);
  }

  @Post('telemetry')
  async ingestTelemetry(
    @Body() payload: ReeferTelemetryPayload,
    @Req() req: any,
  ): Promise<ReeferLiveStatus> {
    const tenantId = req.user?.tenantId || 'demo-tenant-id';
    return this.coldChainService.ingestReeferTelemetry(tenantId, payload);
  }

  @Post('certificates/generate')
  async generateCertificate(
    @Body() dto: GenerateHaccpCertificateDto,
    @Req() req: any,
  ): Promise<ReeferHaccpCertificate> {
    const tenantId = req.user?.tenantId || 'demo-tenant-id';
    return this.coldChainService.generateHaccpCertificate(tenantId, dto);
  }

  @Get('certificates')
  async listCertificates(
    @Req() req: any,
    @Query('reeferUnitId') reeferUnitId?: string,
    @Query('tenantId') queryTenantId?: string,
  ): Promise<ReeferHaccpCertificate[]> {
    const tenantId = req.user?.tenantId || queryTenantId;
    if (!tenantId) {
      return [];
    }
    return this.coldChainService.listHaccpCertificates(tenantId, reeferUnitId);
  }
}
