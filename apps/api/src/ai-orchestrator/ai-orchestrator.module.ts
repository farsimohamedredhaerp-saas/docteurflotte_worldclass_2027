import { Module } from '@nestjs/common';
import { AiOrchestratorController } from './ai-orchestrator.controller';
import { DeterministicFleetToolsService } from './services/deterministic-fleet-tools.service';
import { DraftActionManagerService } from './services/draft-action-manager.service';
import { QwenOrchestratorService } from './services/qwen-orchestrator.service';

@Module({
  controllers: [AiOrchestratorController],
  providers: [
    DeterministicFleetToolsService,
    DraftActionManagerService,
    QwenOrchestratorService,
  ],
  exports: [
    DeterministicFleetToolsService,
    DraftActionManagerService,
    QwenOrchestratorService,
  ],
})
export class AiOrchestratorModule {}

