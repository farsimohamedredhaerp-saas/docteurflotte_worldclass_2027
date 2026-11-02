// Fichier : apps/api/src/copilot/copilot.module.ts
import { Module } from '@nestjs/common';
import { CopilotController } from './copilot.controller';
import { CopilotService } from './copilot.service';
import { OllamaSovereignService } from './ollama-sovereign.service';
import { SovereignToolOrchestratorService } from './sovereign-tool-orchestrator.service';
import { DatabaseModule } from '../database/database.module';
import { AuthModule } from '../auth/auth.module';
import { FleetIntelligenceModule } from '../fleet-intelligence/fleet-intelligence.module';

@Module({
  imports: [DatabaseModule, AuthModule, FleetIntelligenceModule],
  controllers: [CopilotController],
  providers: [CopilotService, OllamaSovereignService, SovereignToolOrchestratorService],
  exports: [CopilotService, OllamaSovereignService, SovereignToolOrchestratorService],
})
export class CopilotModule {}
