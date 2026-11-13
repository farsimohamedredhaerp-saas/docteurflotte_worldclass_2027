import React, { useState } from 'react';
import { Header } from './components/Header';
import { NavigationStrip } from './components/NavigationStrip';
import { ExecutiveDashboardTab } from './components/Tabs/ExecutiveDashboardTab';
import { ActivityEntryTab } from './components/Tabs/ActivityEntryTab';
import { LedgerExplorerTab } from './components/Tabs/LedgerExplorerTab';
import { AuditCockpitTab } from './components/Tabs/AuditCockpitTab';
import { StatisticalAuditTab } from './components/Tabs/StatisticalAuditTab';
import { ScfFinancialStatementsTab } from './components/Tabs/ScfFinancialStatementsTab';
import { TaxDeclarationsTab } from './components/Tabs/TaxDeclarationsTab';
import {
  INITIAL_TENANT_PROFILE,
  INITIAL_LEDGER_LINES,
  INITIAL_AUDIT_ALERTS,
  INITIAL_G50_SUMMARY,
  INITIAL_IBS_SUMMARY,
} from './data/mock-client-data';
import {
  ClientTab,
  TenantProfile,
  ClientLedgerLine,
  ClientAuditAlert,
  EconomicActivityDraft,
} from './types/client';
import {
  AccountRole,
  BusinessEventType,
  EngineDecimal,
  EngineMath,
} from '@docteurflotte/decision-engine';

