import { Module } from '@nestjs/common';
import { DecisionsService } from './decisions.service';
import { DecisionsController } from './decisions.controller';
import { ProactiveAnomalyDaemonService } from './services/proactive-anomaly-daemon.service';
import { ActuarialArbitrageService } from './services/actuarial-arbitrage.service';
import { DatabaseModule } from '../database/database.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [DatabaseModule, AuthModule],
  controllers: [DecisionsController],
  providers: [DecisionsService, ProactiveAnomalyDaemonService, ActuarialArbitrageService],
  exports: [DecisionsService, ProactiveAnomalyDaemonService, ActuarialArbitrageService],
})
export class DecisionsModule {}
