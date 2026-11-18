import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module';
import { MiningQuarriesController } from './mining-quarries.controller';
import { MiningSitesService } from './services/mining-sites.service';
import { OtrTiresService } from './services/otr-tires.service';
import { DumperHaulingService } from './services/dumper-hauling.service';

@Module({
  imports: [DatabaseModule],
  controllers: [MiningQuarriesController],
  providers: [MiningSitesService, OtrTiresService, DumperHaulingService],
  exports: [MiningSitesService, OtrTiresService, DumperHaulingService],
})
export class MiningQuarriesModule {}

