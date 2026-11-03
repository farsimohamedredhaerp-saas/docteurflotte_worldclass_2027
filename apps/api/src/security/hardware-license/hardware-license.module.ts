import { Module } from '@nestjs/common';
import { LicenseVerifierService } from './license-verifier.service';

@Module({
  providers: [LicenseVerifierService],
  exports: [LicenseVerifierService],
})
export class HardwareLicenseModule {}

