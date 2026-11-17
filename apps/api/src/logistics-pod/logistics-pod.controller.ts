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
import { ConsignmentNoteService } from './services/consignment-note.service';
import { ProofOfDeliveryService } from './services/proof-of-delivery.service';
import { DeliveryDisputeService } from './services/delivery-dispute.service';
import { OtifMetricsService } from './services/otif-metrics.service';
import {
  CreateConsignmentNoteDto,
  RecordPodDto,
  ShipmentStatus,
} from '@docteurflotte/contracts';

@Controller('logistics')
@UseGuards(JwtAuthGuard)
export class LogisticsPodController {
  constructor(
    private readonly lveService: ConsignmentNoteService,
    private readonly podService: ProofOfDeliveryService,
    private readonly disputeService: DeliveryDisputeService,
    private readonly otifService: OtifMetricsService,
  ) {}

  // 1. Lettres de Voiture Électroniques (LVE)
  @Get('lve')
  async listConsignmentNotes(
    @Req() req: AuthenticatedRequest,
    @Query('assetId') assetId?: string,
    @Query('status') status?: ShipmentStatus,
  ) {
    return this.lveService.listConsignmentNotes(req.tenantId, { assetId, status });
  }

  @Post('lve')
  async createConsignmentNote(
    @Req() req: AuthenticatedRequest,
    @Body() dto: CreateConsignmentNoteDto,
  ) {
    return this.lveService.createConsignmentNote(req.tenantId, dto);
  }

  @Get('lve/:id')
  async getConsignmentNote(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
  ) {
    return this.lveService.getConsignmentNoteById(req.tenantId, id);
  }

  @Put('lve/:id/status')
  async updateShipmentStatus(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
    @Body('status') status: ShipmentStatus,
  ) {
    return this.lveService.updateShipmentStatus(req.tenantId, id, status);
  }

  // 2. Preuves de Livraison (POD)
  @Post('pod')
  async recordProofOfDelivery(
    @Req() req: AuthenticatedRequest,
    @Body() dto: RecordPodDto,
  ) {
    return this.podService.recordProofOfDelivery(req.tenantId, dto);
  }

  @Get('pod/:lveId')
  async getPodByLveId(
    @Req() req: AuthenticatedRequest,
    @Param('lveId') lveId: string,
  ) {
    return this.podService.getPodByLveId(req.tenantId, lveId);
  }

  // 3. Litiges de Livraison
  @Post('disputes')
  async createDispute(
    @Req() req: AuthenticatedRequest,
    @Body()
    data: {
      lveId: string;
      disputeType: 'DAMAGE' | 'SHORTAGE' | 'REFUSAL' | 'WRONG_ADDRESS' | 'LATE_DELIVERY';
      description: string;
      estimatedClaimAmountDzd?: number;
      photosUrls?: string[];
    },
  ) {
    return this.disputeService.createDispute(req.tenantId, data);
  }

  @Put('disputes/:id/settle')
  async settleDispute(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
  ) {
    return this.disputeService.settleDispute(req.tenantId, id);
  }

  @Get('disputes')
  async listDisputes(
    @Req() req: AuthenticatedRequest,
    @Query('lveId') lveId?: string,
  ) {
    return this.disputeService.listDisputes(req.tenantId, lveId);
  }

  // 4. Métriques OTIF
  @Get('metrics/otif')
  async getOtifMetrics(
    @Req() req: AuthenticatedRequest,
    @Query('assetId') assetId?: string,
  ) {
    return this.otifService.getOtifMetrics(req.tenantId, assetId);
  }
}

