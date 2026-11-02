import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import type { Request, Response, NextFunction } from 'express';
import * as crypto from 'crypto';
import { AppModule } from './app.module';

// Registre de Rate Limiting anti-brute force en mémoire (IP -> { count, resetTime })
const authRateLimitMap = new Map<string, { count: number; resetTime: number }>();

function cleanupRateLimitMap() {
  const now = Date.now();
  for (const [key, record] of authRateLimitMap.entries()) {
    if (record.resetTime < now) {
      authRateLimitMap.delete(key);
    }
  }
}

// Nettoyage régulier toutes les 5 minutes
setInterval(cleanupRateLimitMap, 5 * 60 * 1000).unref();

function parseAllowedOrigins(): (string | RegExp)[] {
  const raw = process.env.CORS_ORIGINS || process.env.ALLOWED_ORIGINS || '';
  const configured = raw
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean);

  const defaults = [
    'http://localhost:3000',
    'http://127.0.0.1:3000',
    'http://localhost:3001',
  ];

  if (process.env.DOMAIN_WEB) {
    defaults.push(`https://${process.env.DOMAIN_WEB}`);
  }

  return Array.from(new Set([...configured, ...defaults]));
}

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create(AppModule);

  const isProd = process.env.NODE_ENV === 'production';
  const allowedOrigins = parseAllowedOrigins();

  app.enableCors({
    origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
      if (!origin) {
        return callback(null, true);
      }
      if (!isProd || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(new Error(`Origin ${origin} non autorisée par la politique CORS.`), false);
    },
    credentials: true,
    methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'X-Requested-With',
      'X-Tenant-Id',
      'X-Flespi-Token',
      'X-Traccar-Signature',
      'Accept-Language',
    ],
  });

  // Traçabilité et corrélation de bout en bout (X-Request-Id)
  app.use((req: Request, res: Response, next: NextFunction) => {
    const incomingId = req.headers['x-request-id'];
    const requestId = typeof incomingId === 'string' && incomingId ? incomingId : crypto.randomUUID();
    req.headers['x-request-id'] = requestId;
    res.setHeader('X-Request-Id', requestId);
    next();
  });

  // Protection Anti-Brute Force ciblée sur les routes d'authentification
  app.use((req: Request, res: Response, next: NextFunction) => {
    if (req.method === 'POST' && (req.path.endsWith('/auth/login') || req.path.endsWith('/auth/register-tenant'))) {
      const clientIp = req.ip || req.socket.remoteAddress || 'unknown';
      const key = `${clientIp}:${req.path}`;
      const now = Date.now();
      const limitWindowMs = 60 * 1000; // 1 minute
      const maxAttempts = req.path.endsWith('/auth/login') ? 15 : 6;

      const record = authRateLimitMap.get(key) || { count: 0, resetTime: now + limitWindowMs };

      if (record.resetTime < now) {
        record.count = 0;
        record.resetTime = now + limitWindowMs;
      }

      record.count += 1;
      authRateLimitMap.set(key, record);

      res.setHeader('X-RateLimit-Limit', maxAttempts.toString());
      res.setHeader('X-RateLimit-Remaining', Math.max(0, maxAttempts - record.count).toString());
      res.setHeader('X-RateLimit-Reset', Math.ceil(record.resetTime / 1000).toString());

      if (record.count > maxAttempts) {
        const retryAfterSeconds = Math.ceil((record.resetTime - now) / 1000);
        res.setHeader('Retry-After', retryAfterSeconds.toString());
        res.status(429).json({
          statusCode: 429,
          message: 'Trop de tentatives sur cette ressource. Veuillez patienter avant de réessayer.',
          error: 'Too Many Requests',
          retryAfterSeconds,
        });
        return;
      }
    }
    next();
  });

  // En-têtes de sécurité HTTP (OWASP Best Practices)
  app.use((_req: Request, res: Response, next: NextFunction) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    res.setHeader('Content-Security-Policy', "default-src 'none'; frame-ancestors 'none';");
    res.setHeader('X-XSS-Protection', '0');
    res.setHeader('Permissions-Policy', 'geolocation=(self), camera=(self), microphone=()');
    if (isProd) {
      res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
    }
    next();
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  app.enableShutdownHooks();

  const port = process.env.PORT || 3001;
  await app.listen(port);
  logger.log(`DocteurFlotte API running on http://localhost:${port}`);
}

bootstrap();
