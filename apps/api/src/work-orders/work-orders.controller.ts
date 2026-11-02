import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
  Req,
  UseGuards,
  ValidationPipe,
} from '@nestjs/common';
import { WorkOrdersService } from './work-orders.service';
import { CreateWorkOrderDto } from './dto/create-work-order.dto';
import { CompleteWorkOrderDto } from './dto/complete-work-order.dto';
import { JwtAuthGuard, AuthenticatedRequest } from '../auth/auth.guard';
import { WorkOrder, WorkOrderStatus } from '@docteurflotte/contracts';

@Controller('work-orders')
@UseGuards(JwtAuthGuard)
export class WorkOrdersController {
  constructor(private readonly workOrdersService: WorkOrdersService) { }

  @Post()
  async createWorkOrder(
    @Req() req: AuthenticatedRequest,
    @Body(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }))
    dto: CreateWorkOrderDto,
  ): Promise<WorkOrder> {
    return this.workOrdersService.createWorkOrder(req.tenantId, dto);
  }

  @Get()
  async listWorkOrders(
    @Req() req: AuthenticatedRequest,
    @Query('status') status?: WorkOrderStatus,
  ): Promise<WorkOrder[]> {
    return this.workOrdersService.listWorkOrders(req.tenantId, status);
  }

  @Put(':id')
  async updateWorkOrder(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
    @Body() dto: Partial<CreateWorkOrderDto>,
  ): Promise<WorkOrder> {
    return this.workOrdersService.updateWorkOrder(req.tenantId, id, dto);
  }

  @Delete(':id')
  async deleteWorkOrder(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
  ): Promise<{ success: boolean }> {
    return this.workOrdersService.deleteWorkOrder(req.tenantId, id);
  }

  @Post(':id/complete')
  async completeWorkOrder(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
    @Body(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }))
    dto: CompleteWorkOrderDto,
  ): Promise<WorkOrder> {
    return this.workOrdersService.completeWorkOrder(req.tenantId, id, dto);
  }
}
