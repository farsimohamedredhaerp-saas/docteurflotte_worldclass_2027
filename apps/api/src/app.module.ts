import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { HealthModule } from './health/health.module';
import { DatabaseModule } from './database/database.module';
import { AuthModule } from './auth/auth.module';
import { TenantsModule } from './tenants/tenants.module';
import { AssetsModule } from './assets/assets.module';
import { WorkOrdersModule } from './work-orders/work-orders.module';
import { TelematicsModule } from './telematics/telematics.module';
import { DecisionsModule } from './decisions/decisions.module';
import { FleetIntelligenceModule } from './fleet-intelligence/fleet-intelligence.module';
import { AdminModule } from './admin/admin.module';
import { CopilotModule } from './copilot/copilot.module';
import { FuelScannerModule } from './fuel-scanner/fuel-scanner.module';
import { DigitalTwinModule } from './digital-twin/digital-twin.module';
import { AiOrchestratorModule } from './ai-orchestrator/ai-orchestrator.module';
import { SovereignRagModule } from './sovereign-rag/sovereign-rag.module';
import { WorkshopVoiceModule } from './workshop-voice/workshop-voice.module';
import { SubscriptionsModule } from './subscriptions/subscriptions.module';
import { HardwareLicenseModule } from './security/hardware-license/hardware-license.module';
import { FiscalComplianceModule } from './fiscal-compliance/fiscal-compliance.module';
import { ChantiersEnginsModule } from './chantiers-engins/chantiers-engins.module';
import { RentalModule } from './rental/rental.module';
import { LogisticsPodModule } from './logistics-pod/logistics-pod.module';
import { ClaimsFinesModule } from './claims-fines/claims-fines.module';
import { PartsProcurementModule } from './parts-procurement/parts-procurement.module';
import { TcoProfitabilityModule } from './tco-profitability/tco-profitability.module';
import { EngineRulesModule } from './engine-rules/engine-rules.module';
import { SaharanAgricultureModule } from './saharan-agriculture/saharan-agriculture.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env', '../../.env.local', '../../.env'],
    }),
    HardwareLicenseModule,
    EngineRulesModule,
    DatabaseModule,
    HealthModule,
    AuthModule,
    TenantsModule,
    AssetsModule,
    WorkOrdersModule,
    TelematicsModule,
    DecisionsModule,
    FleetIntelligenceModule,
    AdminModule,
    CopilotModule,
    FuelScannerModule,
    DigitalTwinModule,
    AiOrchestratorModule,
    SovereignRagModule,
    WorkshopVoiceModule,
    SubscriptionsModule,
    FiscalComplianceModule,
    ChantiersEnginsModule,
    RentalModule,
    LogisticsPodModule,
    ClaimsFinesModule,
    PartsProcurementModule,
    TcoProfitabilityModule,
    SaharanAgricultureModule,
  ],
})
export class AppModule {}
