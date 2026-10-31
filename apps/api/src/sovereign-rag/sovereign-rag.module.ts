// Fichier : apps/api/src/sovereign-rag/sovereign-rag.module.ts
import { Module } from '@nestjs/common';
import { SovereignRagService } from './sovereign-rag.service';
import { SovereignRagController } from './sovereign-rag.controller';
import { DatabaseModule } from '../database/database.module';
import { AuthModule } from '../auth/auth.module';
import { CopilotModule } from '../copilot/copilot.module';

@Module({
  imports: [DatabaseModule, AuthModule, CopilotModule],
  controllers: [SovereignRagController],
  providers: [SovereignRagService],
  exports: [SovereignRagService],
})
export class SovereignRagModule {}
