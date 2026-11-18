import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  Headers,
} from '@nestjs/common';
import { TmdDriversService } from './services/tmd-drivers.service';
import { TankerCompartmentsService } from './services/tanker-compartments.service';
import { TmdMissionsService } from './services/tmd-missions.service';
import {
  CreateTmdDriverCertificationDto,
  CreateFuelTankerCompartmentDto,
  UpdateCompartmentTelemetryDto,
  CreateTmdTransportMissionDto,
  TmdMissionStatus,
} from '@docteurflotte/contracts';

@Controller('api/v1/tmd')
export class TmdAdrController {
  constructor(
    private readonly driversService: TmdDriversService,
    private readonly compartmentsService: TankerCompartmentsService,
    private readonly missionsService: TmdMissionsService,
  ) {}

  private extractTenantId(authHeader?: string, tenantHeader?: string): string {
    if (tenantHeader) return tenantHeader;
    return 'demo-tenant-dz';
  }

  // --- HABILITATIONS & BREVETS CHAUFFEURS TMD ---
  @Get('drivers')
  async listDrivers(
    @Headers('authorization') auth?: string,
    @Headers('x-tenant-id') tenant?: string,
  ) {
    const tenantId = this.extractTenantId(auth, tenant);
    return this.driversService.listCertifications(tenantId);
  }

  @Post('drivers')
  async createDriverCert(
    @Body() dto: CreateTmdDriverCertificationDto,
    @Headers('authorization') auth?: string,
    @Headers('x-tenant-id') tenant?: string,
  ) {
    const tenantId = this.extractTenantId(auth, tenant);
    return this.driversService.createCertification(tenantId, dto);
  }

  // --- COMPARTIMENTS CITERNES HYDROCARBURES ---
  @Get('compartments')
  async listCompartments(
    @Query('assetId') assetId?: string,
    @Headers('authorization') auth?: string,
    @Headers('x-tenant-id') tenant?: string,
  ) {
    const tenantId = this.extractTenantId(auth, tenant);
    return this.compartmentsService.listCompartments(tenantId, assetId);
  }

  @Post('compartments')
  async createCompartment(
    @Body() dto: CreateFuelTankerCompartmentDto,
    @Headers('authorization') auth?: string,
    @Headers('x-tenant-id') tenant?: string,
  ) {
    const tenantId = this.extractTenantId(auth, tenant);
    return this.compartmentsService.createCompartment(tenantId, dto);
  }

  @Post('compartments/telemetry')
  async updateCompartmentTelemetry(
    @Body() dto: UpdateCompartmentTelemetryDto,
    @Headers('authorization') auth?: string,
    @Headers('x-tenant-id') tenant?: string,
  ) {
    const tenantId = this.extractTenantId(auth, tenant);
    return this.compartmentsService.updateCompartmentTelemetry(tenantId, dto);
  }

  // --- MISSIONS TMD & SÉCURITÉ VANNES ---
  @Get('missions')
  async listMissions(
    @Query('assetId') assetId?: string,
    @Query('status') status?: TmdMissionStatus,
    @Headers('authorization') auth?: string,
    @Headers('x-tenant-id') tenant?: string,
  ) {
    const tenantId = this.extractTenantId(auth, tenant);
    return this.missionsService.listMissions(tenantId, { assetId, status });
  }

  @Post('missions')
  async createMission(
    @Body() dto: CreateTmdTransportMissionDto,
    @Headers('authorization') auth?: string,
    @Headers('x-tenant-id') tenant?: string,
  ) {
    const tenantId = this.extractTenantId(auth, tenant);
    return this.missionsService.createMission(tenantId, dto);
  }

  @Post('missions/:id/valve-event')
  async recordValveEvent(
    @Param('id') missionId: string,
    @Body('isWithinAuthorizedGeofence') isAuthorized: boolean,
    @Headers('authorization') auth?: string,
    @Headers('x-tenant-id') tenant?: string,
  ) {
    const tenantId = this.extractTenantId(auth, tenant);
    return this.missionsService.recordValveOpening(tenantId, missionId, Boolean(isAuthorized));
  }
}

