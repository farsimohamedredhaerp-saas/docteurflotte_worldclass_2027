import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HealthResponse, ReadinessResponse, DependencyCheckResult } from '@docteurflotte/contracts';
import { Pool } from 'pg';
import Redis from 'ioredis';

@Injectable()
export class HealthService {
  private readonly logger = new Logger(HealthService.name);
  private readonly startTime = Date.now();

  constructor(private readonly configService: ConfigService) {}

  getHealth(): HealthResponse {
    return {
      status: 'ok',
      service: 'docteurflotte-api',
      version: '0.1.0',
      uptime: Math.floor((Date.now() - this.startTime) / 1000),
      timestamp: new Date().toISOString(),
      environment: this.configService.get<string>('NODE_ENV', 'development'),
    };
  }

  async getReadiness(): Promise<ReadinessResponse> {
    const postgresCheck = await this.checkPostgres();
    const redisCheck = await this.checkRedis();

    const isReady = postgresCheck.status === 'up' && redisCheck.status === 'up';

    return {
      status: isReady ? 'ready' : 'not_ready',
      timestamp: new Date().toISOString(),
      dependencies: {
        postgres: postgresCheck,
        redis: redisCheck,
      },
    };
  }

  private resolveDatabaseUrl(): string | undefined {
    const directUrl = this.configService.get<string>('DATABASE_URL');
    if (directUrl) return directUrl;

    const host = this.configService.get<string>('DATABASE_HOST');
    const port = this.configService.get<string>('DATABASE_PORT') || '5432';
    const user = this.configService.get<string>('DATABASE_USER');
    const password = this.configService.get<string>('DATABASE_PASSWORD');
    const dbName = this.configService.get<string>('DATABASE_NAME');

    if (host && user && dbName) {
      const encodedPass = password ? `:${encodeURIComponent(password)}` : '';
      return `postgresql://${encodeURIComponent(user)}${encodedPass}@${host}:${port}/${encodeURIComponent(dbName)}`;
    }

    return undefined;
  }

  private resolveRedisUrl(): string | undefined {
    const directUrl = this.configService.get<string>('REDIS_URL');
    if (directUrl) return directUrl;

    const host = this.configService.get<string>('REDIS_HOST');
    const port = this.configService.get<string>('REDIS_PORT') || '6379';
    const password = this.configService.get<string>('REDIS_PASSWORD');

    if (host) {
      const encodedPass = password ? `:${encodeURIComponent(password)}@` : '';
      return `redis://${encodedPass}${host}:${port}`;
    }

    return undefined;
  }

  private async checkPostgres(): Promise<DependencyCheckResult> {
    const connectionString = this.resolveDatabaseUrl();
    if (!connectionString) {
      return { status: 'unconfigured', error: 'DATABASE_URL is not set' };
    }

    const start = Date.now();
    const pool = new Pool({
      connectionString,
      connectionTimeoutMillis: 1500,
    });

    try {
      const client = await pool.connect();
      await client.query('SELECT 1');
      client.release();
      await pool.end();
      return {
        status: 'up',
        latencyMs: Date.now() - start,
      };
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      this.logger.debug(`PostgreSQL check failed: ${errorMessage}`);
      try {
        await pool.end();
      } catch {
        // ignore pool closure error on failed connect
      }
      return {
        status: 'down',
        latencyMs: Date.now() - start,
        error: errorMessage,
      };
    }
  }

  private async checkRedis(): Promise<DependencyCheckResult> {
    const redisUrl = this.resolveRedisUrl();
    if (!redisUrl) {
      return { status: 'unconfigured', error: 'REDIS_URL is not set' };
    }

    const start = Date.now();
    let client: Redis | null = null;
    try {
      client = new Redis(redisUrl, {
        connectTimeout: 1500,
        maxRetriesPerRequest: 1,
        lazyConnect: true,
        retryStrategy: () => null,
      });

      await client.connect();
      const pong = await client.ping();
      await client.quit();

      return {
        status: pong === 'PONG' ? 'up' : 'down',
        latencyMs: Date.now() - start,
      };
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      this.logger.debug(`Redis check failed: ${errorMessage}`);
      if (client) {
        try {
          client.disconnect();
        } catch {
          // ignore disconnect error
        }
      }
      return {
        status: 'down',
        latencyMs: Date.now() - start,
        error: errorMessage,
      };
    }
  }
}
