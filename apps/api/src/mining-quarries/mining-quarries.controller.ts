import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  Headers,
  UseGuards,
  UnauthorizedException,
} from '@nestjs/common';
import { MiningSitesService } from './services/mining-sites.service';
import { OtrTiresService } from './services/otr-tires.service';
import { DumperHaulingService } from './services/dumper-hauling.service';
import {
  CreateMiningSiteDto,
  CreateOtrTireDto,
  UpdateOtrTireTelemetryDto,
  RecordHaulingCycleDto,
  OtrTireStatus,
} from '@docteurflotte/contracts';

@Controller('api/v1/mining')
export class MiningQuarriesController {
  constructor(
    private readonly sitesService: MiningSitesService,
    private readonly tiresService: OtrTiresService,
    private readonly haulingService: DumperHaulingService,
  ) {}

  private extractTenantId(authHeader?: string, tenantHeader?: string): string {
    if (tenantHeader) return tenantHeader;
    // Fallback tenant id pour tests et démonstration
    return 'demo-tenant-dz';
  }

  // --- SITES MINIERS & CARRIÈRES ---
  @Get('sites')
  async listSites(
    @Headers('authorization') auth?: string,
    @Headers('x-tenant-id') tenant?: string,
  ) {
    const tenantId = this.extractTenantId(auth, tenant);
    return this.sitesService.listSites(tenantId);
  }

  @Post('sites')
  async createSite(
    @Body() dto: CreateMiningSiteDto,
    @Headers('authorization') auth?: string,
    @Headers('x-tenant-id') tenant?: string,
  ) {
    const tenantId = this.extractTenantId(auth, tenant);
    return this.sitesService.createSite(tenantId, dto);
  }

  // --- PNEUMATIQUES HORS-ROUTE (OTR) ---
  @Get('tires')
  async listTires(
    @Query('assetId') assetId?: string,
    @Query('status') status?: OtrTireStatus,
    @Headers('authorization') auth?: string,
    @Headers('x-tenant-id') tenant?: string,
  ) {
    const tenantId = this.extractTenantId(auth, tenant);
    return this.tiresService.listTires(tenantId, { assetId, status });
  }

  @Post('tires')
  async createTire(
    @Body() dto: CreateOtrTireDto,
    @Headers('authorization') auth?: string,
    @Headers('x-tenant-id') tenant?: string,
  ) {
    const tenantId = this.extractTenantId(auth, tenant);
    return this.tiresService.createTire(tenantId, dto);
  }

  @Post('tires/telemetry')
  async updateTireTelemetry(
    @Body() dto: UpdateOtrTireTelemetryDto,
    @Headers('authorization') auth?: string,
    @Headers('x-tenant-id') tenant?: string,
  ) {
    const tenantId = this.extractTenantId(auth, tenant);
    return this.tiresService.updateTireTelemetry(tenantId, dto);
  }

  // --- CYCLES DE ROULAGE & DÉTERMINISME TKPH ---
  @Get('cycles')
  async listCycles(
    @Query('siteId') siteId?: string,
    @Query('assetId') assetId?: string,
    @Query('limit') limit?: string,
    @Headers('authorization') auth?: string,
    @Headers('x-tenant-id') tenant?: string,
  ) {
    const tenantId = this.extractTenantId(auth, tenant);
    return this.haulingService.listCycles(tenantId, {
      siteId,
      assetId,
      limit: limit ? parseInt(limit, 10) : 50,
    });
  }

  @Post('cycles')
  async recordCycle(
    @Body() dto: RecordHaulingCycleDto,
    @Headers('authorization') auth?: string,
    @Headers('x-tenant-id') tenant?: string,
  ) {
    const tenantId = this.extractTenantId(auth, tenant);
    return this.haulingService.recordCycle(tenantId, dto);
  }
}
