import { IsBoolean, IsEnum, IsNotEmpty, IsString } from 'class-validator';
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
}
