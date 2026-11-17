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
import { AccidentClaimService } from './services/accident-claim.service';
import { TrafficFineService } from './services/traffic-fine.service';
import { InsuranceCaseService, OpenInsuranceCaseDto, SettleInsuranceCaseDto } from './services/insurance-case.service';
import { RiskScoreService } from './services/risk-score.service';
import {
  CreateAccidentClaimDto,
  RecordTrafficFineDto,
  ClaimStatus,
} from '@docteurflotte/contracts';

@Controller('claims-fines')
@UseGuards(JwtAuthGuard)
export class ClaimsFinesController {
  constructor(
    private readonly accidentService: AccidentClaimService,
    private readonly fineService: TrafficFineService,
    private readonly insuranceService: InsuranceCaseService,
    private readonly riskService: RiskScoreService,
  ) {}

  // 1. Sinistres & Accidents
  @Get('claims')
  async listClaims(
    @Req() req: AuthenticatedRequest,
    @Query('assetId') assetId?: string,
    @Query('status') status?: ClaimStatus,
  ) {
    return this.accidentService.listClaims(req.tenantId, { assetId, status });
  }

  @Post('claims')
  async createClaim(
    @Req() req: AuthenticatedRequest,
    @Body() dto: CreateAccidentClaimDto,
  ) {
    return this.accidentService.createClaim(req.tenantId, dto);
  }

  @Get('claims/:id')
  async getClaim(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.accidentService.getClaimById(req.tenantId, id);
  }

  @Put('claims/:id/status')
  async updateClaimStatus(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
    @Body('status') status: ClaimStatus,
  ) {
    return this.accidentService.updateClaimStatus(req.tenantId, id, status);
  }

  // 2. Amendes & Infractions Routières (Imputation Chauffeur à l'instant t)
  @Get('fines')
  async listFines(
    @Req() req: AuthenticatedRequest,
    @Query('assetId') assetId?: string,
    @Query('driverId') driverId?: string,
    @Query('isPaid') isPaid?: string,
  ) {
    const isPaidBool = isPaid !== undefined ? isPaid === 'true' : undefined;
    return this.fineService.listFines(req.tenantId, { assetId, driverId, isPaid: isPaidBool });
  }

  @Post('fines')
  async recordFine(
    @Req() req: AuthenticatedRequest,
    @Body() dto: RecordTrafficFineDto,
  ) {
    return this.fineService.recordFine(req.tenantId, dto);
  }

  @Get('fines/:id')
  async getFine(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.fineService.getFineById(req.tenantId, id);
  }

  @Put('fines/:id/pay')
  async payFine(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.fineService.payFine(req.tenantId, id);
  }

  @Put('fines/:id/contest')
  async contestFine(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
    @Body('reason') reason: string,
  ) {
    return this.fineService.contestFine(req.tenantId, id, reason);
  }

  // 3. Dossiers d'Assurances
  @Get('insurance-cases')
  async listCases(
    @Req() req: AuthenticatedRequest,
    @Query('assetId') assetId?: string,
    @Query('isClosed') isClosed?: string,
  ) {
    const isClosedBool = isClosed !== undefined ? isClosed === 'true' : undefined;
    return this.insuranceService.listCases(req.tenantId, { assetId, isClosed: isClosedBool });
  }

  @Post('insurance-cases')
  async openCase(
    @Req() req: AuthenticatedRequest,
    @Body() dto: OpenInsuranceCaseDto,
  ) {
    return this.insuranceService.openCase(req.tenantId, dto);
  }

  @Get('insurance-cases/:id')
  async getCase(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.insuranceService.getCaseById(req.tenantId, id);
  }

  @Put('insurance-cases/:id/settle')
  async settleCase(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
    @Body() dto: SettleInsuranceCaseDto,
  ) {
    return this.insuranceService.settleCase(req.tenantId, id, dto);
  }

  // 4. Scoring Risque Flotte & Actifs
  @Get('risk-scores/fleet')
  async getFleetRiskSummary(@Req() req: AuthenticatedRequest) {
    return this.riskService.getFleetRiskSummary(req.tenantId);
  }

  @Get('risk-scores/asset/:assetId')
  async getAssetRiskScore(
    @Req() req: AuthenticatedRequest,
    @Param('assetId') assetId: string,
  ) {
    return this.riskService.getAssetRiskScore(req.tenantId, assetId);
  }
}

