export type ServiceStatus = 'ok' | 'degraded' | 'down';

export interface HealthResponse {
  status: ServiceStatus;
  service: string;
  version: string;
  uptime: number;
  timestamp: string;
  environment: string;
}

export interface DependencyCheckResult {
  status: 'up' | 'down' | 'unconfigured';
  latencyMs?: number;
  error?: string;
}

export interface ReadinessResponse {
  status: 'ready' | 'not_ready';
  timestamp: string;
  dependencies: {
    postgres: DependencyCheckResult;
    redis: DependencyCheckResult;
  };
}
