import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { DecisionsService } from './decisions.service';
import { JwtAuthGuard } from '../auth/auth.guard';
import {
  ApproveDecisionDto,
  BudgetVarianceReport,
  CreateBudgetDto,
  DecisionRecommendation,
  DecisionStatus,
  DismissDecisionDto,
} from '@docteurflotte/contracts';

@Controller('decisions')
@UseGuards(JwtAuthGuard)
export class DecisionsController {
  constructor(private readonly decisionsService: DecisionsService) {}

  @Get()
  async listDecisions(
    @Req() req: any,
    @Query('status') status?: DecisionStatus,
  ): Promise<DecisionRecommendation[]> {
    return this.decisionsService.listDecisions(req.tenantId, status);
  }

  @Post('evaluate')
  async evaluateDecisions(@Req() req: any): Promise<DecisionRecommendation[]> {
    return this.decisionsService.evaluateTenantDecisions(req.tenantId);
  }

  @Post(':id/approve')
  async approveDecision(
    @Req() req: any,
    @Param('id') id: string,
    @Body() dto: ApproveDecisionDto,
  ): Promise<{ decision: DecisionRecommendation; workOrderId: string }> {
    return this.decisionsService.approveDecision(req.tenantId, id, dto);
  }

  @Post(':id/dismiss')
  async dismissDecision(
    @Req() req: any,
    @Param('id') id: string,
    @Body() dto: DismissDecisionDto,
  ): Promise<DecisionRecommendation> {
    return this.decisionsService.dismissDecision(req.tenantId, id, dto);
  }

  @Post('budgets')
  async setBudget(
    @Req() req: any,
    @Body() dto: CreateBudgetDto,
  ): Promise<{ success: boolean; message: string }> {
    await this.decisionsService.setBudget(req.tenantId, dto);
    return { success: true, message: 'Budget prévisionnel enregistré avec succès.' };
  }

  @Get('budget-variance')
  async getBudgetVariance(
    @Req() req: any,
    @Query('year') year?: string,
    @Query('period') period?: string,
  ): Promise<BudgetVarianceReport> {
    const rawYear = year || period;
    const selectedYear = rawYear ? parseInt(rawYear, 10) : new Date().getFullYear();
    return this.decisionsService.getBudgetVarianceReport(req.tenantId, selectedYear);
  }
}
