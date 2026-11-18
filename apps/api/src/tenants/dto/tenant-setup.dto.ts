import { IsBoolean, IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { ActivityPack, TenantSetupDto as ITenantSetupDto } from '@docteurflotte/contracts';

export class TenantSetupDto implements ITenantSetupDto {
  @IsEnum(ActivityPack, { message: 'Pack d’activité non reconnu.' })
  @IsNotEmpty()
  activityPack!: ActivityPack;

  @IsString()
  @IsNotEmpty()
  measurementSystem!: 'METRIC' | 'IMPERIAL';

  @IsString()
  @IsNotEmpty()
  currency!: string;

  @IsBoolean()
  enableDemoData!: boolean;

  @IsOptional()
  @IsString()
  legalPersonalityType?: 'PERSONNE_PHYSIQUE' | 'PERSONNE_MORALE';

  @IsOptional()
  @IsString()
  taxRegime?: string;

  @IsOptional()
  @IsString()
  legalForm?: string;
}
