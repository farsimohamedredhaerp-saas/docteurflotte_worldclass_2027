'use client';

import React, { useState } from 'react';
import {
  BilingualLegalAuditReport,
  PreComputedContextGraphPayload,
  NAFTAL_FUEL_PRICES_DZD,
} from '@docteurflotte/contracts';
import { FuelScannerClient } from '../../lib/api-fuel-scanner';

interface CusumLegalReportViewerProps {
  initialReport?: BilingualLegalAuditReport | null;
  onClose?: () => void;
  token?: string;
}

// Incidents prédéfinis prêts à être évalués en direct
const CUSUM_PRESET_INCIDENTS = [
  {
    name: 'Cas 1 : Siphonnage Avéré RN1 Djelfa (Plateau Steppique)',
    description: 'Chute de 38.5 L à l’arrêt complet sur la RN1 (Pente 1.2%), sans ravitaillement Naftal.',
    payload: {
      eventId: 'EVT-CUSUM-DJELFA-RN1-LIVE',
      vehicleId: 'veh-actros-00412',
      vehiclePlate: '00412-116-17',
      driverPseudonym: 'CHAUFFEUR_DZ_M982',
      timestamp: new Date().toISOString(),
      location: {
        latitude: 34.6728,
        longitude: 3.2514,
        wilayaCode: 17,
        wilayaName: 'Djelfa',
        roadName: 'RN1 Axe Nord-Sud (Pk 298)',
        roadGradePercent: 1.2,
      },
      telemetry: {
        speedKmh: 0,
        engineRpm: 0,
        ignitionOn: false,
        idleHoursToday: 0.5,
        durationStationarySeconds: 2400,
      },
      fuelReading: {
        tankCapacityLiters: 450,
        rawLevelsLiters: [380.0, 375.0, 360.0, 341.5],
        tankLengthMeters: 1.8,
        sensorOffsetRatio: 0.25,
      },
      context: {
        nearestNaftalStationKm: 28.4,
        hasLegitimateFuelReceipt: false,
        fuelUnitPriceDzd: NAFTAL_FUEL_PRICES_DZD.GASOIL,
      },
    },
  },
  {
    name: 'Cas 2 : Fausse Alerte Dévers Topographique (Gorges de la Chiffa)',
    description: 'Baisse apparente de 22.0 L due à une forte pente routière de 11.5% dans les virages.',
    payload: {
      eventId: 'EVT-CUSUM-CHIFFA-RN1-SLOPE',
      vehicleId: 'veh-semi-00844',
      vehiclePlate: '00844-116-09',
      driverPseudonym: 'CHAUFFEUR_DZ_BLIDA',
      timestamp: new Date().toISOString(),
      location: {
        latitude: 36.3891,
        longitude: 2.7645,
        wilayaCode: 9,
        wilayaName: 'Blida',
        roadName: 'RN1 Traversée des Gorges de la Chiffa',
        roadGradePercent: 11.5,
      },
      telemetry: {
        speedKmh: 0,
        engineRpm: 0,
        ignitionOn: false,
        durationStationarySeconds: 600,
      },
      fuelReading: {
        tankCapacityLiters: 400,
        rawLevelsLiters: [300.0, 278.0],
        tankLengthMeters: 1.6,
        sensorOffsetRatio: 0.25,
      },
      context: {
        nearestNaftalStationKm: 12.0,
        hasLegitimateFuelReceipt: false,
        fuelUnitPriceDzd: NAFTAL_FUEL_PRICES_DZD.GASOIL,
      },
    },
  },
];

