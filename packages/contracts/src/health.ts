export type ServiceStatus = 'ok' | 'degraded' | 'down';

export type PlatformServiceState =
  | 'checking'
  | 'online'
  | 'degraded'
  | 'offline'
  | 'unknown'
  | 'stale';

export interface ServiceHealthIndicator {
  state: PlatformServiceState;
  latencyMs: number | null;
  checkedAt: string;
  details?: string;
}

export interface PlatformHealthSummary {
  status: 'healthy' | 'degraded' | 'critical';
  timestamp: string;
  telematics: ServiceHealthIndicator & {
    provider: string;
    mode: string;
    port?: number;
  };
  ai: ServiceHealthIndicator & {
    model: string;
    localSovereign: boolean;
  };
  security: ServiceHealthIndicator & {
    rlsEnforced: boolean;
    sovereignHosting: boolean;
    complianceNote: string;
  };
}

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
