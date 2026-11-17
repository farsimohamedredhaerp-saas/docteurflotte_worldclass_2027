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
import { RentalContractService } from './services/rental-contract.service';
import { RentalCheckInOutService } from './services/rental-check-in-out.service';
import { RentalInvoiceService } from './services/rental-invoice.service';
import { RentalDisputeService } from './services/rental-dispute.service';
import {
  CreateRentalContractDto,
  CreateRentalCheckInOutDto,
  RentalContractStatus,
} from '@docteurflotte/contracts';

@Controller('rental')
@UseGuards(JwtAuthGuard)
export class RentalController {
  constructor(
    private readonly contractService: RentalContractService,
    private readonly checkInOutService: RentalCheckInOutService,
    private readonly invoiceService: RentalInvoiceService,
    private readonly disputeService: RentalDisputeService,
  ) {}

  // 1. Contrats de Location
  @Get('contracts')
  async listContracts(
    @Req() req: AuthenticatedRequest,
    @Query('assetId') assetId?: string,
    @Query('status') status?: RentalContractStatus,
  ) {
    return this.contractService.listContracts(req.tenantId, { assetId, status });
  }

  @Post('contracts')
  async createContract(
    @Req() req: AuthenticatedRequest,
    @Body() dto: CreateRentalContractDto,
  ) {
    return this.contractService.createContract(req.tenantId, dto);
  }

  @Get('contracts/:id')
  async getContract(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
  ) {
    return this.contractService.getContractById(req.tenantId, id);
  }

  @Put('contracts/:id/status')
  async updateContractStatus(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
    @Body('status') status: RentalContractStatus,
  ) {
    return this.contractService.updateContractStatus(req.tenantId, id, status);
  }

  // 2. Check-In & Check-Out (États des lieux)
  @Post('check-in-out')
  async recordCheckInOut(
    @Req() req: AuthenticatedRequest,
    @Body() dto: CreateRentalCheckInOutDto,
  ) {
    const performedBy = req.user?.email || req.user?.sub || 'Agent Location';
    return this.checkInOutService.recordCheckInOut(req.tenantId, dto, performedBy);
  }

  @Get('check-in-out')
  async listCheckInOuts(
    @Req() req: AuthenticatedRequest,
    @Query('contractId') contractId?: string,
  ) {
    return this.checkInOutService.listCheckInOuts(req.tenantId, contractId);
  }

  // 3. Facturation
  @Post('contracts/:id/invoice')
  async generateInvoice(
    @Req() req: AuthenticatedRequest,
    @Param('id') contractId: string,
    @Body() options?: { damagesDeductionsDzd?: number; applyStampDuty?: boolean },
  ) {
    return this.invoiceService.generateRentalInvoice(req.tenantId, contractId, options);
  }

  @Get('invoices')
  async listInvoices(
    @Req() req: AuthenticatedRequest,
    @Query('contractId') contractId?: string,
  ) {
    return this.invoiceService.listInvoices(req.tenantId, contractId);
  }

  // 4. Litiges & Contentieux
  @Post('disputes')
  async createDispute(
    @Req() req: AuthenticatedRequest,
    @Body()
    body: {
      contractId: string;
      claimant: 'LANDLORD' | 'TENANT';
      disputeReason: string;
      claimedAmountDzd: number;
      retainedDepositDzd?: number;
    },
  ) {
    return this.disputeService.createDispute(req.tenantId, body);
  }

  @Get('disputes')
  async listDisputes(
    @Req() req: AuthenticatedRequest,
    @Query('contractId') contractId?: string,
  ) {
    return this.disputeService.listDisputes(req.tenantId, contractId);
  }
}

