'use client';

import React from 'react';
import {
  IconFileText,
  IconLayers,
  IconCreditCard,
} from '@/components/navigation/TechIcons';
import type { SubscriptionsTab } from '../types';

interface SubscriptionsTabNavigationProps {
  activeTab: SubscriptionsTab;
  onSelectTab: (tab: SubscriptionsTab) => void;
  plansCount: number;
  tenantsCount: number;
  invoicesCount: number;
}

export function SubscriptionsTabNavigation({
  activeTab,
  onSelectTab,
  plansCount,
  tenantsCount,
  invoicesCount,
}: SubscriptionsTabNavigationProps) {
  return (
    <div
      style={{
        display: 'flex',
        borderBottom: '1px solid var(--df-border-subtle)',
        marginBottom: '1.25rem',
        gap: '0.5rem',
      }}
    >
      <button
        type="button"
        onClick={() => onSelectTab('plans')}
        style={{
          padding: '0.65rem 1.25rem',
          background: 'none',
          border: 'none',
          borderBottom: activeTab === 'plans' ? '2px solid var(--df-accent-blue)' : '2px solid transparent',
          color: activeTab === 'plans' ? 'var(--df-text-main)' : 'var(--df-text-muted)',
          fontWeight: activeTab === 'plans' ? 700 : 500,
          fontSize: '0.88rem',
          cursor: 'pointer',
          display: 'inline-flex',
          alignItems: 'center',
          gap: '6px',
        }}
      >
        <IconFileText size={15} />
        <span>Catalogue des Plans ({plansCount})</span>
      </button>
      <button
        type="button"
        onClick={() => onSelectTab('tenants')}
        style={{
          padding: '0.65rem 1.25rem',
          background: 'none',
          border: 'none',
          borderBottom: activeTab === 'tenants' ? '2px solid var(--df-accent-blue)' : '2px solid transparent',
          color: activeTab === 'tenants' ? 'var(--df-text-main)' : 'var(--df-text-muted)',
          fontWeight: activeTab === 'tenants' ? 700 : 500,
          fontSize: '0.88rem',
          cursor: 'pointer',
          display: 'inline-flex',
          alignItems: 'center',
          gap: '6px',
        }}
      >
        <IconLayers size={15} />
        <span>Abonnements Tenants &amp; Négociations ({tenantsCount})</span>
      </button>
      <button
        type="button"
        onClick={() => onSelectTab('invoices')}
        style={{
          padding: '0.65rem 1.25rem',
          background: 'none',
          border: 'none',
          borderBottom: activeTab === 'invoices' ? '2px solid var(--df-accent-blue)' : '2px solid transparent',
          color: activeTab === 'invoices' ? 'var(--df-text-main)' : 'var(--df-text-muted)',
          fontWeight: activeTab === 'invoices' ? 700 : 500,
          fontSize: '0.88rem',
          cursor: 'pointer',
          display: 'inline-flex',
          alignItems: 'center',
          gap: '6px',
        }}
      >
        <IconCreditCard size={15} />
        <span>Facturation &amp; Proformas DGI ({invoicesCount})</span>
      </button>
    </div>
  );
}
