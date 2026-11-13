// Fichier : apps/api/src/workshop-voice/workshop-voice.module.ts
import { Module } from '@nestjs/common';
import { WorkshopVoiceService } from './workshop-voice.service';
import { WorkshopVoiceController } from './workshop-voice.controller';
import { DatabaseModule } from '../database/database.module';
import { AuthModule } from '../auth/auth.module';
import { SovereignRagModule } from '../sovereign-rag/sovereign-rag.module';
import { DarjaIntentRouterService } from './darja-intent-router.service';

@Module({
  imports: [DatabaseModule, AuthModule, SovereignRagModule],
  controllers: [WorkshopVoiceController],
  providers: [WorkshopVoiceService, DarjaIntentRouterService],
  exports: [WorkshopVoiceService, DarjaIntentRouterService],
})
export class WorkshopVoiceModule {}
