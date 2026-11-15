import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Put,
  Req,
  UseGuards,
} from '@nestjs/common';
import {
  CreateDecisionConfigDto,
  DecisionEngineSimulationParams,
  PlatformFiscalFuelPrice,
  PlatformTelematicsGateway,
  PlatformTenant,
  UpdateDecisionConfigDto,
  UpdatePlatformRegulatoryEnactaRuleDto,
} from '@docteurflotte/contracts';
import { JwtAuthGuard, AuthenticatedRequest } from '../auth/auth.guard';
import { PlatformAdminGuard } from './guards/platform-admin.guard';
import { AdminTenantsService } from './services/admin-tenants.service';
import { AdminDecisionEngineService } from './services/admin-decision-engine.service';
import { AdminFiscalService } from './services/admin-fiscal.service';
import { AdminGatewaysService } from './services/admin-gateways.service';
import { AdminAuditService } from './services/admin-audit.service';

@Controller('admin')
@UseGuards(JwtAuthGuard, PlatformAdminGuard)
export class AdminController {
  constructor(
    private readonly tenantsService: AdminTenantsService,
    private readonly decisionEngineService: AdminDecisionEngineService,
    private readonly fiscalService: AdminFiscalService,
    private readonly gatewaysService: AdminGatewaysService,
    private readonly auditService: AdminAuditService,
  ) {}

  @Get('overview')
  async getOverview() {
    return this.tenantsService.getPlatformOverview();
  }

  // Tenants
  @Get('tenants')
  async getTenants() {
    return this.tenantsService.getTenants();
  }

  @Get('tenants/:id')
  async getTenantById(@Param('id') id: string) {
    return this.tenantsService.getTenantById(id);
  }

  @Patch('tenants/:id')
  async updateTenant(
    @Param('id') id: string,
    @Body() body: Partial<PlatformTenant>,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.tenantsService.updateTenant(id, body, req.user?.email || 'admin@docteurflotte.dz');
  }

  // Decision Engine
  @Get('decision-engine/configs')
  async getDecisionConfigs() {
    return this.decisionEngineService.getConfigs();
  }

  @Get('decision-engine/configs/:id')
  async getDecisionConfigById(@Param('id') id: string) {
    return this.decisionEngineService.getConfigById(id);
  }

  @Get('decision-engine/active')
  async getActivePublication() {
    return this.decisionEngineService.getActivePublication();
  }

  @Get('decision-engine/publications')
  async getPublications() {
    return this.decisionEngineService.getPublications();
  }

  @Post('decision-engine/drafts')
  async createDraftConfig(@Body() body: CreateDecisionConfigDto, @Req() req: AuthenticatedRequest) {
    return this.decisionEngineService.createDraftConfig(body, req.user?.email || 'admin@docteurflotte.dz');
  }

  @Put('decision-engine/drafts/:id')
  async updateDraftConfig(
    @Param('id') id: string,
    @Body() body: UpdateDecisionConfigDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.decisionEngineService.updateDraftConfig(id, body, req.user?.email || 'admin@docteurflotte.dz');
  }

  @Post('decision-engine/drafts/:id/approve')
  @HttpCode(HttpStatus.OK)
  async approveConfig(@Param('id') id: string, @Req() req: AuthenticatedRequest) {
    return this.decisionEngineService.approveConfig(id, req.user?.email || 'admin@docteurflotte.dz');
  }

  @Post('decision-engine/simulate')
  @HttpCode(HttpStatus.OK)
  async simulateConfig(@Body() body: DecisionEngineSimulationParams) {
    return this.decisionEngineService.simulateConfig(body);
  }

  @Post('decision-engine/activate')
  @HttpCode(HttpStatus.OK)
  async activateConfig(@Body() body: { configId: string; justification?: string }, @Req() req: AuthenticatedRequest) {
    return this.decisionEngineService.activateConfig(
      body.configId,
      req.user?.email || 'admin@docteurflotte.dz',
      body.justification || 'Activation SuperAdmin'
    );
  }

  @Post('decision-engine/rollback')
  @HttpCode(HttpStatus.OK)
  async rollbackConfig(@Body() body: { justification?: string }, @Req() req: AuthenticatedRequest) {
    return this.decisionEngineService.rollbackConfig(
      req.user?.email || 'admin@docteurflotte.dz',
      body.justification || 'Rollback SuperAdmin'
    );
  }

  // Fiscal & Regulatory
  @Get('fiscal/fuel-prices')
  async getFuelPrices() {
    return this.fiscalService.getFuelPrices();
  }

  @Patch('fiscal/fuel-prices/:id')
  async updateFuelPrice(
    @Param('id') id: string,
    @Body() body: Partial<PlatformFiscalFuelPrice>,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.fiscalService.updateFuelPrice(id, body, req.user?.email || 'admin@docteurflotte.dz');
  }

  @Get('fiscal/vignettes')
  async getVignettes() {
    return this.fiscalService.getVignettes();
  }

  @Get('fiscal/enacta')
  async getEnactaRules() {
    return this.fiscalService.getEnactaRules();
  }

  @Patch('fiscal/enacta/:id')
  async updateEnactaRule(
    @Param('id') id: string,
    @Body() body: UpdatePlatformRegulatoryEnactaRuleDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.fiscalService.updateEnactaRule(id, body, req.user?.email || 'admin@docteurflotte.dz');
  }

  // Gateways
  @Get('gateways')
  async getGateways() {
    return this.gatewaysService.getGateways();
  }

  @Patch('gateways/:id')
  async updateGateway(
    @Param('id') id: string,
    @Body() body: Partial<PlatformTelematicsGateway>,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.gatewaysService.updateGateway(id, body, req.user?.email || 'admin@docteurflotte.dz');
  }

  // Audit Logs
  @Get('audit-logs')
  async getAuditLogs() {
    return this.auditService.getAuditLogs();
  }
}
