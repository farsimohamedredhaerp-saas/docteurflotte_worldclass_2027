import {
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Min,
} from 'class-validator';
import {
  CreateWorkOrderDto as ICreateWorkOrderDto,
  WorkOrderPriority,
} from '@docteurflotte/contracts';

export class CreateWorkOrderDto implements ICreateWorkOrderDto {
  @IsUUID()
  @IsNotEmpty()
  assetId: string;

  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsEnum(WorkOrderPriority)
  @IsOptional()
  priority?: WorkOrderPriority;

  @IsNumber()
  @Min(0)
  @IsOptional()
  estimatedLaborHours?: number;

  @IsString()
  @IsOptional()
  assignedTo?: string;
}
