import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module';
import { AuthModule } from '../auth/auth.module';
import { CostCenterService } from './services/cost-center.service';
import { TcoAggregationService } from './services/tco-aggregation.service';
import { RepairVsReplaceSimulatorService } from './services/repair-vs-replace-simulator.service';
import { CostTwinService } from './services/cost-twin.service';
import { TcoProfitabilityController } from './tco-profitability.controller';

@Module({
  imports: [DatabaseModule, AuthModule],
  controllers: [TcoProfitabilityController],
  providers: [
    CostCenterService,
    TcoAggregationService,
    RepairVsReplaceSimulatorService,
    CostTwinService,
  ],
  exports: [
    CostCenterService,
    TcoAggregationService,
    RepairVsReplaceSimulatorService,
    CostTwinService,
  ],
})
export class TcoProfitabilityModule {}

