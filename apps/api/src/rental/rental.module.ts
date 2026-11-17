import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module';
import { AuthModule } from '../auth/auth.module';
import { FiscalComplianceModule } from '../fiscal-compliance/fiscal-compliance.module';
import { RentalController } from './rental.controller';
import { RentalContractService } from './services/rental-contract.service';
import { RentalCheckInOutService } from './services/rental-check-in-out.service';
import { RentalInvoiceService } from './services/rental-invoice.service';
import { RentalDisputeService } from './services/rental-dispute.service';

@Module({
  imports: [DatabaseModule, AuthModule, FiscalComplianceModule],
  controllers: [RentalController],
  providers: [
    RentalContractService,
    RentalCheckInOutService,
    RentalInvoiceService,
    RentalDisputeService,
  ],
  exports: [
    RentalContractService,
    RentalCheckInOutService,
    RentalInvoiceService,
    RentalDisputeService,
  ],
})
export class RentalModule {}

