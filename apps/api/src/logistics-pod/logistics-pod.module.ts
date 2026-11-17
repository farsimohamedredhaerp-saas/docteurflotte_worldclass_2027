import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module';
import { AuthModule } from '../auth/auth.module';
import { LogisticsPodController } from './logistics-pod.controller';
import { ConsignmentNoteService } from './services/consignment-note.service';
import { ProofOfDeliveryService } from './services/proof-of-delivery.service';
import { DeliveryDisputeService } from './services/delivery-dispute.service';
import { OtifMetricsService } from './services/otif-metrics.service';

@Module({
  imports: [DatabaseModule, AuthModule],
  controllers: [LogisticsPodController],
  providers: [
    ConsignmentNoteService,
    ProofOfDeliveryService,
    DeliveryDisputeService,
    OtifMetricsService,
  ],
  exports: [
    ConsignmentNoteService,
    ProofOfDeliveryService,
    DeliveryDisputeService,
    OtifMetricsService,
  ],
})
export class LogisticsPodModule {}

