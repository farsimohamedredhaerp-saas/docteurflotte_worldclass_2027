export type OrganStatusType = 'HEALTHY' | 'PRE_CRITICAL' | 'CRITICAL';

export interface OrganStatusStyle {
  labelKey: string;
  color: string;
  bgColor: string;
  borderColor: string;
}

export const ORGAN_STATUS_STYLE: Record<OrganStatusType, OrganStatusStyle> = {
  HEALTHY: {
    labelKey: 'digitalTwin.status.healthy',
    color: '#10b981',
    bgColor: 'rgba(16, 185, 129, 0.15)',
    borderColor: '#10b981',
  },
  PRE_CRITICAL: {
    labelKey: 'digitalTwin.status.preCritical',
    color: '#f59e0b',
    bgColor: 'rgba(245, 158, 11, 0.15)',
    borderColor: '#f59e0b',
  },
  CRITICAL: {
    labelKey: 'digitalTwin.status.critical',
    color: '#ef4444',
    bgColor: 'rgba(239, 68, 68, 0.15)',
    borderColor: '#ef4444',
  },
};

export function getOrganStatusStyle(status: string): OrganStatusStyle {
  const normalized = (status as OrganStatusType) in ORGAN_STATUS_STYLE
    ? (status as OrganStatusType)
    : 'HEALTHY';
  return ORGAN_STATUS_STYLE[normalized];
}

