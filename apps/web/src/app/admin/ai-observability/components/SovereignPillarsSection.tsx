'use client';

import React from 'react';
import { CusumLegalReportViewer } from '../../../../components/fuel/CusumLegalReportViewer';
import { SovereignRagExplorer } from '../../../../components/knowledge/SovereignRagExplorer';
import { ProactiveAnomaliesWidget } from '../../../../components/decisions/ProactiveAnomaliesWidget';
import { WorkshopVoiceAssistant } from '../../../../components/voice/WorkshopVoiceAssistant';
import { SovereignPillarsSectionProps } from '../types';

export function SovereignPillarsSection({ token }: SovereignPillarsSectionProps) {
  return (
    <>
      {/* ────────────────────────────────────────────────────────────────────────── */}
      {/* 4. GREFFIER JURIDIQUE CUSUM & PREUVES VALHALLA BILINGUES (PILIER 1) */}
      {/* ────────────────────────────────────────────────────────────────────────── */}
      <div style={{ marginTop: '28px' }}>
        <CusumLegalReportViewer token={token || undefined} />
      </div>

      {/* ────────────────────────────────────────────────────────────────────────── */}
      {/* 5. RAG HYBRIDE SOUVERAIN OEM & ENACTA ALGÉRIE (PILIER 3) */}
      {/* ────────────────────────────────────────────────────────────────────────── */}
      <div style={{ marginTop: '28px' }}>
        <SovereignRagExplorer token={token || undefined} />
      </div>

      {/* ────────────────────────────────────────────────────────────────────────── */}
      {/* 6. DAEMON PROACTIF 08h00 & MATRICE FACTURES ATELIER (PILIERS 4 & 7) */}
      {/* ────────────────────────────────────────────────────────────────────────── */}
      <div style={{ marginTop: '28px' }}>
        <ProactiveAnomaliesWidget />
      </div>

      {/* ────────────────────────────────────────────────────────────────────────── */}
      {/* 7. ASSISTANT VOCAL ATELIER & GLOSSAIRE PHONÉTIQUE DARJA (PILIER 5) */}
      {/* ────────────────────────────────────────────────────────────────────────── */}
      <div style={{ marginTop: '28px' }}>
        <WorkshopVoiceAssistant token={token || undefined} />
      </div>
    </>
  );
}
