import { Module, Global } from '@nestjs/common';
import { EngineRulesConfigService } from './engine-rules.service';
import { EngineRulesConfigController } from './engine-rules.controller';
import { DatabaseModule } from '../database/database.module';
import { AuthModule } from '../auth/auth.module';

@Global()
@Module({
  imports: [DatabaseModule, AuthModule],
  controllers: [EngineRulesConfigController],
  providers: [EngineRulesConfigService],
  exports: [EngineRulesConfigService],
})
export class EngineRulesModule {}
