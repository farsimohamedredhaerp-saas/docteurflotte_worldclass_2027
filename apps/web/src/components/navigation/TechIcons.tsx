'use client';

import React from 'react';

export interface TechIconProps extends React.SVGProps<SVGSVGElement> {
  size?: number;
  strokeWidth?: number;
  className?: string;
}

const defaultProps = {
  size: 16,
  strokeWidth: 1.75,
  fill: 'none',
  stroke: 'currentColor',
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
};

export function IconActivity({ size = 16, strokeWidth = 1.75, ...props }: TechIconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" {...defaultProps} strokeWidth={strokeWidth} {...props}>
      <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
    </svg>
  );
}

export function IconAlertTriangle({ size = 16, strokeWidth = 1.75, ...props }: TechIconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" {...defaultProps} strokeWidth={strokeWidth} {...props}>
      <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
      <line x1="12" y1="9" x2="12" y2="13" />
      <line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  );
}

export function IconAlertOctagon({ size = 16, strokeWidth = 1.75, ...props }: TechIconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" {...defaultProps} strokeWidth={strokeWidth} {...props}>
      <polygon points="7.86 2 16.14 2 22 7.86 22 16.14 16.14 22 7.86 22 2 16.14 2 7.86 7.86 2" />
      <line x1="12" y1="8" x2="12" y2="12" />
      <line x1="12" y1="16" x2="12.01" y2="16" />
    </svg>
  );
}

export function IconTruck({ size = 16, strokeWidth = 1.75, ...props }: TechIconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" {...defaultProps} strokeWidth={strokeWidth} {...props}>
      <rect x="1" y="3" width="15" height="13" />
      <polygon points="16 8 20 8 23 11 23 16 16 16 16 8" />
      <circle cx="5.5" cy="18.5" r="2.5" />
      <circle cx="18.5" cy="18.5" r="2.5" />
    </svg>
  );
}

export function IconWrench({ size = 16, strokeWidth = 1.75, ...props }: TechIconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" {...defaultProps} strokeWidth={strokeWidth} {...props}>
      <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
    </svg>
  );
}

export function IconFuel({ size = 16, strokeWidth = 1.75, ...props }: TechIconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" {...defaultProps} strokeWidth={strokeWidth} {...props}>
      <line x1="3" y1="22" x2="15" y2="22" />
      <line x1="4" y1="9" x2="14" y2="9" />
      <path d="M14 22V4a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v18" />
      <path d="M14 13h2a2 2 0 0 1 2 2v2a2 2 0 0 0 2 2h0a2 2 0 0 0 2-2V9.83a2 2 0 0 0-.59-1.42L18 5" />
    </svg>
  );
}

export function IconBarChart3({ size = 16, strokeWidth = 1.75, ...props }: TechIconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" {...defaultProps} strokeWidth={strokeWidth} {...props}>
      <line x1="18" y1="20" x2="18" y2="10" />
      <line x1="12" y1="20" x2="12" y2="4" />
      <line x1="6" y1="20" x2="6" y2="14" />
    </svg>
  );
}

export function IconCpu({ size = 16, strokeWidth = 1.75, ...props }: TechIconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" {...defaultProps} strokeWidth={strokeWidth} {...props}>
      <rect x="4" y="4" width="16" height="16" rx="2" />
      <rect x="9" y="9" width="6" height="6" />
      <line x1="9" y1="1" x2="9" y2="4" />
      <line x1="15" y1="1" x2="15" y2="4" />
      <line x1="9" y1="20" x2="9" y2="23" />
      <line x1="15" y1="20" x2="15" y2="23" />
      <line x1="20" y1="9" x2="23" y2="9" />
      <line x1="20" y1="14" x2="23" y2="14" />
      <line x1="1" y1="9" x2="4" y2="9" />
      <line x1="1" y1="14" x2="4" y2="14" />
    </svg>
  );
}

export function IconGauge({ size = 16, strokeWidth = 1.75, ...props }: TechIconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" {...defaultProps} strokeWidth={strokeWidth} {...props}>
      <path d="m12 14 4-4" />
      <path d="M3.34 19a10 10 0 1 1 17.32 0" />
    </svg>
  );
}

export function IconMapPin({ size = 16, strokeWidth = 1.75, ...props }: TechIconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" {...defaultProps} strokeWidth={strokeWidth} {...props}>
      <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  );
}

export function IconRadio({ size = 16, strokeWidth = 1.75, ...props }: TechIconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" {...defaultProps} strokeWidth={strokeWidth} {...props}>
      <circle cx="12" cy="12" r="2" />
      <path d="M16.24 7.76a6 6 0 0 1 0 8.49m-8.48-.01a6 6 0 0 1 0-8.49m11.31-2.82a10 10 0 0 1 0 14.14m-14.14 0a10 10 0 0 1 0-14.14" />
    </svg>
  );
}

export function IconLayers({ size = 16, strokeWidth = 1.75, ...props }: TechIconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" {...defaultProps} strokeWidth={strokeWidth} {...props}>
      <polygon points="12 2 2 7 12 12 22 7 12 2" />
      <polyline points="2 17 12 22 22 17" />
      <polyline points="2 12 12 17 22 12" />
    </svg>
  );
}

