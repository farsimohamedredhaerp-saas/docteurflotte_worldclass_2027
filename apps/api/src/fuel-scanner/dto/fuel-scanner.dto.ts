import { IsString, IsNotEmpty, IsOptional, IsObject } from 'class-validator';
import { FuelReceiptScanRequestDto } from '@docteurflotte/contracts';

export class ScanFuelReceiptDto implements FuelReceiptScanRequestDto {
  @IsOptional()
  @IsString()
  receiptImageBase64?: string;

  @IsOptional()
  @IsString()
  receiptTextRaw?: string;

  @IsString()
  @IsNotEmpty()
  assetId!: string;

  @IsOptional()
  @IsString()
  driverId?: string;

  @IsOptional()
  @IsObject()
  manualOverrides?: {
    liters?: number;
    totalAmountDzd?: number;
    stationName?: string;
    fuelType?: string;
  };
}
