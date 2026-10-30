import { IsString, IsNotEmpty, IsOptional, IsObject } from 'class-validator';
import { CopilotQueryDto } from '@docteurflotte/contracts';

export class AskCopilotDto implements CopilotQueryDto {
  @IsString()
  @IsNotEmpty()
  prompt!: string;

  @IsOptional()
  @IsObject()
  contextFilter?: {
    assetId?: string;
    category?: string;
    wilaya?: string;
  };

  @IsOptional()
  @IsString()
  locale?: string;
}

export class ExecuteCopilotActionDto {
  @IsString()
  @IsNotEmpty()
  actionId!: string;

  @IsOptional()
  @IsString()
  justification?: string;
}
