import { Module } from '@nestjs/common';
import { TenantsService } from './tenants.service';
import { TenantsController } from './tenants.controller';
import { AuthModule } from '../auth/auth.module';
import { RegulatoryStudioModule } from '../regulatory-studio/regulatory-studio.module';

@Module({
  imports: [AuthModule, RegulatoryStudioModule],
  controllers: [TenantsController],
  providers: [TenantsService],
  exports: [TenantsService],
})
export class TenantsModule {}
