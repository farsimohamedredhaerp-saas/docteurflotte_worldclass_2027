// Fichier : apps/api/src/fuel-scanner/fuel-scanner.module.ts
import { Module } from '@nestjs/common';
import { FuelScannerController } from './fuel-scanner.controller';
import { FuelScannerService } from './fuel-scanner.service';
import { WorkshopInvoiceReconcilerService } from './services/workshop-invoice-reconciler.service';
import { CopilotModule } from '../copilot/copilot.module';
import { DatabaseModule } from '../database/database.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [DatabaseModule, AuthModule, CopilotModule],
  controllers: [FuelScannerController],
  providers: [FuelScannerService, WorkshopInvoiceReconcilerService],
  exports: [FuelScannerService, WorkshopInvoiceReconcilerService],
})
export class FuelScannerModule {}