export function IconSearch({ size = 16, strokeWidth = 1.75, ...props }: TechIconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" {...defaultProps} strokeWidth={strokeWidth} {...props}>
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  );
}

export function IconFilter({ size = 16, strokeWidth = 1.75, ...props }: TechIconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" {...defaultProps} strokeWidth={strokeWidth} {...props}>
      <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
    </svg>
  );
}

export function IconChevronRight({ size = 16, strokeWidth = 1.75, ...props }: TechIconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" {...defaultProps} strokeWidth={strokeWidth} {...props}>
      <polyline points="9 18 15 12 9 6" />
    </svg>
  );
}

export function IconChevronLeft({ size = 16, strokeWidth = 1.75, ...props }: TechIconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" {...defaultProps} strokeWidth={strokeWidth} {...props}>
      <polyline points="15 18 9 12 15 6" />
    </svg>
  );
}

export function IconChevronDown({ size = 16, strokeWidth = 1.75, ...props }: TechIconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" {...defaultProps} strokeWidth={strokeWidth} {...props}>
      <polyline points="6 9 12 15 18 9" />
    </svg>
  );
}

export function IconShieldCheck({ size = 16, strokeWidth = 1.75, ...props }: TechIconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" {...defaultProps} strokeWidth={strokeWidth} {...props}>
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  );
}

export const IconShield = IconShieldCheck;

export function IconSliders({ size = 16, strokeWidth = 1.75, ...props }: TechIconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" {...defaultProps} strokeWidth={strokeWidth} {...props}>
      <line x1="4" y1="21" x2="4" y2="14" />
      <line x1="4" y1="10" x2="4" y2="3" />
      <line x1="12" y1="21" x2="12" y2="12" />
      <line x1="12" y1="8" x2="12" y2="3" />
      <line x1="20" y1="21" x2="20" y2="16" />
      <line x1="20" y1="12" x2="20" y2="3" />
      <line x1="1" y1="14" x2="7" y2="14" />
      <line x1="9" y1="8" x2="15" y2="8" />
      <line x1="17" y1="16" x2="23" y2="16" />
    </svg>
  );
}

export function IconSun({ size = 16, strokeWidth = 1.75, ...props }: TechIconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" {...defaultProps} strokeWidth={strokeWidth} {...props}>
      <circle cx="12" cy="12" r="5" />
      <line x1="12" y1="1" x2="12" y2="3" />
      <line x1="12" y1="21" x2="12" y2="23" />
      <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
      <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
      <line x1="1" y1="12" x2="3" y2="12" />
      <line x1="21" y1="12" x2="23" y2="12" />
      <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
      <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
    </svg>
  );
}

export function IconMoon({ size = 16, strokeWidth = 1.75, ...props }: TechIconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" {...defaultProps} strokeWidth={strokeWidth} {...props}>
      <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />
    </svg>
  );
}

export function IconTerminal({ size = 16, strokeWidth = 1.75, ...props }: TechIconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" {...defaultProps} strokeWidth={strokeWidth} {...props}>
      <polyline points="4 17 10 11 4 5" />
      <line x1="12" y1="19" x2="20" y2="19" />
    </svg>
  );
}

export function IconHardHat({ size = 16, strokeWidth = 1.75, ...props }: TechIconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" {...defaultProps} strokeWidth={strokeWidth} {...props}>
      <path d="M2 18a1 1 0 0 0 1 1h18a1 1 0 0 0 1-1v-2a1 1 0 0 0-1-1H3a1 1 0 0 0-1 1v2z" />
      <path d="M10 10V5a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v5" />
      <path d="M4 15v-3a8 8 0 0 1 16 0v3" />
    </svg>
  );
}

export function IconCheckCircle({ size = 16, strokeWidth = 1.75, ...props }: TechIconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" {...defaultProps} strokeWidth={strokeWidth} {...props}>
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
      <polyline points="22 4 12 14.01 9 11.01" />
    </svg>
  );
}

export function IconClock({ size = 16, strokeWidth = 1.75, ...props }: TechIconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" {...defaultProps} strokeWidth={strokeWidth} {...props}>
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  );
}

export function IconDatabase({ size = 16, strokeWidth = 1.75, ...props }: TechIconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" {...defaultProps} strokeWidth={strokeWidth} {...props}>
      <ellipse cx="12" cy="5" rx="9" ry="3" />
      <path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3" />
      <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5" />
    </svg>
  );
}

export function IconX({ size = 16, strokeWidth = 1.75, ...props }: TechIconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" {...defaultProps} strokeWidth={strokeWidth} {...props}>
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}

export function IconMoreHorizontal({ size = 16, strokeWidth = 1.75, ...props }: TechIconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" {...defaultProps} strokeWidth={strokeWidth} {...props}>
      <circle cx="12" cy="12" r="1" />
      <circle cx="19" cy="12" r="1" />
      <circle cx="5" cy="12" r="1" />
    </svg>
  );
}

