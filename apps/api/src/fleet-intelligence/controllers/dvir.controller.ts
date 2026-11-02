import { Body, Controller, Get, Param, Post, Query, Req } from '@nestjs/common';
import { DvirService } from '../services/dvir.service';
import { AuthenticatedRequest } from '../../auth/auth.guard';
import {
  DVIRInspectionReport,
  DVIRResolveBlockDto,
  DVIRResolveBlockResult,
  DVIRSubmissionDto,
  DVIRSyncBatchDto,
  DVIRSyncBatchResult,
} from '@docteurflotte/contracts';

@Controller('api/v1/dvir')
export class DvirController {
  constructor(private readonly dvirService: DvirService) {}

  private extractTenantId(req?: AuthenticatedRequest, fallback?: string): string {
    return (
      req?.tenantId ||
      req?.user?.tenantId ||
      (req?.headers ? (req.headers['x-tenant-id'] as string) : undefined) ||
      fallback ||
      'tenant-demo'
    );
  }

  @Post('submit')
  submitReport(
    @Body() dto: DVIRSubmissionDto,
    @Req() req?: AuthenticatedRequest,
  ): DVIRInspectionReport {
    const resolvedTenantId = this.extractTenantId(req);
    return this.dvirService.submitReport(dto, resolvedTenantId);
  }

  @Post('sync-batch')
  syncOfflineBatch(
    @Body() dto: DVIRSyncBatchDto,
    @Req() req?: AuthenticatedRequest,
  ): DVIRSyncBatchResult {
    const resolvedTenantId = this.extractTenantId(req);
    return this.dvirService.syncOfflineReports(dto, resolvedTenantId);
  }

  @Post('resolve-block')
  resolveBlock(
    @Body() dto: DVIRResolveBlockDto,
    @Req() req?: AuthenticatedRequest,
  ): DVIRResolveBlockResult {
    const resolvedTenantId = this.extractTenantId(req);
    return this.dvirService.resolveDvirBlock(
      dto.assetId,
      dto.workOrderId,
      resolvedTenantId,
      dto.resolutionNotes,
    );
  }

  @Get('status/:assetId')
  getAssetDvirStatus(
    @Param('assetId') assetId: string,
    @Req() req?: AuthenticatedRequest,
  ): {
    assetId: string;
    isBlockedByDvir: boolean;
    latestReport?: DVIRInspectionReport;
  } {
    const resolvedTenantId = this.extractTenantId(req);
    const reports = this.dvirService.getReportsByAsset(assetId, resolvedTenantId);
    const latest = reports.length > 0 ? reports[0] : undefined;
    return {
      assetId,
      isBlockedByDvir: latest ? latest.hasCriticalFailures : false,
      latestReport: latest,
    };
  }

  @Get('reports')
  getReports(
    @Query('tenantId') tenantId?: string,
    @Req() req?: AuthenticatedRequest,
  ): DVIRInspectionReport[] {
    const resolvedTenantId = this.extractTenantId(req, tenantId);
    return this.dvirService.getRecentReports(resolvedTenantId);
  }
}
