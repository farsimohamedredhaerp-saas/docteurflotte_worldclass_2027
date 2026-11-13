import { Injectable, NestMiddleware, Logger } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import * as crypto from 'crypto';

@Injectable()
export class Law1807SanitizerMiddleware implements NestMiddleware {
  private readonly logger = new Logger('Loi1807Sanitizer');

  use(req: Request, res: Response, next: NextFunction): void {
    // Interception des en-têtes et requêtes pour garantir le respect de la Loi 18-07 ANPDP
    // Empêche toute fuite de PII en logs ou vers des services tiers
    if (req.body && typeof req.body === 'object') {
      req.body = Law1807SanitizerMiddleware.sanitizeData(req.body);
    }
    next();
  }

  /**
   * Masque et pseudonymise de façon déterministe les données à caractère personnel (PII)
   */
  static sanitizeData<T>(input: T): T {
    if (!input || typeof input !== 'object') {
      return input;
    }

    if (Array.isArray(input)) {
      return input.map((item) => this.sanitizeData(item)) as unknown as T;
    }

    const sanitized: Record<string, any> = { ...(input as Record<string, any>) };

    for (const key of Object.keys(sanitized)) {
      const val = sanitized[key];
      const lowerKey = key.toLowerCase();

      if (typeof val === 'string') {
        // 1. Chauffeur / Nom de personne
        if (lowerKey.includes('drivername') || lowerKey.includes('chauffeur') || lowerKey.includes('technicianname')) {
          sanitized[key] = this.pseudonymizeName(val);
        }
        // 2. Numéro de téléphone algérien (05/06/07...)
        else if (lowerKey.includes('phone') || lowerKey.includes('tel') || lowerKey.includes('mobile')) {
          sanitized[key] = this.maskPhone(val);
        }
        // 3. Numéro d Identification Nationale (NIN)
        else if (lowerKey.includes('nin') || lowerKey.includes('nationalid')) {
          sanitized[key] = this.maskNin(val);
        }
        // 4. Numéro de carte bancaire / CIB / Edahabia / Naftal
        else if (lowerKey.includes('cardnumber') || lowerKey.includes('cib') || lowerKey.includes('edahabia')) {
          sanitized[key] = this.maskCard(val);
        }
      } else if (typeof val === 'object' && val !== null) {
        sanitized[key] = this.sanitizeData(val);
      }
    }

    return sanitized as T;
  }

  static pseudonymizeName(name: string): string {
    if (!name || name.trim().length <= 2) return 'OPÉRATEUR-ANONYME';
    const hash = crypto.createHash('sha256').update(name).digest('hex').substring(0, 4).toUpperCase();
    const initials = name.split(/\s+/).map((p) => p[0]?.toUpperCase()).filter(Boolean).join('');
    return `CHAUFFEUR-${initials}-${hash}`;
  }

  static maskPhone(phone: string): string {
    const digits = phone.replace(/\D/g, '');
    if (digits.length < 8) return '+213 ** ** **';
    const last2 = digits.slice(-2);
    return `+213 5** ** ${last2}`;
  }

  static maskNin(nin: string): string {
    if (!nin || nin.length < 6) return 'NIN-ANONYME';
    return `NIN-***-${nin.slice(-4)}`;
  }

  static maskCard(card: string): string {
    const clean = card.replace(/\s+/g, '');
    if (clean.length < 8) return '****-****';
    return `${clean.substring(0, 4)}-****-****-${clean.slice(-4)}`;
  }
}

