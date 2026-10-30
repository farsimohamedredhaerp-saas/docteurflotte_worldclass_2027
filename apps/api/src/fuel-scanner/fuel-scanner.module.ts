import { Module } from '@nestjs/common';
import { FuelScannerController } from './fuel-scanner.controller';
import { FuelScannerService } from './fuel-scanner.service';
import { DatabaseModule } from '../database/database.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [DatabaseModule, AuthModule],
  controllers: [FuelScannerController],
  providers: [FuelScannerService],
  exports: [FuelScannerService],
})
export class FuelScannerModule {}
