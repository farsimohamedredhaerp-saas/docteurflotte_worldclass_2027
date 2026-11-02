import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Req,
  UseGuards,
  ValidationPipe,
} from '@nestjs/common';
import { SubscriptionsService } from './subscriptions.service';
import { JwtAuthGuard, AuthenticatedRequest } from '../auth/auth.guard';
import { PlatformAdminGuard } from '../admin/guards/platform-admin.guard';
import {
  CreateSubscriptionPlanHttpDto,
  UpdateSubscriptionPlanHttpDto,
  UpdateTenantSubscriptionHttpDto,
  GenerateInvoiceHttpDto,
  ClientQuoteRequestHttpDto,
} from './dto/subscription.dto';
import {
  SubscriptionPlan,
  TenantSubscription,
  SubscriptionInvoice,
} from '@docteurflotte/contracts';

@Controller('subscriptions')
export class SubscriptionsController {
  constructor(private readonly subscriptionsService: SubscriptionsService) {}

  // =========================================================================
  // ROUTES PUBLIQUES & CLIENT (TENANT)
  // =========================================================================

  @Get('plans')
  async getPublicPlans(): Promise<SubscriptionPlan[]> {
    return this.subscriptionsService.getPublicPlans();
  }

  @Get('current')
  @UseGuards(JwtAuthGuard)
  async getCurrentSubscription(@Req() req: AuthenticatedRequest): Promise<TenantSubscription> {
    return this.subscriptionsService.getTenantSubscription(req.tenantId);
  }

  @Get('invoices')
  @UseGuards(JwtAuthGuard)
  async getTenantInvoices(@Req() req: AuthenticatedRequest): Promise<SubscriptionInvoice[]> {
    return this.subscriptionsService.getInvoicesForTenant(req.tenantId);
  }

  @Post('quote-request')
  @UseGuards(JwtAuthGuard)
  async submitQuoteRequest(
    @Req() req: AuthenticatedRequest,
    @Body(new ValidationPipe({ whitelist: true, transform: true })) dto: ClientQuoteRequestHttpDto
  ) {
    return this.subscriptionsService.submitQuoteRequest(req.tenantId, dto);
  }

  // =========================================================================
  // ROUTES SUPERADMIN (CONTROL PLANE SAAS)
  // =========================================================================

  @Get('admin/plans')
  @UseGuards(JwtAuthGuard, PlatformAdminGuard)
  async getAllPlansAdmin(): Promise<SubscriptionPlan[]> {
    return this.subscriptionsService.getAllPlans();
  }

  @Post('admin/plans')
  @UseGuards(JwtAuthGuard, PlatformAdminGuard)
  async createPlan(
    @Body(new ValidationPipe({ whitelist: true, transform: true })) dto: CreateSubscriptionPlanHttpDto
  ): Promise<SubscriptionPlan> {
    return this.subscriptionsService.createPlan(dto);
  }

  @Put('admin/plans/:id')
  @UseGuards(JwtAuthGuard, PlatformAdminGuard)
  async updatePlan(
    @Param('id') id: string,
    @Body(new ValidationPipe({ whitelist: true, transform: true })) dto: UpdateSubscriptionPlanHttpDto
  ): Promise<SubscriptionPlan> {
    return this.subscriptionsService.updatePlan(id, dto);
  }

  @Delete('admin/plans/:id')
  @UseGuards(JwtAuthGuard, PlatformAdminGuard)
  async deletePlan(@Param('id') id: string) {
    return this.subscriptionsService.deletePlan(id);
  }

  @Get('admin/tenants')
  @UseGuards(JwtAuthGuard, PlatformAdminGuard)
  async getAllTenantSubscriptions(): Promise<TenantSubscription[]> {
    return this.subscriptionsService.getAllTenantSubscriptions();
  }

  @Get('admin/tenants/:tenantId')
  @UseGuards(JwtAuthGuard, PlatformAdminGuard)
  async getTenantSubscriptionAdmin(@Param('tenantId') tenantId: string): Promise<TenantSubscription> {
    return this.subscriptionsService.getTenantSubscription(tenantId);
  }

  @Put('admin/tenants/:tenantId')
  @UseGuards(JwtAuthGuard, PlatformAdminGuard)
  async updateTenantSubscriptionAdmin(
    @Param('tenantId') tenantId: string,
    @Body(new ValidationPipe({ whitelist: true, transform: true })) dto: UpdateTenantSubscriptionHttpDto
  ): Promise<TenantSubscription> {
    return this.subscriptionsService.updateTenantSubscription(tenantId, dto);
  }

  @Post('admin/tenants/:tenantId/invoice')
  @UseGuards(JwtAuthGuard, PlatformAdminGuard)
  async generateInvoice(
    @Param('tenantId') tenantId: string,
    @Body(new ValidationPipe({ whitelist: true, transform: true })) dto: GenerateInvoiceHttpDto
  ): Promise<SubscriptionInvoice> {
    return this.subscriptionsService.generateInvoice(tenantId, dto);
  }
}

