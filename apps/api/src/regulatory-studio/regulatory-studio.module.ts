import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { DatabaseModule } from '../database/database.module';
import { PlatformAdminGuard } from '../admin/guards/platform-admin.guard';
import { RegulatoryStudioController } from './regulatory-studio.controller';
import { RegulatoryStudioService } from './regulatory-studio.service';

@Module({
  imports: [AuthModule, DatabaseModule],
  controllers: [RegulatoryStudioController],
  providers: [RegulatoryStudioService, PlatformAdminGuard],
  exports: [RegulatoryStudioService],
})
export class RegulatoryStudioModule {}

