/**
 * Routes centralisées pour l'application Web DocteurFlotte
 * Évite tout lien codé en dur dans les pages et composants.
 */

export const WORK_ORDER_SOURCE = { DIGITAL_TWIN: 'digital-twin' } as const;
export const WORK_ORDER_PRIORITY = { HIGH: 'HIGH' } as const;

export type WorkOrderParams = {
  assetId: string;
  source: (typeof WORK_ORDER_SOURCE)[keyof typeof WORK_ORDER_SOURCE];
  priority?: (typeof WORK_ORDER_PRIORITY)[keyof typeof WORK_ORDER_PRIORITY];
  organ?: string;
};

export const ROUTES = {
  HOME: '/',
  LIVE_COCKPIT: '/live-cockpit',
  DIGITAL_TWIN: '/digital-twin',
  WORK_ORDERS: '/work-orders',
  DISPATCH: '/dispatch',
  COLD_CHAIN: '/cold-chain',
  DVIR: '/dvir',
  PREVENTIVE: '/preventive',
  COPILOT: '/copilot',
  ADMIN: '/admin',
  workOrderForAsset: ({ assetId, source, priority, organ }: WorkOrderParams): string => {
    const params = new URLSearchParams({ assetId, source });
    if (priority) params.set('priority', priority);
    if (organ) params.set('organ', organ);
    return `/work-orders?${params.toString()}`;
  },
} as const;
