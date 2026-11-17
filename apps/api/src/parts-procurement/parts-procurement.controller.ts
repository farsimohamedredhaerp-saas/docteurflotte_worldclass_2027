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
import { PartsInventoryService } from './services/parts-inventory.service';
import { PartsWarehouseService } from './services/parts-warehouse.service';
import { WorkOrderPartsService } from './services/work-order-parts.service';
import { PartsPurchaseOrderService } from './services/parts-purchase-order.service';
import {
  CreatePartItemDto,
  RecordWorkOrderPartConsumptionDto,
} from '@docteurflotte/contracts';

@Controller('parts')
@UseGuards(JwtAuthGuard)
export class PartsProcurementController {
  constructor(
    private readonly inventoryService: PartsInventoryService,
    private readonly warehouseService: PartsWarehouseService,
    private readonly workOrderPartsService: WorkOrderPartsService,
    private readonly poService: PartsPurchaseOrderService,
  ) {}

  // 1. Articles de Stock & Catalogue
  @Get('items')
  async listParts(
    @Req() req: AuthenticatedRequest,
    @Query('category') category?: string,
    @Query('lowStockOnly') lowStockOnly?: string,
  ) {
    return this.inventoryService.listParts(req.tenantId, {
      category,
      lowStockOnly: lowStockOnly === 'true',
    });
  }

  @Post('items')
  async createPart(
    @Req() req: AuthenticatedRequest,
    @Body() dto: CreatePartItemDto,
  ) {
    return this.inventoryService.createPartItem(req.tenantId, dto);
  }

  @Get('items/:id')
  async getPart(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.inventoryService.getPartById(req.tenantId, id);
  }

  // 2. Dépôts & Niveaux de Stock
  @Get('warehouses')
  async listWarehouses(@Req() req: AuthenticatedRequest) {
    return this.warehouseService.listWarehouses(req.tenantId);
  }

  @Post('warehouses')
  async createWarehouse(
    @Req() req: AuthenticatedRequest,
    @Body() dto: { code: string; name: string; wilayaCode: number; address?: string; managerName?: string },
  ) {
    return this.warehouseService.createWarehouse(req.tenantId, dto);
  }

  @Get('stock-levels')
  async getStockLevels(
    @Req() req: AuthenticatedRequest,
    @Query('warehouseId') warehouseId?: string,
  ) {
    return this.warehouseService.getStockLevels(req.tenantId, warehouseId);
  }

  @Post('stock-levels/adjust')
  async adjustStock(
    @Req() req: AuthenticatedRequest,
    @Body() dto: { partId: string; warehouseId: string; quantityAdjustment: number; locationBin?: string },
  ) {
    return this.warehouseService.adjustStock(req.tenantId, dto);
  }

  // 3. Imputation sur Ordres de Travail & Actif Racine
  @Post('consumptions')
  async recordConsumption(
    @Req() req: AuthenticatedRequest,
    @Body() dto: RecordWorkOrderPartConsumptionDto,
  ) {
    const userId = req.user?.sub || 'system';
    return this.workOrderPartsService.recordPartsConsumption(req.tenantId, userId, dto);
  }

  @Get('consumptions/work-order/:workOrderId')
  async listByWorkOrder(
    @Req() req: AuthenticatedRequest,
    @Param('workOrderId') workOrderId: string,
  ) {
    return this.workOrderPartsService.listConsumptionsByWorkOrder(req.tenantId, workOrderId);
  }

  @Get('consumptions/asset/:assetId')
  async listByAsset(
    @Req() req: AuthenticatedRequest,
    @Param('assetId') assetId: string,
  ) {
    return this.workOrderPartsService.listConsumptionsByAsset(req.tenantId, assetId);
  }

  // 4. Commandes Fournisseurs & Réceptions (CMUP)
  @Get('purchase-orders')
  async listPurchaseOrders(
    @Req() req: AuthenticatedRequest,
    @Query('status') status?: string,
  ) {
    return this.poService.listPurchaseOrders(req.tenantId, status);
  }

  @Post('purchase-orders')
  async createPurchaseOrder(
    @Req() req: AuthenticatedRequest,
    @Body() dto: {
      supplierName: string;
      supplierNif?: string;
      supplierCurrency?: 'DZD' | 'USD' | 'EUR';
      exchangeRateToDzd?: number;
      expectedDeliveryDate?: string;
      items: {
        partId: string;
        partNumber: string;
        quantityOrdered: number;
        unitPriceCurrency: number;
      }[];
    },
  ) {
    return this.poService.createPurchaseOrder(req.tenantId, dto);
  }

  @Post('purchase-orders/:id/receive')
  async receivePurchaseOrder(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
    @Body('warehouseId') warehouseId: string,
  ) {
    return this.poService.receivePurchaseOrder(req.tenantId, id, warehouseId);
  }
}

