import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  Req,
} from '@nestjs/common';
import { FarmPropertiesService } from './services/farm-properties.service';
import { IrrigationPivotsService } from './services/irrigation-pivots.service';
import { HarvestCampaignsService } from './services/harvest-campaigns.service';
import {
  FarmProperty,
  CreateFarmPropertyDto,
  IrrigationPivot,
  CreateIrrigationPivotDto,
  IrrigationTelemetryLog,
  RecordIrrigationTelemetryDto,
  HarvestCampaignLog,
  RecordHarvestCampaignDto,
} from '@docteurflotte/contracts';

@Controller('api/v1/agriculture')
export class SaharanAgricultureController {
  constructor(
    private readonly farmService: FarmPropertiesService,
    private readonly pivotService: IrrigationPivotsService,
    private readonly harvestService: HarvestCampaignsService,
  ) {}

  // 1. Domaines & Exploitations Agricoles
  @Get('farms')
  async listFarms(@Req() req: any, @Query('tenantId') queryTenantId?: string): Promise<FarmProperty[]> {
    const tenantId = req.user?.tenantId || queryTenantId || 'demo-tenant-id';
    return this.farmService.listFarms(tenantId);
  }

  @Post('farms')
  async createFarm(@Body() dto: CreateFarmPropertyDto, @Req() req: any): Promise<FarmProperty> {
    const tenantId = req.user?.tenantId || 'demo-tenant-id';
    return this.farmService.createFarm(tenantId, dto);
  }

  @Get('farms/:id')
  async getFarm(@Param('id') id: string, @Req() req: any): Promise<FarmProperty> {
    const tenantId = req.user?.tenantId || 'demo-tenant-id';
    return this.farmService.getFarm(tenantId, id);
  }

  // 2. Pivots d'Irrigation & Forages Albien
  @Get('pivots')
  async listPivots(
    @Req() req: any,
    @Query('farmId') farmId?: string,
    @Query('tenantId') queryTenantId?: string,
  ): Promise<IrrigationPivot[]> {
    const tenantId = req.user?.tenantId || queryTenantId || 'demo-tenant-id';
    return this.pivotService.listPivots(tenantId, farmId);
  }

  @Post('pivots')
  async createPivot(@Body() dto: CreateIrrigationPivotDto, @Req() req: any): Promise<IrrigationPivot> {
    const tenantId = req.user?.tenantId || 'demo-tenant-id';
    return this.pivotService.createPivot(tenantId, dto);
  }

  @Post('pivots/telemetry')
  async recordTelemetry(
    @Body() dto: RecordIrrigationTelemetryDto,
    @Req() req: any,
  ): Promise<IrrigationTelemetryLog> {
    const tenantId = req.user?.tenantId || 'demo-tenant-id';
    return this.pivotService.recordTelemetry(tenantId, dto);
  }

  @Get('pivots/:id/telemetry')
  async listTelemetry(
    @Param('id') id: string,
    @Req() req: any,
    @Query('limit') limit?: string,
  ): Promise<IrrigationTelemetryLog[]> {
    const tenantId = req.user?.tenantId || 'demo-tenant-id';
    return this.pivotService.listTelemetry(tenantId, id, limit ? Number(limit) : 50);
  }

  // 3. Campagnes Moisson-Battage
  @Get('harvest')
  async listHarvestLogs(
    @Req() req: any,
    @Query('farmId') farmId?: string,
    @Query('year') year?: string,
    @Query('tenantId') queryTenantId?: string,
  ): Promise<HarvestCampaignLog[]> {
    const tenantId = req.user?.tenantId || queryTenantId || 'demo-tenant-id';
    return this.harvestService.listHarvestLogs(tenantId, {
      farmId,
      year: year ? Number(year) : undefined,
    });
  }

  @Post('harvest')
  async recordHarvest(
    @Body() dto: RecordHarvestCampaignDto,
    @Req() req: any,
  ): Promise<HarvestCampaignLog> {
    const tenantId = req.user?.tenantId || 'demo-tenant-id';
    return this.harvestService.recordHarvest(tenantId, dto);
  }
}

