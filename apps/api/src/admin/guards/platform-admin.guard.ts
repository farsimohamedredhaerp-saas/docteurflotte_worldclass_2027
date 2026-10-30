import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { UserRole } from '@docteurflotte/contracts';

@Injectable()
export class PlatformAdminGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user || user.role !== UserRole.PLATFORM_ADMIN) {
      throw new ForbiddenException(
        'Accès strictement réservé au SuperAdmin de la plateforme (PLATFORM_ADMIN).'
      );
    }

    return true;
  }
}
