import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtPayload } from '@docteurflotte/contracts';
import * as crypto from 'crypto';

@Injectable()
export class TokenService {
  private readonly secret: string;
  private readonly defaultExpirySeconds = 86400; // 24 heures

  constructor(private readonly configService: ConfigService) {
    const configuredSecret = this.configService.get<string>('JWT_SECRET');
    const isProd = this.configService.get<string>('NODE_ENV') === 'production';

    if (isProd && (!configuredSecret || configuredSecret.length < 32)) {
      throw new Error(
        'FATAL SECURITY: JWT_SECRET (minimum 32 caractères) est obligatoire en environnement de production.',
      );
    }

    this.secret =
      configuredSecret ||
      'docteurflotte_dev_jwt_secret_must_be_set_in_production_environment_32chars';
  }

  /**
   * Génère un jeton JWT HMAC-SHA256 signé de façon standard.
   */
  sign(payload: Omit<JwtPayload, 'iat' | 'exp'>, expiresInSeconds = this.defaultExpirySeconds): string {
    const header = { alg: 'HS256', typ: 'JWT' };
    const now = Math.floor(Date.now() / 1000);
    const fullPayload: JwtPayload = {
      ...payload,
      iat: now,
      exp: now + expiresInSeconds,
    };

    const headerB64 = Buffer.from(JSON.stringify(header)).toString('base64url');
    const payloadB64 = Buffer.from(JSON.stringify(fullPayload)).toString('base64url');
    const signature = crypto
      .createHmac('sha256', this.secret)
      .update(`${headerB64}.${payloadB64}`)
      .digest('base64url');

    return `${headerB64}.${payloadB64}.${signature}`;
  }

  /**
   * Vérifie et décode un jeton JWT de manière sécurisée en temps constant (avec validation stricte de l'en-tête alg=HS256).
   */
  verify(token: string): JwtPayload {
    if (!token || typeof token !== 'string') {
      throw new UnauthorizedException('Jeton absent ou malformé.');
    }

    const parts = token.split('.');
    if (parts.length !== 3) {
      throw new UnauthorizedException('Format de jeton invalide.');
    }

    const [headerB64, payloadB64, signature] = parts;

    let header: { alg?: string; typ?: string };
    try {
      header = JSON.parse(Buffer.from(headerB64, 'base64url').toString('utf8'));
    } catch {
      throw new UnauthorizedException('En-tête de jeton illisible.');
    }

    if (!header || header.alg !== 'HS256') {
      throw new UnauthorizedException('Algorithme de signature JWT non autorisé.');
    }

    const expectedSignature = crypto
      .createHmac('sha256', this.secret)
      .update(`${headerB64}.${payloadB64}`)
      .digest('base64url');

    const sigBuf = Buffer.from(signature);
    const expSigBuf = Buffer.from(expectedSignature);

    if (sigBuf.length !== expSigBuf.length || !crypto.timingSafeEqual(sigBuf, expSigBuf)) {
      throw new UnauthorizedException('Signature de jeton invalide.');
    }

    let payload: JwtPayload;
    try {
      payload = JSON.parse(Buffer.from(payloadB64, 'base64url').toString('utf8'));
    } catch {
      throw new UnauthorizedException('Données de jeton illisibles.');
    }

    const now = Math.floor(Date.now() / 1000);
    if (payload.exp && payload.exp < now) {
      throw new UnauthorizedException('Session expirée. Veuillez vous reconnecter.');
    }

    return payload;
  }
}
