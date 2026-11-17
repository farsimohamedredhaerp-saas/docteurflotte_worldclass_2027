import { Module } from '@nestjs/common';
import { FarmPropertiesService } from './services/farm-properties.service';
import { IrrigationPivotsService } from './services/irrigation-pivots.service';
import { HarvestCampaignsService } from './services/harvest-campaigns.service';
import { SaharanAgricultureController } from './saharan-agriculture.controller';

@Module({
  controllers: [SaharanAgricultureController],
  providers: [FarmPropertiesService, IrrigationPivotsService, HarvestCampaignsService],
  exports: [FarmPropertiesService, IrrigationPivotsService, HarvestCampaignsService],
})
export class SaharanAgricultureModule {}

