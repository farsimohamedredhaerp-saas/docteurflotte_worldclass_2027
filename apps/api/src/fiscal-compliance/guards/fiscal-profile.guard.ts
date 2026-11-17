import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { FiscalProfileService } from '../services/fiscal-profile.service';

/**
 * Guard qui vérifie que le profil fiscal du tenant est configuré avant d'autoriser
 * les mutations fiscales (création de documents, recalculs, scellements).
 * Si non configuré, le module bascule en lecture seule.
 */
@Injectable()
export class FiscalProfileConfiguredGuard implements CanActivate {
  constructor(private readonly profileService: FiscalProfileService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const tenantId = request.tenantId || request.user?.tenantId;

    if (!tenantId) {
      throw new ForbiddenException('Contexte tenant absent.');
    }

    // Autoriser toutes les requêtes en lecture (GET)
    if (request.method === 'GET') {
      return true;
    }

    // Pour les mutations (POST, PUT, PATCH, DELETE) : vérification de configuration
    const isConfigured = await this.profileService.isConfigured(tenantId);
    if (!isConfigured) {
      throw new ForbiddenException(
        'Module Fiscal en Mode Lecture Seule : Veuillez d\'abord renseigner le NIF et configurer le profil fiscal de votre organisation dans les paramètres.',
      );
    }

    return true;
  }
}

