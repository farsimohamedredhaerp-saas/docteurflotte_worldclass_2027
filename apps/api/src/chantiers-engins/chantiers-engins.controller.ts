import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  Query,
  UseGuards,
  Req,
} from '@nestjs/common';
import { JwtAuthGuard, AuthenticatedRequest } from '../auth/auth.guard';
import { SiteWorkspaceService } from './services/site-workspace.service';
import { AssetAssignmentService } from './services/asset-assignment.service';
import { EngineHoursService } from './services/engine-hours.service';
import { TransferChecklistService } from './services/transfer-checklist.service';
import { SiteProfitabilityService } from './services/site-profitability.service';
import { SiteConsumablesService } from './services/site-consumables.service';
import { WorkSituationsService } from './services/work-situations.service';
import {
  CreateSiteWorkspaceDto,
  CreateAssetSiteAssignmentDto,
  RecordEngineHourLogDto,
  CreateAssetTransferChecklistDto,
  RecordSiteSituationDto,
  CreateSiteConsumableTankDto,
  RecordSiteConsumableDeliveryDto,
  CreateSiteWorkSituationDto,
  SiteStatus,
  AssignmentStatus,
} from '@docteurflotte/contracts';

@Controller('sites')
@UseGuards(JwtAuthGuard)
export class ChantiersEnginsController {
  constructor(
    private readonly siteService: SiteWorkspaceService,
    private readonly assignmentService: AssetAssignmentService,
    private readonly engineHoursService: EngineHoursService,
    private readonly transferChecklistService: TransferChecklistService,
    private readonly profitabilityService: SiteProfitabilityService,
    private readonly consumablesService: SiteConsumablesService,
    private readonly situationsService: WorkSituationsService,
  ) {}

  // 1. Chantiers / Sites Workspaces
  @Get()
  async listSites(
    @Req() req: AuthenticatedRequest,
    @Query('status') status?: SiteStatus,
  ) {
    return this.siteService.listSites(req.tenantId, status);
  }

  @Post()
  async createSite(
    @Req() req: AuthenticatedRequest,
    @Body() dto: CreateSiteWorkspaceDto,
  ) {
    return this.siteService.createSite(req.tenantId, dto);
  }

  @Get(':id')
  async getSite(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
  ) {
    return this.siteService.getSiteById(req.tenantId, id);
  }

  @Put(':id/status')
  async updateSiteStatus(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
    @Body('status') status: SiteStatus,
  ) {
    return this.siteService.updateSiteStatus(req.tenantId, id, status);
  }

  @Get(':id/profitability')
  async getSiteProfitability(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
  ) {
    return this.profitabilityService.getSiteProfitability(req.tenantId, id);
  }

  @Post(':id/situations')
  async recordSiteSituation(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
    @Body() dto: Omit<RecordSiteSituationDto, 'siteId'>,
  ) {
    return this.siteService.recordSiteSituation(req.tenantId, {
      ...dto,
      siteId: id,
    });
  }

  // 2. Affectations d'Actifs (Asset-Centric)
  @Get('assignments/list')
  async listAssignments(
    @Req() req: AuthenticatedRequest,
    @Query('siteId') siteId?: string,
    @Query('assetId') assetId?: string,
    @Query('status') status?: AssignmentStatus,
  ) {
    return this.assignmentService.listAssignments(req.tenantId, {
      siteId,
      assetId,
      status,
    });
  }

  @Post('assignments')
  async assignAsset(
    @Req() req: AuthenticatedRequest,
    @Body() dto: CreateAssetSiteAssignmentDto,
  ) {
    return this.assignmentService.assignAssetToSite(
      req.tenantId,
      dto,
      req.user?.sub,
    );
  }

  @Put('assignments/:id/end')
  async endAssignment(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
    @Body('endMeterHours') endMeterHours: number,
    @Body('notes') notes?: string,
  ) {
    return this.assignmentService.endAssignment(
      req.tenantId,
      id,
      endMeterHours,
      notes,
    );
  }

