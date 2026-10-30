import {
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';
import {
  MeterSource,
  MeterType,
  RecordMeterReadingDto as IRecordMeterReadingDto,
} from '@docteurflotte/contracts';

export class RecordMeterReadingDto implements IRecordMeterReadingDto {
  @IsEnum(MeterType)
  meterType: MeterType;

  @IsNumber()
  @Min(0)
  value: number;

  @IsEnum(MeterSource)
  @IsOptional()
  source?: MeterSource;

  @IsString()
  @IsOptional()
  recordedAt?: string;
}
