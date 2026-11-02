import { IsString, IsNotEmpty, IsOptional, IsObject, IsBoolean, IsNumber } from 'class-validator';
import { CopilotQueryDto, OllamaPlaygroundRequestDto } from '@docteurflotte/contracts';

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

export class RejectCopilotActionDto {
  @IsString()
  @IsNotEmpty()
  actionId!: string;

  @IsString()
  @IsNotEmpty()
  reason!: string;
}

export class TestInferenceDto implements OllamaPlaygroundRequestDto {
  @IsString()
  @IsNotEmpty()
  prompt!: string;

  @IsOptional()
  @IsString()
  systemPrompt?: string;

  @IsOptional()
  @IsBoolean()
  jsonFormat?: boolean;

  @IsOptional()
  @IsNumber()
  temperature?: number;

  @IsOptional()
  @IsNumber()
  maxTokens?: number;

  @IsOptional()
  @IsString()
  callerModule?: 'COPILOT_QUERY' | 'FUEL_SCANNER' | 'PLAYGROUND' | 'DTC_INTERPRETER' | 'OEM_RESOLVER';
}
