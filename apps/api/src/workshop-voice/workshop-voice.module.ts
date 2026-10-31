// Fichier : apps/api/src/workshop-voice/workshop-voice.module.ts
import { Module } from '@nestjs/common';
import { WorkshopVoiceService } from './workshop-voice.service';
import { WorkshopVoiceController } from './workshop-voice.controller';
import { DatabaseModule } from '../database/database.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [DatabaseModule, AuthModule],
  controllers: [WorkshopVoiceController],
  providers: [WorkshopVoiceService],
  exports: [WorkshopVoiceService],
})
export class WorkshopVoiceModule {}
