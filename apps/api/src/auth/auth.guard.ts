import { Request } from 'express';
import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { TokenService } from './token.service';
import { JwtPayload } from '@docteurflotte/contracts';

export interface AuthenticatedUserPayload extends Partial<JwtPayload> {
  email?: string;
  sub?: string;
  tenantId?: string;
  role?: JwtPayload['role'];
}

export interface AuthenticatedRequest extends Partial<Request> {
  user?: AuthenticatedUserPayload;
  tenantId: string;
}

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private readonly tokenService: TokenService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers['authorization'] || request.headers['Authorization'];

    if (!authHeader || typeof authHeader !== 'string') {
      throw new UnauthorizedException('En-tête Authorization manquant.');
    }

    const [bearer, token] = authHeader.split(' ');
    if (bearer !== 'Bearer' || !token) {
      throw new UnauthorizedException('Format Bearer token attendu.');
    }

    const payload = this.tokenService.verify(token);
    request.user = payload;
    request.tenantId = payload.tenantId;

    return true;
  }
}
