import React, { useState } from 'react';
import {
  StudioAuditAction,
  StudioPack,
  StudioPackItem,
  StudioTabKey,
  UserStudioRole,
} from './types/studio';
import {
  INITIAL_STUDIO_AUDIT_LOGS,
  INITIAL_STUDIO_PACKS,
} from './data/initial-packs';
import {
  EvidenceLevel,
  RegPackStatus,
  VerificationStatus,
} from '@docteurflotte/decision-engine';
import { Navbar } from './components/Navbar';
import { CommandStrip } from './components/CommandStrip';
import { CommandPalette } from './components/CommandPalette';
import { PacksDiffTab } from './components/Tabs/PacksDiffTab';
import { RuleEditorTab } from './components/Tabs/RuleEditorTab';
import { SandboxTab } from './components/Tabs/SandboxTab';
import { ParametersMatrixTab } from './components/Tabs/ParametersMatrixTab';
import { UnverifiedGateTab } from './components/Tabs/UnverifiedGateTab';
import { ApprovalWorkflowTab } from './components/Tabs/ApprovalWorkflowTab';
import { AuditTrailTab } from './components/Tabs/AuditTrailTab';

export const App: React.FC = () => {
  const [packs, setPacks] = useState<StudioPack[]>(INITIAL_STUDIO_PACKS);
  const [activePackId, setActivePackId] = useState<string>(packs[1]?.id || packs[0].id); // LF 2026 par défaut
  const [activeTab, setActiveTab] = useState<StudioTabKey>('packs');
  const [currentRole, setCurrentRole] = useState<UserStudioRole>('AUTEUR');
  const [isPaletteOpen, setIsPaletteOpen] = useState<boolean>(false);
  const [auditLogs, setAuditLogs] = useState<StudioAuditAction[]>(INITIAL_STUDIO_AUDIT_LOGS);

  // Compteur global de paramètres UNVERIFIED
  const totalUnverifiedCount = packs.reduce((acc, p) => {
    return (
      acc +
      p.items.filter((i) => i.verificationStatus === VerificationStatus.UNVERIFIED).length
    );
  }, 0);

  // Handler : mise à jour d'un item de règle
  const handleUpdateRuleItem = (packId: string, updatedItem: StudioPackItem) => {
    setPacks((prev) =>
      prev.map((p) => {
        if (p.id !== packId) return p;
        return {
          ...p,
          updatedAt: new Date().toISOString(),
          items: p.items.map((i) => (i.code === updatedItem.code ? updatedItem : i)),
        };
      })
    );

    const newLog: StudioAuditAction = {
      id: `audit-${Date.now()}`,
      timestamp: new Date().toISOString(),
      userRole: currentRole,
      userName: `Utilisateur (${currentRole})`,
      actionType: 'ITEM_EDITED',
      targetPackId: packId,
      targetItemCode: updatedItem.code,
      detailsFr: `Mise à jour de la structure AST de la règle ${updatedItem.code}.`,
    };
    setAuditLogs((prev) => [newLog, ...prev]);
  };

  // Handler : certification d'un paramètre UNVERIFIED
  const handleVerifyParameter = (
    packId: string,
    itemCode: string,
    newStatus: VerificationStatus,
    newEvidence: EvidenceLevel,
    legalRef: string
  ) => {
    setPacks((prev) =>
      prev.map((p) => {
        if (p.id !== packId) return p;
        return {
          ...p,
          updatedAt: new Date().toISOString(),
          items: p.items.map((i) => {
            if (i.code !== itemCode) return i;
            return {
              ...i,
              verificationStatus: newStatus,
              evidenceLevel: newEvidence,
              legalRef,
              legalBasisVerified: true,
            };
          }),
        };
      })
    );

    const newLog: StudioAuditAction = {
      id: `audit-${Date.now()}`,
      timestamp: new Date().toISOString(),
      userRole: currentRole,
      userName: `Expert (${currentRole})`,
      actionType: 'UNVERIFIED_MODIFIED',
      targetPackId: packId,
      targetItemCode: itemCode,
      detailsFr: `Levée du blocage : paramètre ${itemCode} certifié au statut ${newStatus} avec la réf [${legalRef}].`,
    };
    setAuditLogs((prev) => [newLog, ...prev]);
  };

  // Handler : approbation formelle expert
  const handleApprovePack = (packId: string, approverName: string) => {
    setPacks((prev) =>
      prev.map((p) => {
        if (p.id !== packId) return p;
        return {
          ...p,
          validatedByExpert: approverName,
          status: RegPackStatus.APPROVED,
          updatedAt: new Date().toISOString(),
        };
      })
    );

    const newLog: StudioAuditAction = {
      id: `audit-${Date.now()}`,
      timestamp: new Date().toISOString(),
      userRole: currentRole,
      userName: approverName,
      actionType: 'APPROVED',
      targetPackId: packId,
      detailsFr: `Validation formelle accordée par l Expert Agréé pour le pack ${packId}.`,
    };
    setAuditLogs((prev) => [newLog, ...prev]);
  };

  // Handler : signature Ed25519 et publication
  const handlePublishPack = (packId: string, signature: string, contentHash: string) => {
    setPacks((prev) =>
      prev.map((p) => {
        if (p.id !== packId) return p;
        return {
          ...p,
          signature,
          contentHash,
          status: RegPackStatus.PUBLISHED,
          updatedAt: new Date().toISOString(),
        };
      })
    );

    const newLog: StudioAuditAction = {
      id: `audit-${Date.now()}`,
      timestamp: new Date().toISOString(),
      userRole: currentRole,
      userName: `Publieur (${currentRole})`,
      actionType: 'PUBLISHED',
      targetPackId: packId,
      detailsFr: `Publication certifiée avec signature Ed25519 (${signature.slice(0, 16)}...) pour le pack ${packId}.`,
    };
    setAuditLogs((prev) => [newLog, ...prev]);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Top Navbar */}
      <Navbar
        currentRole={currentRole}
        onRoleChange={setCurrentRole}
        onOpenPalette={() => setIsPaletteOpen(true)}
        unverifiedCount={totalUnverifiedCount}
      />

      {/* Command Strip Navigation Tabs */}
      <CommandStrip
        activeTab={activeTab}
        onTabChange={setActiveTab}
        unverifiedCount={totalUnverifiedCount}
      />

      {/* Main Tab Content */}
      <main className="flex-1 bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950">
        {activeTab === 'packs' && (
          <PacksDiffTab
            packs={packs}
            onSelectPackForEdit={(id) => {
              setActivePackId(id);
              setActiveTab('rules');
            }}
          />
        )}

        {activeTab === 'rules' && (
          <RuleEditorTab
            packs={packs}
            activePackId={activePackId}
            onUpdateRuleItem={handleUpdateRuleItem}
          />
        )}

        {activeTab === 'sandbox' && (
          <SandboxTab packs={packs} activePackId={activePackId} />
        )}

        {activeTab === 'parameters' && (
          <ParametersMatrixTab
            packs={packs}
            activePackId={activePackId}
            onUpdateItem={(pId, item) => handleUpdateRuleItem(pId, item)}
          />
        )}

        {activeTab === 'unverified-gate' && (
          <UnverifiedGateTab
            packs={packs}
            currentRole={currentRole}
            onVerifyParameter={handleVerifyParameter}
          />
        )}

        {activeTab === 'approval' && (
          <ApprovalWorkflowTab
            packs={packs}
            activePackId={activePackId}
            currentRole={currentRole}
            onApprovePack={handleApprovePack}
            onPublishPack={handlePublishPack}
          />
        )}

        {activeTab === 'audit-trail' && <AuditTrailTab logs={auditLogs} />}
      </main>

      {/* Command Palette (⌘K) */}
      <CommandPalette
        isOpen={isPaletteOpen}
        onClose={() => setIsPaletteOpen(false)}
        onSelectTab={setActiveTab}
        onSelectRole={setCurrentRole}
      />

      {/* Footer Notice */}
      <footer className="border-t border-slate-900 bg-slate-950/80 px-4 py-2 text-[11px] text-slate-500 flex items-center justify-between">
        <div>
          <span>Rule Studio (Control Plane SuperAdmin) — ComptaFiscDZ 2026</span>
          <span className="mx-2">•</span>
          <span>Aide à la décision réglementaire, à valider par un professionnel agréé</span>
        </div>
        <div className="font-mono text-[10px] text-slate-600">
          Ed25519 / RFC 8785 / JORADP Compliant
        </div>
      </footer>
    </div>
  );
};