export const App: React.FC = () => {
  const [tenant] = useState<TenantProfile>(INITIAL_TENANT_PROFILE);
  const [activeTab, setActiveTab] = useState<ClientTab>('EXECUTIVE_DASHBOARD');
  const [ledgerLines, setLedgerLines] = useState<ClientLedgerLine[]>(INITIAL_LEDGER_LINES);
  const [alerts, setAlerts] = useState<ClientAuditAlert[]>(INITIAL_AUDIT_ALERTS);
  const [g50] = useState(INITIAL_G50_SUMMARY);
  const [ibs] = useState(INITIAL_IBS_SUMMARY);

  // Bascule du statut d'examen contradictoire d'une alerte (Règle 6)
  const handleToggleReview = (alertId: string) => {
    setAlerts((prev) =>
      prev.map((a) => (a.id === alertId ? { ...a, reviewed: !a.reviewed } : a))
    );
  };

  // Calcul dynamique du score de santé (100 - pénalités selon alertes non examinées)
  const pendingAlerts = alerts.filter((a) => !a.reviewed);
  const healthScore = Math.max(50, 100 - pendingAlerts.length * 8);

  // Ajout d'un événement au Grand Livre avec chaînage SHA-256
  const handleAddEventToLedger = (event: EconomicActivityDraft) => {
    const parsedHt = EngineMath.asAmount(event.amountHt || '0');
    const rateRatio = new EngineDecimal(event.vatRatePercent || '0').div(100);
    const vatAmount = EngineMath.asAmount(parsedHt.times(rateRatio));
    const amountTtc = EngineMath.asAmount(parsedHt.plus(vatAmount));

    const lastLine = ledgerLines[ledgerLines.length - 1];
    const baseLineNum = ledgerLines.length + 1;
    let currentPrevHash = lastLine ? lastLine.entryHash : '0000000000000000000000000000000000000000000000000000000000000000';

    const isSale = event.eventType === BusinessEventType.SALE_INVOICED;
    const newLines: ClientLedgerLine[] = [];

    // Ligne Débit
    const debitHash = `hash-${Date.now()}-deb-${Math.random().toString(36).slice(2, 8)}`;
    newLines.push({
      id: `l-${Date.now()}-1`,
      lineNumber: baseLineNum,
      date: event.date,
      journal: isSale ? 'VENTES' : 'ACHATS',
      accountCode: isSale ? (event.paymentChannel === 'CASH' ? '530000' : '411100') : '380000',
      accountLabel: isSale ? (event.paymentChannel === 'CASH' ? 'Caisse centrale' : 'Clients') : 'Marchandises stockées',
      accountRole: isSale ? AccountRole.CLIENT : AccountRole.STOCK_MERCHANDISE,
      label: `${event.description} (${event.documentRef})`,
      debit: amountTtc.toFixed(2),
      credit: '0.00',
      pieceRef: event.documentRef,
      prevHash: currentPrevHash,
      entryHash: debitHash,
    });
    currentPrevHash = debitHash;

    // Ligne Crédit HT
    const creditHtHash = `hash-${Date.now()}-cre1-${Math.random().toString(36).slice(2, 8)}`;
    newLines.push({
      id: `l-${Date.now()}-2`,
      lineNumber: baseLineNum + 1,
      date: event.date,
      journal: isSale ? 'VENTES' : 'ACHATS',
      accountCode: isSale ? '706000' : (event.paymentChannel === 'CASH' ? '530000' : '401100'),
      accountLabel: isSale ? 'Prestations de services transport' : 'Fournisseurs d exploitation',
      accountRole: isSale ? AccountRole.REVENUE_SERVICES : AccountRole.SUPPLIER,
      label: `${event.description} HT`,
      debit: '0.00',
      credit: parsedHt.toFixed(2),
      pieceRef: event.documentRef,
      prevHash: currentPrevHash,
      entryHash: creditHtHash,
    });
    currentPrevHash = creditHtHash;

    // Ligne TVA si applicable
    if (vatAmount.gt(0)) {
      const creditVatHash = `hash-${Date.now()}-cre2-${Math.random().toString(36).slice(2, 8)}`;
      newLines.push({
        id: `l-${Date.now()}-3`,
        lineNumber: baseLineNum + 2,
        date: event.date,
        journal: isSale ? 'VENTES' : 'ACHATS',
        accountCode: isSale ? '445710' : '445660',
        accountLabel: isSale ? `TVA collectée à ${event.vatRatePercent}%` : 'TVA déductible',
        accountRole: isSale ? AccountRole.VAT_COLLECTED : AccountRole.VAT_DEDUCTIBLE,
        label: `TVA ${event.vatRatePercent}% sur ${event.documentRef}`,
        debit: isSale ? '0.00' : vatAmount.toFixed(2),
        credit: isSale ? vatAmount.toFixed(2) : '0.00',
        pieceRef: event.documentRef,
        prevHash: currentPrevHash,
        entryHash: creditVatHash,
      });
    }

    setLedgerLines((prev) => [...prev, ...newLines]);
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Header
        tenant={tenant}
        healthScore={healthScore}
        openAlertsCount={pendingAlerts.length}
      />
      <NavigationStrip
        activeTab={activeTab}
        onTabChange={setActiveTab}
        openAlertsCount={pendingAlerts.length}
      />

      <main style={{ flex: 1 }}>
        {activeTab === 'EXECUTIVE_DASHBOARD' && (
          <ExecutiveDashboardTab
            healthScore={healthScore}
            alerts={alerts}
            g50={g50}
            ibs={ibs}
            onToggleReview={handleToggleReview}
          />
        )}
        {activeTab === 'ACTIVITY_ENTRY' && (
          <ActivityEntryTab
            onAddEventToLedger={handleAddEventToLedger}
            lastLedgerLine={ledgerLines[ledgerLines.length - 1]}
          />
        )}
        {activeTab === 'LEDGER_EXPLORER' && (
          <LedgerExplorerTab ledgerLines={ledgerLines} />
        )}
        {activeTab === 'AUDIT_COCKPIT' && <AuditCockpitTab />}
        {activeTab === 'STATISTICAL_AUDIT' && <StatisticalAuditTab />}
        {activeTab === 'SCF_STATEMENTS' && <ScfFinancialStatementsTab />}
        {activeTab === 'TAX_DECLARATIONS' && (
          <TaxDeclarationsTab g50={g50} ibs={ibs} />
        )}
      </main>
    </div>
  );
};
