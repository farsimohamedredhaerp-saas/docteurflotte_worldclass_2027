import React from 'react';

export interface DocSection {
  id: string;
  title: string;
  badge: string;
  Icon: React.ComponentType<{ size?: number; className?: string }>;
}

export type ModeTab = 'mode0' | 'mode1' | 'mode2';
export type InnovationKey = 'HWFA' | 'SES_UEB' | 'KMSO' | 'BEP_VCO' | 'CSIS';
export type ClimateZone = 'TELL' | 'STEPPE' | 'SAHARA';

export interface GuideHeaderProps {
  onBackToAssets?: () => void;
}

export interface GuideSidebarNavProps {
  sections: DocSection[];
  activeSection: string;
  onSelectSection: (id: string) => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
}

export interface RoiSimulatorState {
  actionCost: number;
  setActionCost: (v: number) => void;
  towingCost: number;
  setTowingCost: (v: number) => void;
  partReplacement: number;
  setPartReplacement: (v: number) => void;
  immobilizationDays: number;
  setImmobilizationDays: (v: number) => void;
  dailyLoss: number;
  setDailyLoss: (v: number) => void;
  failureProb: number;
  setFailureProb: (v: number) => void;
  totalInactionRisk: number;
  netSavings: number;
  roiRatio: string;
}

