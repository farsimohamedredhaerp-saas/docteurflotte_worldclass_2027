import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module';
import { TmdAdrController } from './tmd-adr.controller';
import { TmdDriversService } from './services/tmd-drivers.service';
import { TankerCompartmentsService } from './services/tanker-compartments.service';
import { TmdMissionsService } from './services/tmd-missions.service';

@Module({
  imports: [DatabaseModule],
  controllers: [TmdAdrController],
  providers: [TmdDriversService, TankerCompartmentsService, TmdMissionsService],
  exports: [TmdDriversService, TankerCompartmentsService, TmdMissionsService],
})
export class TmdAdrModule {}

