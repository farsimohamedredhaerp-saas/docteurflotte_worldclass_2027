'use client';

import React from 'react';
import { useMaintenance } from '../context/MaintenanceContext';
import { MaintenanceNavHeader } from './MaintenanceNavHeader';
import { ProofOfCalculationModal } from './modals/ProofOfCalculationModal';
import { StockIssueModal } from './modals/StockIssueModal';

export function MaintenanceLayoutShell({ children }: { children: React.ReactNode }) {
  const {
    selectedProofAsset,
    setSelectedProofAsset,
    selectedProofSubsystem,
    setSelectedProofSubsystem,
    issueModalItem,
    setIssueModalItem,
    warehouses,
    workOrders,
    handleExecuteStockIssue,
    feedbackNotification,
  } = useMaintenance();

  return (
    <div style={{ maxWidth: '1440px', margin: '0 auto', padding: '1.25rem 1.5rem' }}>
      {/* Flash Feedback Banner */}
      {feedbackNotification && (
        <div
          style={{
            background: 'rgba(16, 185, 129, 0.15)',
            border: '1px solid rgba(16, 185, 129, 0.3)',
            borderRadius: '8px',
            padding: '10px 16px',
            marginBottom: '1rem',
            color: '#6ee7b7',
            fontSize: '13px',
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <span>✓</span>
          <span>{feedbackNotification}</span>
        </div>
      )}

      <MaintenanceNavHeader />

      <main>{children}</main>

      {/* Global Modals Mounted with ModalErrorBoundary via Modal primitive */}
      <ProofOfCalculationModal
        asset={selectedProofAsset}
        subsystem={selectedProofSubsystem}
        onSubsystemChange={setSelectedProofSubsystem}
        onClose={() => setSelectedProofAsset(null)}
      />

      <StockIssueModal
        item={issueModalItem}
        warehouses={warehouses}
        workOrders={workOrders}
        onChangeItem={setIssueModalItem}
        onConfirm={handleExecuteStockIssue}
        onClose={() => setIssueModalItem(null)}
      />
    </div>
  );
}

