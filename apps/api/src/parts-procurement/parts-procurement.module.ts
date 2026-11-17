import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module';
import { AuthModule } from '../auth/auth.module';
import { PartsInventoryService } from './services/parts-inventory.service';
import { PartsWarehouseService } from './services/parts-warehouse.service';
import { WorkOrderPartsService } from './services/work-order-parts.service';
import { PartsPurchaseOrderService } from './services/parts-purchase-order.service';
import { PartsProcurementController } from './parts-procurement.controller';

@Module({
  imports: [DatabaseModule, AuthModule],
  controllers: [PartsProcurementController],
  providers: [
    PartsInventoryService,
    PartsWarehouseService,
    WorkOrderPartsService,
    PartsPurchaseOrderService,
  ],
  exports: [
    PartsInventoryService,
    PartsWarehouseService,
    WorkOrderPartsService,
    PartsPurchaseOrderService,
  ],
})
export class PartsProcurementModule {}

