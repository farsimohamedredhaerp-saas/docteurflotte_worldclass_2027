import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  Req,
} from '@nestjs/common';
import { JwtAuthGuard, AuthenticatedRequest } from '../auth/auth.guard';
import { CostCenterService } from './services/cost-center.service';
import { TcoAggregationService } from './services/tco-aggregation.service';
import { RepairVsReplaceSimulatorService } from './services/repair-vs-replace-simulator.service';
import { CostTwinService } from './services/cost-twin.service';

@Controller('tco')
@UseGuards(JwtAuthGuard)
export class TcoProfitabilityController {
  constructor(
    private readonly costCenterService: CostCenterService,
    private readonly tcoAggregationService: TcoAggregationService,
    private readonly simulatorService: RepairVsReplaceSimulatorService,
    private readonly costTwinService: CostTwinService,
  ) {}

  // 1. Centres de Coûts & Budgets
  @Get('cost-centers')
  async listCostCenters(@Req() req: AuthenticatedRequest) {
    return this.costCenterService.listCostCenters(req.tenantId);
  }

  @Post('cost-centers')
  async assignCostCenter(
    @Req() req: AuthenticatedRequest,
    @Body() dto: {
      assetId: string;
      costCenterCode: string;
      allocatedBusinessUnit: string;
      targetCostPerKmDzd?: number;
      targetCostPerHourDzd?: number;
      monthlyFixedBudgetDzd?: number;
    },
  ) {
    return this.costCenterService.assignCostCenter(req.tenantId, dto);
  }

  @Get('cost-centers/asset/:assetId')
  async getCostCenter(
    @Req() req: AuthenticatedRequest,
    @Param('assetId') assetId: string,
  ) {
    return this.costCenterService.getCostCenterByAsset(req.tenantId, assetId);
  }

  // 2. Synthèse TCO & Coûts Directs par Actif
  @Get('summary')
  async getFleetTcoSummary(
    @Req() req: AuthenticatedRequest,
    @Query('year') year?: string,
    @Query('month') month?: string,
  ) {
    const y = year ? parseInt(year, 10) : undefined;
    const m = month ? parseInt(month, 10) : undefined;
    return this.tcoAggregationService.getFleetTcoSummary(req.tenantId, y, m);
  }

  @Get('summary/asset/:assetId')
  async getAssetTcoSummary(
    @Req() req: AuthenticatedRequest,
    @Param('assetId') assetId: string,
    @Query('year') year?: string,
    @Query('month') month?: string,
  ) {
    const y = year ? parseInt(year, 10) : undefined;
    const m = month ? parseInt(month, 10) : undefined;
    return this.tcoAggregationService.getAssetDirectCostsSummary(req.tenantId, assetId, y, m);
  }

  // 3. Simulateur Décisionnel "Réparer vs Remplacer" (12/24 mois)
  @Post('simulations/repair-vs-replace/:assetId')
  async simulateRepairVsReplace(
    @Req() req: AuthenticatedRequest,
    @Param('assetId') assetId: string,
    @Body('horizonMonths') horizonMonths?: number,
  ) {
    return this.simulatorService.simulateRepairVsReplace(
      req.tenantId,
      assetId,
      horizonMonths || 24,
    );
  }

  // 4. Jumeau Numérique de Coût (DZD/km & DZD/h) Mode 0 & Mode 1
  @Get('cost-twin')
  async getFleetCostTwin(
    @Req() req: AuthenticatedRequest,
    @Query('period') period?: string,
  ) {
    return this.costTwinService.getFleetCostTwin(req.tenantId, period);
  }

  @Get('cost-twin/asset/:assetId')
  async getAssetCostTwin(
    @Req() req: AuthenticatedRequest,
    @Param('assetId') assetId: string,
    @Query('period') period?: string,
  ) {
    return this.costTwinService.getAssetCostTwin(req.tenantId, assetId, period);
  }
}

