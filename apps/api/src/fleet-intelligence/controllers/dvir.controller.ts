import { Body, Controller, Get, Post, Query, Req } from '@nestjs/common';
import { DvirService } from '../services/dvir.service';
import { DVIRInspectionReport, DVIRSubmissionDto } from '@docteurflotte/contracts';

@Controller('api/v1/dvir')
export class DvirController {
  constructor(private readonly dvirService: DvirService) {}

  @Post('submit')
  submitReport(@Body() dto: DVIRSubmissionDto, @Req() req?: any): DVIRInspectionReport {
    const resolvedTenantId = req?.tenantId || req?.user?.tenantId || 'tenant-demo';
    return this.dvirService.submitReport(dto, resolvedTenantId);
  }

  @Get('reports')
  getReports(@Query('tenantId') tenantId?: string, @Req() req?: any): DVIRInspectionReport[] {
    const resolvedTenantId = req?.tenantId || req?.user?.tenantId || tenantId || 'tenant-demo';
    return this.dvirService.getRecentReports(resolvedTenantId);
  }
}