export function IconArrowUpRight({ size = 16, strokeWidth = 1.75, ...props }: TechIconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" {...defaultProps} strokeWidth={strokeWidth} {...props}>
      <line x1="7" y1="17" x2="17" y2="7" />
      <polyline points="7 7 17 7 17 17" />
    </svg>
  );
}

export function IconArrowDownRight({ size = 16, strokeWidth = 1.75, ...props }: TechIconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" {...defaultProps} strokeWidth={strokeWidth} {...props}>
      <line x1="7" y1="7" x2="17" y2="17" />
      <polyline points="17 7 17 17 7 17" />
    </svg>
  );
}

export function IconSlidersHorizontal({ size = 16, strokeWidth = 1.75, ...props }: TechIconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" {...defaultProps} strokeWidth={strokeWidth} {...props}>
      <line x1="21" y1="4" x2="14" y2="4" />
      <line x1="10" y1="4" x2="3" y2="4" />
      <line x1="21" y1="12" x2="12" y2="12" />
      <line x1="8" y1="12" x2="3" y2="12" />
      <line x1="21" y1="20" x2="16" y2="20" />
      <line x1="12" y1="20" x2="3" y2="20" />
      <line x1="14" y1="2" x2="14" y2="6" />
      <line x1="8" y1="10" x2="8" y2="14" />
      <line x1="16" y1="18" x2="16" y2="22" />
    </svg>
  );
}

export function IconDownload({ size = 16, strokeWidth = 1.75, ...props }: TechIconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" {...defaultProps} strokeWidth={strokeWidth} {...props}>
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="7 10 12 15 17 10" />
      <line x1="12" y1="15" x2="12" y2="3" />
    </svg>
  );
}

export function IconPlus({ size = 16, strokeWidth = 1.75, ...props }: TechIconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" {...defaultProps} strokeWidth={strokeWidth} {...props}>
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  );
}

export function IconRefreshCw({ size = 16, strokeWidth = 1.75, ...props }: TechIconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" {...defaultProps} strokeWidth={strokeWidth} {...props}>
      <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" />
      <path d="M21 3v5h-5" />
      <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" />
      <path d="M8 16H3v5" />
    </svg>
  );
}

export function IconEye({ size = 16, strokeWidth = 1.75, ...props }: TechIconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" {...defaultProps} strokeWidth={strokeWidth} {...props}>
      <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

export function IconZap({ size = 16, strokeWidth = 1.75, ...props }: TechIconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" {...defaultProps} strokeWidth={strokeWidth} {...props}>
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
    </svg>
  );
}

export function IconCheck({ size = 16, strokeWidth = 1.75, ...props }: TechIconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" {...defaultProps} strokeWidth={strokeWidth} {...props}>
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

export function IconExternalLink({ size = 16, strokeWidth = 1.75, ...props }: TechIconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" {...defaultProps} strokeWidth={strokeWidth} {...props}>
      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
      <polyline points="15 3 21 3 21 9" />
      <line x1="10" y1="14" x2="21" y2="3" />
    </svg>
  );
}

export function IconNavigation({ size = 16, strokeWidth = 1.75, ...props }: TechIconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" {...defaultProps} strokeWidth={strokeWidth} {...props}>
      <polygon points="3 11 22 2 13 21 11 13 3 11" />
    </svg>
  );
}


export function IconCrosshair({ size = 16, strokeWidth = 1.75, ...props }: TechIconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" {...defaultProps} strokeWidth={strokeWidth} {...props}>
      <circle cx="12" cy="12" r="10" />
      <line x1="22" y1="12" x2="18" y2="12" />
      <line x1="6" y1="12" x2="2" y2="12" />
      <line x1="12" y1="6" x2="12" y2="2" />
      <line x1="12" y1="22" x2="12" y2="18" />
    </svg>
  );
}


export function IconPlay({ size = 16, strokeWidth = 1.75, ...props }: TechIconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" {...defaultProps} strokeWidth={strokeWidth} {...props}>
      <polygon points="5 3 19 12 5 21 5 3" />
    </svg>
  );
}

export function IconPause({ size = 16, strokeWidth = 1.75, ...props }: TechIconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" {...defaultProps} strokeWidth={strokeWidth} {...props}>
      <rect x="6" y="4" width="4" height="16" />
      <rect x="14" y="4" width="4" height="16" />
    </svg>
  );
}

export function IconFlame({ size = 16, strokeWidth = 1.75, ...props }: TechIconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" {...defaultProps} strokeWidth={strokeWidth} {...props}>
      <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z" />
    </svg>
  );
}

export function IconEdit({ size = 16, strokeWidth = 1.75, ...props }: TechIconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" {...defaultProps} strokeWidth={strokeWidth} {...props}>
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
    </svg>
  );
}

export function IconTrash({ size = 16, strokeWidth = 1.75, ...props }: TechIconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" {...defaultProps} strokeWidth={strokeWidth} {...props}>
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
      <line x1="10" y1="11" x2="10" y2="17" />
      <line x1="14" y1="11" x2="14" y2="17" />
    </svg>
  );
}



