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

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env', '../../.env.local', '../../.env'],
    }),
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
  ],
})
export class AppModule {}
