import {
  IsArray,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';
import {
  ParameterUnit,
  RegulatoryParameterType,
  TrancheDefinition,
} from '@docteurflotte/decision-engine';

export class CloneRegPackDto {
  @IsString()
  @IsNotEmpty()
  sourcePackId!: string;

  @IsString()
  @IsNotEmpty()
  newPackId!: string;

  @IsString()
  @IsNotEmpty()
  newVersion!: string;

  @IsString()
  @IsNotEmpty()
  descriptionFr!: string;
}

export class UpdateRegulatoryParameterDto {
  @IsString()
  @IsNotEmpty()
  value!: string;

  @IsString()
  @IsNotEmpty()
  type!: RegulatoryParameterType;

  @IsString()
  @IsNotEmpty()
  legalReference!: string;

  @IsString()
  @IsOptional()
  joradpCitation?: string;

  @IsString()
  @IsNotEmpty()
  applicableFrom!: string;

  @IsString()
  @IsOptional()
  applicableTo?: string | null;

  @IsString()
  @IsOptional()
  labelFr?: string;

  @IsString()
  @IsOptional()
  parameterGroup?: string;

  @IsString()
  @IsOptional()
  unit?: ParameterUnit;

  @IsArray()
  @IsOptional()
  tranches?: TrancheDefinition[];

  @IsArray()
  @IsOptional()
  sectorCodes?: string[];
}

export type SimulationCaseType =
  | 'ARTISAN_IFU_5M'
  | 'SARL_BTPH_50M'
  | 'TRANSPORTEUR_GRAND_SUD'
  | 'STARTUP_INNOVATION';

export class SimulateRegPackDto {
  @IsString()
  @IsNotEmpty()
  caseType!: SimulationCaseType;

  @IsOptional()
  testInputs?: Record<string, unknown>;
}

export class PublishRegPackDto {
  @IsString()
  @IsNotEmpty()
  publishedByEmail!: string;

  @IsString()
  @IsNotEmpty()
  validatedByExpert!: string;

  @IsString()
  @IsOptional()
  privateKeyPem?: string;

  @IsString()
  @IsOptional()
  approverEmail?: string;
}
