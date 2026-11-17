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
import {
  CreateSiteWorkspaceDto,
  CreateAssetSiteAssignmentDto,
  RecordEngineHourLogDto,
  CreateAssetTransferChecklistDto,
  RecordSiteSituationDto,
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
}