  // 3. Relevés d'Heures Moteur (Mode 0 & Mode 2 CAN J1939)
  @Post('engine-hours')
  async recordEngineHours(
    @Req() req: AuthenticatedRequest,
    @Body() dto: RecordEngineHourLogDto,
  ) {
    return this.engineHoursService.recordEngineHours(req.tenantId, dto);
  }

  @Get('engine-hours/list')
  async listEngineHourLogs(
    @Req() req: AuthenticatedRequest,
    @Query('assetId') assetId?: string,
    @Query('siteId') siteId?: string,
    @Query('limit') limit?: string,
  ) {
    return this.engineHoursService.listEngineHourLogs(req.tenantId, {
      assetId,
      siteId,
      limit: limit ? parseInt(limit, 10) : undefined,
    });
  }

  // 4. Checklists de Transfert Inter-Chantiers
  @Post('transfers')
  async createTransferChecklist(
    @Req() req: AuthenticatedRequest,
    @Body() dto: CreateAssetTransferChecklistDto,
  ) {
    return this.transferChecklistService.createDepartureChecklist(
      req.tenantId,
      dto,
    );
  }

  @Put('transfers/:id/receive')
  async completeArrivalChecklist(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
    @Body()
    body: {
      receivedBy: string;
      meterHoursArrival: number;
      signatureArrivalSvg?: string;
    },
  ) {
    return this.transferChecklistService.completeArrivalChecklist(
      req.tenantId,
      id,
      body,
    );
  }

  @Get('transfers/list')
  async listTransferChecklists(
    @Req() req: AuthenticatedRequest,
    @Query('assetId') assetId?: string,
    @Query('siteId') siteId?: string,
  ) {
    return this.transferChecklistService.listChecklists(req.tenantId, {
      assetId,
      siteId,
    });
  }

  // 5. Cuves & Gestion Multi-Fluides de Chantier
  @Get('consumables/tanks')
  async listTanks(
    @Req() req: AuthenticatedRequest,
    @Query('siteId') siteId?: string,
  ) {
    return this.consumablesService.listTanks(req.tenantId, siteId);
  }

  @Post('consumables/tanks')
  async createTank(
    @Req() req: AuthenticatedRequest,
    @Body() dto: CreateSiteConsumableTankDto,
  ) {
    return this.consumablesService.createTank(req.tenantId, dto);
  }

  @Get('consumables/deliveries')
  async listDeliveries(
    @Req() req: AuthenticatedRequest,
    @Query('siteId') siteId?: string,
  ) {
    return this.consumablesService.listDeliveries(req.tenantId, siteId);
  }

  @Post('consumables/deliveries')
  async recordDelivery(
    @Req() req: AuthenticatedRequest,
    @Body() dto: RecordSiteConsumableDeliveryDto,
  ) {
    return this.consumablesService.recordDelivery(req.tenantId, dto);
  }

  // 6. Situations de Travaux BTPH (DPM - Décomptes Provisoires Mensuels)
  @Get('work-situations')
  async listWorkSituations(
    @Req() req: AuthenticatedRequest,
    @Query('siteId') siteId?: string,
  ) {
    return this.situationsService.listSituations(req.tenantId, siteId);
  }

  @Post('work-situations')
  async createWorkSituation(
    @Req() req: AuthenticatedRequest,
    @Body() dto: CreateSiteWorkSituationDto,
  ) {
    return this.situationsService.createSituation(req.tenantId, dto);
  }

  @Put('work-situations/:id/approve')
  async approveWorkSituation(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
  ) {
    return this.situationsService.approveSituation(req.tenantId, id);
  }

  @Put('work-situations/:id/bill')
  async billWorkSituation(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
  ) {
    return this.situationsService.billSituation(req.tenantId, id);
  }

  @Put('work-situations/:id/settle')
  async settleWorkSituation(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
    @Body('settlementDate') settlementDate?: string,
  ) {
    return this.situationsService.settleSituation(req.tenantId, id, settlementDate);
  }
}
