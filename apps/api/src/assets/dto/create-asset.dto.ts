import {
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';
import {
  AssetCategory,
  CreateAssetDto as ICreateAssetDto,
  MeterType,
} from '@docteurflotte/contracts';

export class CreateAssetDto implements ICreateAssetDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  code: string;

  @IsEnum(AssetCategory)
  category: AssetCategory;

  @IsString()
  @IsOptional()
  brand?: string;

  @IsString()
  @IsOptional()
  model?: string;

  @IsNumber()
  @IsOptional()
  year?: number;

  @IsEnum(MeterType)
  primaryMeterType: MeterType;

  @IsNumber()
  @Min(0)
  initialMeterValue: number;

  @IsNumber()
  @Min(1)
  @IsOptional()
  maintenanceIntervalValue?: number;
}
