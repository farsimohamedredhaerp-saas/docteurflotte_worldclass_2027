import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module';
import { AuthModule } from '../auth/auth.module';
import { AdminController } from './admin.controller';
import { ReferenceConfigController } from './controllers/reference-config.controller';
import { AdminTenantsService } from './services/admin-tenants.service';
import { AdminDecisionEngineService } from './services/admin-decision-engine.service';
import { AdminFiscalService } from './services/admin-fiscal.service';
import { AdminGatewaysService } from './services/admin-gateways.service';
import { AdminAuditService } from './services/admin-audit.service';
import { PlatformAdminGuard } from './guards/platform-admin.guard';

@Module({
  imports: [DatabaseModule, AuthModule],
  controllers: [AdminController, ReferenceConfigController],
  providers: [
    AdminTenantsService,
    AdminDecisionEngineService,
    AdminFiscalService,
    AdminGatewaysService,
    AdminAuditService,
    PlatformAdminGuard,
  ],
  exports: [
    AdminTenantsService,
    AdminDecisionEngineService,
    AdminFiscalService,
    AdminGatewaysService,
    AdminAuditService,
  ],
})
export class AdminModule {}