export function CusumLegalReportViewer({
  initialReport,
  onClose,
  token,
}: CusumLegalReportViewerProps) {
  const [report, setReport] = useState<BilingualLegalAuditReport | null>(initialReport || null);
  const [activeLanguage, setActiveLanguage] = useState<'fr' | 'ar'>('fr');
  const [selectedPresetIndex, setSelectedPresetIndex] = useState(0);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [copiedHmac, setCopiedHmac] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Évaluation interactive d'un incident en direct
  const handleEvaluatePreset = async (index: number) => {
    setSelectedPresetIndex(index);
    setIsEvaluating(true);
    setErrorMsg(null);
    try {
      const preset = CUSUM_PRESET_INCIDENTS[index];
      const result = await FuelScannerClient.evaluateFuelIncident(preset.payload, token);
      setReport(result);
    } catch (err: any) {
      setErrorMsg(err.message || "Erreur lors de l'évaluation physique de l'incident.");
    } finally {
      setIsEvaluating(false);
    }
  };

  const handleCopyHmac = () => {
    if (!report) return;
    navigator.clipboard.writeText(report.hmacSignature);
    setCopiedHmac(true);
    setTimeout(() => setCopiedHmac(false), 2500);
  };

  const handlePrint = () => {
    window.print();
  };

  const g: PreComputedContextGraphPayload | undefined = report?.preComputedGraph;

  return (
    <div
      style={{
        background: 'var(--df-bg-surface-1)',
        border: '1px solid var(--df-border-subtle)',
        borderRadius: '16px',
        overflow: 'hidden',
        boxShadow: '0 8px 30px rgba(0, 0, 0, 0.4)',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* ── BARRE SUPÉRIEURE : EN-TÊTE ET COMMANDES ── */}
      <div
        style={{
          padding: '16px 20px',
          background: 'var(--df-bg-surface-2)',
          borderBottom: '1px solid var(--df-border-subtle)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '12px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '8px',
              background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '18px',
            }}
          >
            ⚖️
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <h3 style={{ fontSize: '15px', fontWeight: 800, margin: 0, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Greffier Juridique CUSUM &amp; Correction Pente Valhalla
              </h3>
              <span
                style={{
                  fontSize: '10px',
                  fontWeight: 700,
                  padding: '2px 8px',
                  borderRadius: '12px',
                  background: 'rgba(99, 102, 241, 0.15)',
                  color: '#818cf8',
                  border: '1px solid rgba(99, 102, 241, 0.3)',
                }}
              >
                PILIER 1 • PRE-COMPUTED GRAPH
              </span>
            </div>
            <div style={{ fontSize: '11px', color: 'var(--df-text-muted)', marginTop: '2px' }}>
              Procès-verbal contradictoire inattaquable • Conforme Code Pénal Art. 350 &amp; Barème Naftal JORADP
            </div>
          </div>
        </div>

        {/* Boutons d'action rapides */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {/* Bascule de Langue FR / AR */}
          <div
            style={{
              display: 'flex',
              background: '#F1F5F9',
              padding: '2px',
              borderRadius: '8px',
              border: '1px solid #CBD5E1',
              gap: '2px',
            }}
          >
            <button
              onClick={() => setActiveLanguage('fr')}
              style={{
                padding: '5px 12px',
                borderRadius: '6px',
                fontSize: '11px',
                fontWeight: 800,
                cursor: 'pointer',
                border: 'none',
                background: activeLanguage === 'fr' ? '#2563eb' : 'transparent',
                color: activeLanguage === 'fr' ? '#ffffff' : '#334155',
              }}
            >
              🇫🇷 Français
            </button>
            <button
              onClick={() => setActiveLanguage('ar')}
              style={{
                padding: '5px 12px',
                borderRadius: '6px',
                fontSize: '11px',
                fontWeight: 800,
                cursor: 'pointer',
                border: 'none',
                background: activeLanguage === 'ar' ? '#059669' : 'transparent',
                color: activeLanguage === 'ar' ? '#ffffff' : '#334155',
              }}
            >
              🇩🇿 العربية
            </button>
          </div>

          <button
            onClick={handlePrint}
            style={{
              padding: '6px 14px',
              borderRadius: '8px',
              fontSize: '11px',
              fontWeight: 700,
              cursor: 'pointer',
              background: '#F1F5F9',
              color: '#0F172A',
              border: '1px solid #CBD5E1',
            }}
          >
            🖨️ Imprimer PV
          </button>

          {onClose && (
            <button
              onClick={onClose}
              style={{
                background: 'transparent',
                border: 'none',
                color: '#64748B',
                cursor: 'pointer',
                fontSize: '16px',
                padding: '4px',
              }}
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* ── SÉLECTEUR DE SIMULATION & DÉCLENCHEUR D'INCIDENT ── */}
      <div
        style={{
          padding: '12px 20px',
          background: '#F8FAFC',
          borderBottom: '1px solid #E2E8F0',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '10px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '11px', fontWeight: 800, color: '#475569', textTransform: 'uppercase' }}>
            Scénarios Réels :
          </span>
          {CUSUM_PRESET_INCIDENTS.map((preset, idx) => (
            <button
              key={idx}
              onClick={() => handleEvaluatePreset(idx)}
              disabled={isEvaluating}
              style={{
                padding: '6px 14px',
                borderRadius: '6px',
                fontSize: '11px',
                fontWeight: 800,
                cursor: isEvaluating ? 'not-allowed' : 'pointer',
                background: selectedPresetIndex === idx ? '#EFF6FF' : '#FFFFFF',
                color: selectedPresetIndex === idx ? '#1D4ED8' : '#0F172A',
                border: selectedPresetIndex === idx ? '2px solid #2563EB' : '1px solid #CBD5E1',
                boxShadow: selectedPresetIndex === idx ? '0 1px 3px rgba(37,99,235,0.1)' : 'none',
              }}
            >
              {idx === 0 ? '🚨 Siphonnage Djelfa (RN1)' : '🏔️ Fausse Alerte Chiffa (Pente 11.5%)'}
            </button>
          ))}
        </div>

        {isEvaluating && (
          <div style={{ fontSize: '11px', color: '#f59e0b', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span className="animate-spin">⏳</span>
            <span>Calcul géométrique Valhalla &amp; CUSUM en cours (&lt; 20 ms)...</span>
          </div>
        )}
      </div>

      {errorMsg && (
        <div style={{ padding: '10px 20px', background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', fontSize: '12px' }}>
          ⚠️ {errorMsg}
        </div>
      )}

      {/* ── CONTENU DU PROCÈS-VERBAL ── */}
      {report && g ? (
        <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '18px' }}>
          {/* 1. HUD DU PRE-COMPUTED CONTEXT GRAPH (MÉTRIQUES PHYSIQUES) */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
              gap: '12px',
            }}
          >
            {/* Statut Juridique */}
            <div
              style={{
                background: 'var(--df-bg-base)',
                border: `1px solid ${
                  report.status === 'OPPOSABLE_DISCIPLINAIRE'
                    ? 'rgba(239, 68, 68, 0.5)'
                    : 'rgba(16, 185, 129, 0.5)'
                }`,
                borderRadius: '10px',
                padding: '12px',
              }}
            >
              <div style={{ fontSize: '10px', fontWeight: 700, color: 'var(--df-text-muted)', textTransform: 'uppercase' }}>
                Qualification Juridique
              </div>
              <div
                style={{
                  fontSize: '13px',
                  fontWeight: 800,
                  marginTop: '4px',
                  color: report.status === 'OPPOSABLE_DISCIPLINAIRE' ? '#ef4444' : '#10b981',
                }}
              >
                {report.status === 'OPPOSABLE_DISCIPLINAIRE'
                  ? '⚖️ OPPOSABLE DISCIPLINAIRE'
                  : '🛡️ CLASSEMENT SANS SUITE'}
              </div>
              <div style={{ fontSize: '10px', color: 'var(--df-text-secondary)', marginTop: '4px' }}>
                Certitude Physique : {(report.confidenceScore * 100).toFixed(1)}%
              </div>
            </div>

            {/* Baisse Brute Jauge */}
            <div
              style={{
                background: 'var(--df-bg-base)',
                border: '1px solid var(--df-border-subtle)',
                borderRadius: '10px',
                padding: '12px',
              }}
            >
              <div style={{ fontSize: '10px', fontWeight: 700, color: 'var(--df-text-muted)', textTransform: 'uppercase' }}>
                Baisse Brute Mesurée
              </div>
              <div style={{ fontSize: '16px', fontWeight: 800, marginTop: '4px', fontFamily: 'monospace' }}>
                {g.fuelData.rawDropLiters.toFixed(1)} <span style={{ fontSize: '11px', fontWeight: 600 }}>L</span>
              </div>
              <div style={{ fontSize: '10px', color: 'var(--df-text-muted)', marginTop: '4px' }}>
                Capacité réservoir : {g.fuelData.tankCapacityLiters} L
              </div>
            </div>

            {/* Pente Topographique Valhalla */}
            <div
              style={{
                background: 'var(--df-bg-base)',
                border: '1px solid var(--df-border-subtle)',
                borderRadius: '10px',
                padding: '12px',
              }}
            >
              <div style={{ fontSize: '10px', fontWeight: 700, color: 'var(--df-text-muted)', textTransform: 'uppercase' }}>
                Pente Valhalla &amp; Dévers
              </div>
              <div
                style={{
                  fontSize: '16px',
                  fontWeight: 800,
                  marginTop: '4px',
                  fontFamily: 'monospace',
                  color: Math.abs(g.location.roadGradePercent) > 5 ? '#f59e0b' : '#38bdf8',
                }}
              >
                {g.location.roadGradePercent.toFixed(1)}%
              </div>
              <div style={{ fontSize: '10px', color: 'var(--df-text-muted)', marginTop: '4px' }}>
                Correction géom. : -{g.fuelData.slopeCorrectionLiters.toFixed(1)} L
              </div>
            </div>

            {/* Perte Nette Réelle */}
            <div
              style={{
                background: 'var(--df-bg-base)',
                border: '1px solid var(--df-border-subtle)',
                borderRadius: '10px',
                padding: '12px',
              }}
            >
              <div style={{ fontSize: '10px', fontWeight: 700, color: 'var(--df-text-muted)', textTransform: 'uppercase' }}>
                Volume Net Dérobé
              </div>
              <div
                style={{
                  fontSize: '16px',
                  fontWeight: 800,
                  marginTop: '4px',
                  fontFamily: 'monospace',
                  color: g.fuelData.correctedNetDropLiters > 0 ? '#ef4444' : '#10b981',
                }}
              >
                {g.fuelData.correctedNetDropLiters.toFixed(2)} <span style={{ fontSize: '11px', fontWeight: 600 }}>L</span>
              </div>
              <div style={{ fontSize: '10px', color: 'var(--df-text-muted)', marginTop: '4px' }}>
                Après compensation inattaquable
              </div>
            </div>

            {/* Préjudice Financier DZD */}
            <div
              style={{
                background: 'var(--df-bg-base)',
                border: '1px solid var(--df-border-subtle)',
                borderRadius: '10px',
                padding: '12px',
              }}
            >
              <div style={{ fontSize: '10px', fontWeight: 700, color: 'var(--df-text-muted)', textTransform: 'uppercase' }}>
                Préjudice Financier DZD
              </div>
              <div
                style={{
                  fontSize: '16px',
                  fontWeight: 800,
                  marginTop: '4px',
                  fontFamily: 'monospace',
                  color: g.fuelData.directLossDzd > 0 ? '#ef4444' : '#10b981',
                }}
              >
                {g.fuelData.directLossDzd.toLocaleString('fr-DZ')} <span style={{ fontSize: '11px', fontWeight: 600 }}>DZD</span>
              </div>
              <div style={{ fontSize: '10px', color: 'var(--df-text-muted)', marginTop: '4px' }}>
                Tarif Gasoil Naftal : {g.fuelData.fuelPriceDzdPerLiter.toFixed(2)} DA/L
              </div>
            </div>
          </div>

          {/* 2. SCEAU D'INALTÉRABILITÉ CRYPTOGRAPHIQUE HMAC-SHA256 */}
          <div
            style={{
              padding: '10px 14px',
              background: '#090d16',
              border: '1px solid #1e293b',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '10px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '13px' }}>🔒</span>
              <div>
                <span style={{ fontSize: '10px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase' }}>
                  Scellé Numérique HMAC-SHA256 (Inaltérabilité Opposable) :
                </span>
                <span
                  style={{
                    fontSize: '11px',
                    fontFamily: 'monospace',
                    color: '#38bdf8',
                    marginLeft: '8px',
                    wordBreak: 'break-all',
                  }}
                >
                  {report.hmacSignature}
                </span>
              </div>
            </div>

            <button
              onClick={handleCopyHmac}
              style={{
                fontSize: '11px',
                fontWeight: 700,
                padding: '4px 10px',
                borderRadius: '6px',
                background: '#F1F5F9',
                color: '#0F172A',
                border: '1px solid #CBD5E1',
                cursor: 'pointer',
              }}
            >
              {copiedHmac ? '✓ Hash Copié' : 'Copier Sceau'}
            </button>
          </div>

          {/* 3. CORPS DU PROCÈS-VERBAL CONTRADICTOIRE (BILINGUE FR / AR) */}
          <div
            dir={activeLanguage === 'ar' ? 'rtl' : 'ltr'}
            style={{
              background: 'var(--df-bg-base)',
              border: '1px solid var(--df-border-subtle)',
              borderRadius: '12px',
              padding: '24px',
              fontFamily: activeLanguage === 'ar' ? 'Tahoma, Arial, sans-serif' : 'inherit',
              lineHeight: 1.7,
            }}
          >
            {activeLanguage === 'fr' ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ borderBottom: '2px solid #334155', paddingBottom: '12px' }}>
                  <h2 style={{ fontSize: '16px', fontWeight: 800, margin: 0, color: '#f8fafc', letterSpacing: '0.02em' }}>
                    {report.frenchReport.titre}
                  </h2>
                  <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '4px' }}>
                    Identifiant Dossier : {report.reportId} • Émis le {new Date(report.generatedAt).toLocaleString('fr-DZ')}
                  </div>
                </div>

                <div>
                  <h4 style={{ fontSize: '12px', fontWeight: 700, color: '#38bdf8', textTransform: 'uppercase', margin: '0 0 6px 0' }}>
                    I. Préambule Légal &amp; Désignation de l'Équipage
                  </h4>
                  <p style={{ fontSize: '13px', color: '#cbd5e1', margin: 0, whiteSpace: 'pre-wrap' }}>
                    {report.frenchReport.preambule}
                  </p>
                </div>

                <div>
                  <h4 style={{ fontSize: '12px', fontWeight: 700, color: '#38bdf8', textTransform: 'uppercase', margin: '0 0 6px 0' }}>
                    II. Constatations Techniques Télématiques
                  </h4>
                  <p style={{ fontSize: '13px', color: '#cbd5e1', margin: 0, whiteSpace: 'pre-wrap' }}>
                    {report.frenchReport.constatationsTechniques}
                  </p>
                </div>

                <div>
                  <h4 style={{ fontSize: '12px', fontWeight: 700, color: '#38bdf8', textTransform: 'uppercase', margin: '0 0 6px 0' }}>
                    III. Analyse Physique Déterministe &amp; Correction de Dévers Valhalla
                  </h4>
                  <p style={{ fontSize: '13px', color: '#cbd5e1', margin: 0, whiteSpace: 'pre-wrap' }}>
                    {report.frenchReport.analysePhysiqueEtPente}
                  </p>
                </div>

                <div>
                  <h4 style={{ fontSize: '12px', fontWeight: 700, color: '#38bdf8', textTransform: 'uppercase', margin: '0 0 6px 0' }}>
                    IV. Évaluation du Préjudice Financier
                  </h4>
                  <p style={{ fontSize: '13px', color: '#f59e0b', margin: 0, fontWeight: 600, whiteSpace: 'pre-wrap' }}>
                    {report.frenchReport.prejudiceFinancierDzd}
                  </p>
                </div>

                <div>
                  <h4 style={{ fontSize: '12px', fontWeight: 700, color: '#38bdf8', textTransform: 'uppercase', margin: '0 0 6px 0' }}>
                    V. Qualification Juridique Contradictoire
                  </h4>
                  <p style={{ fontSize: '13px', color: '#cbd5e1', margin: 0, whiteSpace: 'pre-wrap' }}>
                    {report.frenchReport.qualificationJuridique}
                  </p>
                </div>

                <div
                  style={{
                    background: 'rgba(30, 41, 59, 0.6)',
                    border: '1px solid #334155',
                    borderRadius: '8px',
                    padding: '14px',
                  }}
                >
                  <h4 style={{ fontSize: '12px', fontWeight: 700, color: '#10b981', textTransform: 'uppercase', margin: '0 0 6px 0' }}>
                    VI. Recommandations Décisionnelles (Arbitrage SAD ➔ ADS)
                  </h4>
                  <p style={{ fontSize: '13px', color: '#e2e8f0', margin: 0, whiteSpace: 'pre-wrap' }}>
                    {report.frenchReport.recommandationDecisionnelle}
                  </p>
                </div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ borderBottom: '2px solid #334155', paddingBottom: '12px' }}>
                  <h2 style={{ fontSize: '17px', fontWeight: 800, margin: 0, color: '#f8fafc' }}>
                    {report.arabicReport.titre}
                  </h2>
                  <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '4px' }}>
                    المرجع الإثباتي : {report.reportId} • حرر بتاريخ {new Date(report.generatedAt).toLocaleDateString('ar-DZ')}
                  </div>
                </div>

                <div>
                  <h4 style={{ fontSize: '13px', fontWeight: 700, color: '#38bdf8', margin: '0 0 6px 0' }}>
                    أولاً : الديباجة القانونية وتحديد المركبة والسائق
                  </h4>
                  <p style={{ fontSize: '13px', color: '#cbd5e1', margin: 0, whiteSpace: 'pre-wrap' }}>
                    {report.arabicReport.preambule}
                  </p>
                </div>

                <div>
                  <h4 style={{ fontSize: '13px', fontWeight: 700, color: '#38bdf8', margin: '0 0 6px 0' }}>
                    ثانياً : المعاينة التقنية الميدانية لبيانات التتبع
                  </h4>
                  <p style={{ fontSize: '13px', color: '#cbd5e1', margin: 0, whiteSpace: 'pre-wrap' }}>
                    {report.arabicReport.constatationsTechniques}
                  </p>
                </div>

                <div>
                  <h4 style={{ fontSize: '13px', fontWeight: 700, color: '#38bdf8', margin: '0 0 6px 0' }}>
                    ثالثاً : التحليل الطبوغرافي وتصحيح ميلان المسار
                  </h4>
                  <p style={{ fontSize: '13px', color: '#cbd5e1', margin: 0, whiteSpace: 'pre-wrap' }}>
                    {report.arabicReport.analysePhysiqueEtPente}
                  </p>
                </div>

                <div>
                  <h4 style={{ fontSize: '13px', fontWeight: 700, color: '#38bdf8', margin: '0 0 6px 0' }}>
                    رابعاً : تقدير الضرر المالي بالدينار الجزائري
                  </h4>
                  <p style={{ fontSize: '13px', color: '#f59e0b', margin: 0, fontWeight: 700, whiteSpace: 'pre-wrap' }}>
                    {report.arabicReport.prejudiceFinancierDzd}
                  </p>
                </div>

                <div>
                  <h4 style={{ fontSize: '13px', fontWeight: 700, color: '#38bdf8', margin: '0 0 6px 0' }}>
                    خامساً : التوصيف القانوني والإداري
                  </h4>
                  <p style={{ fontSize: '13px', color: '#cbd5e1', margin: 0, whiteSpace: 'pre-wrap' }}>
                    {report.arabicReport.qualificationJuridique}
                  </p>
                </div>

                <div
                  style={{
                    background: 'rgba(30, 41, 59, 0.6)',
                    border: '1px solid #334155',
                    borderRadius: '8px',
                    padding: '14px',
                  }}
                >
                  <h4 style={{ fontSize: '13px', fontWeight: 700, color: '#10b981', margin: '0 0 6px 0' }}>
                    سادساً : القرارات الانضباطية والتوصيات التنفيذية
                  </h4>
                  <p style={{ fontSize: '13px', color: '#e2e8f0', margin: 0, whiteSpace: 'pre-wrap' }}>
                    {report.arabicReport.recommandationDecisionnelle}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div style={{ padding: '40px 20px', textAlign: 'center', color: 'var(--df-text-muted)', fontSize: '13px' }}>
          Sélectionnez un scénario d'incident ci-dessus pour générer instantanément le procès-verbal contradictoire scellé.
        </div>
      )}
    </div>
  );
}

