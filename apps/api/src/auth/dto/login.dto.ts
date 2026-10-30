import { IsEmail, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { LoginDto as ILoginDto } from '@docteurflotte/contracts';

export class LoginDto implements ILoginDto {
  @IsEmail({}, { message: 'Format d’adresse email invalide.' })
  @IsNotEmpty({ message: 'L’email est requis.' })
  email!: string;

  @IsString()
  @IsNotEmpty({ message: 'Le mot de passe est requis.' })
  password!: string;

  @IsString()
  @IsOptional()
  tenantSlug?: string;
}
