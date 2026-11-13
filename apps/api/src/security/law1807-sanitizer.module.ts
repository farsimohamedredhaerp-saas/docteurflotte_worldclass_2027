import { Module } from '@nestjs/common';
import { Law1807SanitizerMiddleware } from './law1807-sanitizer.middleware';

@Module({
  providers: [Law1807SanitizerMiddleware],
  exports: [Law1807SanitizerMiddleware],
})
export class Law1807SanitizerModule {}

