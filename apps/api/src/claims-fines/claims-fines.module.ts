import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module';
import { AuthModule } from '../auth/auth.module';
import { AccidentClaimService } from './services/accident-claim.service';
import { TrafficFineService } from './services/traffic-fine.service';
import { InsuranceCaseService } from './services/insurance-case.service';
import { RiskScoreService } from './services/risk-score.service';
import { ClaimsFinesController } from './claims-fines.controller';

@Module({
  imports: [DatabaseModule, AuthModule],
  controllers: [ClaimsFinesController],
  providers: [
    AccidentClaimService,
    TrafficFineService,
    InsuranceCaseService,
    RiskScoreService,
  ],
  exports: [
    AccidentClaimService,
    TrafficFineService,
    InsuranceCaseService,
    RiskScoreService,
  ],
})
export class ClaimsFinesModule {}

