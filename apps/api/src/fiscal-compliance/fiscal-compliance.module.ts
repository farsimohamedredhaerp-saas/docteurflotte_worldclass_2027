import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module';
import { AuthModule } from '../auth/auth.module';
import { FiscalComplianceController } from './fiscal-compliance.controller';
import { FiscalProfileService } from './services/fiscal-profile.service';
import { FiscalDocumentService } from './services/fiscal-document.service';
import { FiscalEventService } from './services/fiscal-event.service';
import { DeclarationDraftService } from './services/declaration-draft.service';
import { FiscalAuditService } from './services/fiscal-audit.service';
import { OperationalFiscalBridgeService } from './services/operational-fiscal-bridge.service';
import { FiscalProfileConfiguredGuard } from './guards/fiscal-profile.guard';

@Module({
  imports: [DatabaseModule, AuthModule],
  controllers: [FiscalComplianceController],
  providers: [
    FiscalProfileService,
    FiscalDocumentService,
    FiscalEventService,
    DeclarationDraftService,
    FiscalAuditService,
    OperationalFiscalBridgeService,
    FiscalProfileConfiguredGuard,
  ],
  exports: [
    FiscalProfileService,
    FiscalDocumentService,
    FiscalEventService,
    DeclarationDraftService,
    FiscalAuditService,
    OperationalFiscalBridgeService,
  ],
})
export class FiscalComplianceModule {}

