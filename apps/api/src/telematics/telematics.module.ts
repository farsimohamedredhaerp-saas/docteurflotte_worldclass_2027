import { Module } from '@nestjs/common';
import { TelematicsService } from './telematics.service';
import { TelematicsController } from './telematics.controller';
import { TraccarAdapterService } from './traccar-adapter.service';
import { DatabaseModule } from '../database/database.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [DatabaseModule, AuthModule],
  controllers: [TelematicsController],
  providers: [TelematicsService, TraccarAdapterService],
  exports: [TelematicsService, TraccarAdapterService],
})
export class TelematicsModule {}
