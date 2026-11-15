'use client';

import React from 'react';
import { KpiCard, KpiStatus } from '../ui/KpiCard';
import {
  IconTruck,
  IconActivity,
  IconAlertTriangle,
  IconFuel,
  IconWrench,
  IconShieldCheck,
  IconClock,
} from '../navigation/TechIcons';

export interface KpiMetricItem {
  id: string;
  label: string;
  value: string | number;
  unit?: string;
  trend?: {
    value: string;
    isPositive: boolean;
    label: string;
  };
  status?: KpiStatus;
  sparklineData?: number[];
  iconType: 'fleet' | 'activity' | 'alert' | 'fuel' | 'maintenance' | 'compliance' | 'clock';
}

const DEFAULT_KPIS: KpiMetricItem[] = [
  {
    id: 'active_assets',
    label: 'Unités en Mission',
    value: '142',
    unit: '/ 160',
    trend: { value: '+4.2%', isPositive: true, label: 'vs hier' },
    status: 'nominal',
    sparklineData: [130, 134, 132, 138, 140, 139, 142],
    iconType: 'fleet',
  },
  {
    id: 'live_telemetry_flow',
    label: 'Flux Télémétrique',
    value: '99.8',
    unit: '%',
    trend: { value: '< 24ms', isPositive: true, label: 'latence p95' },
    status: 'nominal',
    sparklineData: [99.2, 99.4, 99.6, 99.5, 99.7, 99.8, 99.8],
    iconType: 'activity',
  },
  {
    id: 'critical_dtc_alerts',
    label: 'DTC Critiques',
    value: '3',
    unit: 'actifs',
    trend: { value: '-2', isPositive: true, label: 'depuis 24h' },
    status: 'critical',
    sparklineData: [7, 6, 6, 5, 5, 4, 3],
    iconType: 'alert',
  },
  {
    id: 'roi_preventive_savings',
    label: 'Gain Net Préventif',
    value: '1 420 000',
    unit: 'DA',
    trend: { value: '+340 000 DA', isPositive: true, label: 'ce mois' },
    status: 'nominal',
    sparklineData: [850000, 920000, 1100000, 1150000, 1280000, 1340000, 1420000],
    iconType: 'compliance',
  },
  {
    id: 'fuel_theft_cusum',
    label: 'Anti-Fraude CUSUM',
    value: '0 Vol',
    unit: 'CUSUM OK',
    trend: { value: '100%', isPositive: true, label: 'pleins réconciliés' },
    status: 'nominal',
    sparklineData: [0, 0, 0, 0, 0, 0, 0],
    iconType: 'fuel',
  },
  {
    id: 'fuel_efficiency',
    label: 'Conso Moyenne',
    value: '31.4',
    unit: 'L/100',
    trend: { value: '-1.8%', isPositive: true, label: 'optimisé' },
    status: 'nominal',
    sparklineData: [34.2, 33.8, 33.1, 32.5, 32.0, 31.8, 31.4],
    iconType: 'fuel',
  },
  {
    id: 'preventive_due_soon',
    label: 'Échéances (< 48h)',
    value: '7',
    unit: 'engins',
    trend: { value: '+3', isPositive: false, label: 'horamètre BTPH' },
    status: 'warning',
    sparklineData: [4, 5, 4, 6, 5, 6, 7],
    iconType: 'maintenance',
  },
  {
    id: 'dto_availability_rate',
    label: 'Disponibilité DTO',
    value: '94.6',
    unit: '%',
    trend: { value: '+0.8%', isPositive: true, label: 'SLA garanti' },
    status: 'nominal',
    sparklineData: [92.1, 92.5, 93.0, 93.4, 94.0, 94.2, 94.6],
    iconType: 'compliance',
  },
];

interface HighDensityKpiGridProps {
  metrics?: KpiMetricItem[];
  isLoading?: boolean;
}

export function HighDensityKpiGrid({ metrics = DEFAULT_KPIS, isLoading = false }: HighDensityKpiGridProps) {
  const renderIcon = (type: KpiMetricItem['iconType']) => {
    switch (type) {
      case 'fleet':
        return <IconTruck size={14} strokeWidth={1.75} />;
      case 'activity':
        return <IconActivity size={14} strokeWidth={1.75} />;
      case 'alert':
        return <IconAlertTriangle size={14} strokeWidth={1.75} />;
      case 'fuel':
        return <IconFuel size={14} strokeWidth={1.75} />;
      case 'maintenance':
        return <IconWrench size={14} strokeWidth={1.75} />;
      case 'compliance':
        return <IconShieldCheck size={14} strokeWidth={1.75} />;
      case 'clock':
        return <IconClock size={14} strokeWidth={1.75} />;
      default:
        return <IconActivity size={14} strokeWidth={1.75} />;
    }
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-8 gap-3 mb-6">
      {metrics.map((kpi) => (
        <KpiCard
          key={kpi.id}
          label={kpi.label}
          value={kpi.value}
          unit={kpi.unit}
          trend={kpi.trend}
          status={kpi.status}
          sparklineData={kpi.sparklineData}
          isLoading={isLoading}
          icon={renderIcon(kpi.iconType)}
        />
      ))}
    </div>
  );
}
