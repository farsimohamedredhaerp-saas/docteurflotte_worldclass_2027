import { IsEmail, IsEnum, IsNotEmpty, IsOptional, IsString, MinLength } from 'class-validator';
import { ActivityPack, RegisterTenantDto as IRegisterTenantDto } from '@docteurflotte/contracts';

export class RegisterTenantDto implements IRegisterTenantDto {
  @IsString()
  @IsNotEmpty({ message: 'Le nom de l’entreprise est requis.' })
  companyName!: string;

  @IsEmail({}, { message: 'Format d’adresse email invalide.' })
  @IsNotEmpty({ message: 'L’email administrateur est requis.' })
  adminEmail!: string;

  @IsString()
  @MinLength(8, { message: 'Le mot de passe doit comporter au moins 8 caractères.' })
  adminPassword!: string;

  @IsString()
  @IsNotEmpty({ message: 'Le prénom est requis.' })
  adminFirstName!: string;

  @IsString()
  @IsNotEmpty({ message: 'Le nom de famille est requis.' })
  adminLastName!: string;

  @IsEnum(ActivityPack, { message: 'Pack d’activité non reconnu.' })
  activityPack!: ActivityPack;

  @IsString()
  @IsOptional()
  countryCode?: string;

  @IsString()
  @IsOptional()
  currency?: string;
}
