import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module';
import { AuthModule } from '../auth/auth.module';
import { FiscalComplianceModule } from '../fiscal-compliance/fiscal-compliance.module';
import { ChantiersEnginsController } from './chantiers-engins.controller';
import { SiteWorkspaceService } from './services/site-workspace.service';
import { AssetAssignmentService } from './services/asset-assignment.service';
import { EngineHoursService } from './services/engine-hours.service';
import { TransferChecklistService } from './services/transfer-checklist.service';
import { SiteProfitabilityService } from './services/site-profitability.service';

@Module({
  imports: [DatabaseModule, AuthModule, FiscalComplianceModule],
  controllers: [ChantiersEnginsController],
  providers: [
    SiteWorkspaceService,
    AssetAssignmentService,
    EngineHoursService,
    TransferChecklistService,
    SiteProfitabilityService,
  ],
  exports: [
    SiteWorkspaceService,
    AssetAssignmentService,
    EngineHoursService,
    TransferChecklistService,
    SiteProfitabilityService,
  ],
})
export class ChantiersEnginsModule {}

