import {
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';
import {
  CompleteWorkOrderDto as ICompleteWorkOrderDto,
  ClosedLoopAlgorithmKey,
} from '@docteurflotte/contracts';

export class CompleteWorkOrderDto implements ICompleteWorkOrderDto {
  @IsNumber()
  @Min(0)
  actualLaborHours: number;

  @IsNumber()
  @Min(0)
  @IsOptional()
  partsCost?: number;

  @IsNumber()
  @Min(0)
  @IsOptional()
  downtimeHours?: number;

  @IsString()
  @IsOptional()
  completionNotes?: string;

  @IsString()
  @IsOptional()
  resetAlgorithmKey?: ClosedLoopAlgorithmKey;

  @IsString()
  @IsOptional()
  oemPartReference?: string;

  @IsNumber()
  @Min(0)
  @IsOptional()
  recalculatedVhi?: number;
}
