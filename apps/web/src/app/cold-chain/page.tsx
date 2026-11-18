'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useDemoMode } from '../../context/DemoModeContext';
import { Navbar } from '../../components/navigation/Navbar';
import { Button } from '../../components/Button';
import {
  FleetIntelligenceClient,
  ReeferLiveStatus,
  ReeferHaccpCertificate,
  GenerateHaccpCertificateDto,
} from '../../lib/api-fleet-intelligence';
import {
  IconThermometer,
  IconRefreshCw,
} from '../../components/navigation/TechIcons';
import { CalculationProofModal, CalculationProofData } from '../../components/decisions';
import { buildReeferProofData } from '@/components/cold-chain/proof-builder';
import { ColdChainKpiHeader } from '@/components/cold-chain/ColdChainKpiHeader';
import { ReefersTableView, getCargoLabel } from '@/components/cold-chain/ReefersTableView';
import { HaccpCertificatesTableView } from '@/components/cold-chain/HaccpCertificatesTableView';
import { ColdChainModals, CertFormState } from '@/components/cold-chain/ColdChainModals';

export default function ColdChainPage() {
  const { isDemoMode, session } = useDemoMode();
  const [reefers, setReefers] = useState<ReeferLiveStatus[]>([]);
  const [certificates, setCertificates] = useState<ReeferHaccpCertificate[]>([]);
  const [activeTab, setActiveTab] = useState<'fleet' | 'certificates'>('fleet');
  const [isLoading, setIsLoading] = useState(true);
  const [filterCargo, setFilterCargo] = useState<string>('ALL');
  const [activeProof, setActiveProof] = useState<CalculationProofData | null>(null);

  // Modale Certificat
  const [showCertModal, setShowCertModal] = useState(false);
  const [selectedReeferForCert, setSelectedReeferForCert] = useState<ReeferLiveStatus | null>(null);
  const [submittingCert, setSubmittingCert] = useState(false);
  const [certForm, setCertForm] = useState<CertFormState>({
    missionRef: '',
    cargoDescription: '',
    departureWilaya: 6, // Béjaïa
    arrivalWilaya: 31,  // Oran
    departureTime: new Date(Date.now() - 8 * 3600 * 1000).toISOString().slice(0, 16),
  });
  const [selectedCertViewer, setSelectedCertViewer] = useState<ReeferHaccpCertificate | null>(null);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      if (isDemoMode) {
        const { getSimulationColdChainData } = await import('../../lib/simulation-sandbox');
        const demoData = await getSimulationColdChainData();
        setReefers(demoData.reefers);
        setCertificates(demoData.certificates);
      } else {
        const [liveData, certsData] = await Promise.all([
          FleetIntelligenceClient.getColdChainLive(session.token || undefined, false),
          FleetIntelligenceClient.listHaccpCertificates(session.token || undefined).catch(() => []),
        ]);
        setReefers(liveData);
        setCertificates(certsData);
      }
    } catch (err) {
      console.error('Erreur télémétrie chaîne du froid:', err);
    } finally {
      setIsLoading(false);
    }
  }, [session.token, isDemoMode]);

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 30000);
    return () => clearInterval(interval);
  }, [loadData]);

  const filteredReefers = reefers.filter((r) => {
    if (filterCargo === 'ALL') return true;
    return r.cargoType === filterCargo;
  });

  const totalExcursionRiskDzd = reefers.reduce((acc, r) => acc + (r.financialRiskDzd || 0), 0);
  const activeExcursionsCount = reefers.filter((r) => !r.isWithinSafeRange).length;
  const totalMonitoredCargoDzd = reefers.reduce((acc, r) => acc + (r.estimatedCargoValueDzd || 0), 0);

  const handleOpenCertModal = (reefer: ReeferLiveStatus) => {
    setSelectedReeferForCert(reefer);
    setCertForm({
      missionRef: `MIS-${reefer.assetCode}-${new Date().toLocaleDateString('fr-DZ').replace(/\//g, '')}`,
      cargoDescription: `Transport frigorifique sous température dirigée (${getCargoLabel(reefer.cargoType)})`,
      departureWilaya: 6, // Béjaïa
      arrivalWilaya: 31,  // Oran
      departureTime: new Date(Date.now() - 8 * 3600 * 1000).toISOString().slice(0, 16),
    });
    setShowCertModal(true);
  };

  const handleGenerateCertificate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedReeferForCert) return;
    setSubmittingCert(true);
    try {
      if (isDemoMode) {
        const fakeCert: ReeferHaccpCertificate = {
          id: `cert-${Date.now()}`,
          tenantId: 'demo-tenant-id',
          certificateRef: `CERT-HACCP-${new Date().getFullYear()}-${certForm.departureWilaya.toString().padStart(2, '0')}${certForm.arrivalWilaya.toString().padStart(2, '0')}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`,
          reeferUnitId: selectedReeferForCert.reeferUnitId || 'unit-demo',
          assetId: selectedReeferForCert.assetId,
          missionRef: certForm.missionRef,
          cargoType: selectedReeferForCert.cargoType,
          cargoDescription: certForm.cargoDescription,
          departureWilaya: certForm.departureWilaya,
          arrivalWilaya: certForm.arrivalWilaya,
          departureTime: new Date(certForm.departureTime).toISOString(),
          arrivalTime: new Date().toISOString(),
          minTempRecordedC: selectedReeferForCert.isWithinSafeRange
            ? selectedReeferForCert.currentTempC - 0.4
            : 0.5,
          maxTempRecordedC: selectedReeferForCert.isWithinSafeRange
            ? selectedReeferForCert.currentTempC + 0.3
            : selectedReeferForCert.currentTempC,
          averageTempC: selectedReeferForCert.currentTempC,
          totalExcursionMinutes: selectedReeferForCert.excursionDurationMinutes,
          complianceStatus: selectedReeferForCert.isWithinSafeRange
            ? 'CONFORME_HACCP'
            : 'NON_CONFORME_EXCURSION',
          sanitaryVerdict: selectedReeferForCert.isWithinSafeRange
            ? 'LOT CONFORME : Températures maintenues dans les tolérances réglementaires (Arrêté Interministériel du 21 Safar 1414 / DSV). Aucune rupture thermique.'
            : `LOT NON CONFORME : Excursion thermique constatée de ${selectedReeferForCert.excursionDurationMinutes} minutes. Avis vétérinaire obligatoire avant mise sur le marché.`,
          auxiliaryFuelConsumedLiters: 17.6,
          auxiliaryFuelCostDzd: 510.4,
          sha256Hash: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
          createdAt: new Date().toISOString(),
        };
        setCertificates((prev) => [fakeCert, ...prev]);
        setShowCertModal(false);
        setSelectedCertViewer(fakeCert);
      } else {
        const dto: GenerateHaccpCertificateDto = {
          reeferUnitId: selectedReeferForCert.reeferUnitId || selectedReeferForCert.assetId,
          assetId: selectedReeferForCert.assetId,
          missionRef: certForm.missionRef,
          cargoType: selectedReeferForCert.cargoType,
          cargoDescription: certForm.cargoDescription,
          departureWilaya: certForm.departureWilaya,
          arrivalWilaya: certForm.arrivalWilaya,
          departureTime: new Date(certForm.departureTime).toISOString(),
          arrivalTime: new Date().toISOString(),
        };
        const created = await FleetIntelligenceClient.generateHaccpCertificate(
          dto,
          session.token || undefined,
        );
        setCertificates((prev) => [created, ...prev]);
        setShowCertModal(false);
        setSelectedCertViewer(created);
      }
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Erreur génération certificat');
    } finally {
      setSubmittingCert(false);
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        backgroundColor: 'var(--df-bg-base)',
        color: 'var(--df-text-main)',
      }}
    >
      <Navbar />

      <main className="df-container" style={{ paddingTop: '1.5rem', paddingBottom: '3rem' }}>
        {/* EN-TÊTE DE SECTION COCKPIT */}
        <div
          style={{
            borderRadius: 'var(--df-radius-xl)',
            border: '1px solid var(--df-border-subtle)',
            backgroundColor: 'var(--df-bg-surface-1)',
            padding: '1.5rem',
            boxShadow: 'var(--df-shadow-sm)',
            marginBottom: '1.5rem',
          }}
        >
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-5">
            <div className="space-y-2">
              <div className="flex items-center gap-2 flex-wrap">
                <span
                  style={{
                    backgroundColor: 'var(--df-accent-blue-subtle)',
                    color: 'var(--df-accent-blue)',
                    border: '1px solid var(--df-accent-blue)',
                  }}
                  className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold"
                >
                  <IconThermometer size={13} />
                  CHAÎNE DU FROID SOUVERAINE &amp; BI-MOTEURS
                </span>
                <span
                  style={{
                    backgroundColor: 'var(--df-status-ok-bg)',
                    color: 'var(--df-status-ok-text)',
                    border: '1px solid var(--df-status-ok-border)',
                  }}
                  className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold"
                >
                  Carrier Transicold &amp; Thermo King
                </span>
                <span
                  style={{
                    backgroundColor: 'var(--df-bg-surface-2)',
                    color: 'var(--df-text-secondary)',
                    border: '1px solid var(--df-border-subtle)',
                  }}
                  className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-mono"
                >
                  Norme ATP, DSV &amp; HACCP (21 Safar 1414)
                </span>
              </div>
              <h1 className="text-2xl font-black tracking-tight" style={{ color: 'var(--df-text-main)' }}>
                Télémétrie Chaîne du Froid &amp; Groupes Frigo Bi-Moteurs
              </h1>
              <p className="text-sm max-w-3xl" style={{ color: 'var(--df-text-secondary)' }}>
                Surveillance thermique temps réel (produits laitiers, viandes fraîches, insuline, vaccins),
                contrôle du réservoir auxiliaire de gasoil (200 L) et délivrance des certificats officiels DSV avec scellé SHA-256.
              </p>
            </div>

            <div className="flex items-center gap-2.5 shrink-0">
              <Button
                variant="outline"
                size="sm"
                onClick={loadData}
                disabled={isLoading}
                className="gap-2"
              >
                <IconRefreshCw size={13} className={isLoading ? 'animate-spin' : ''} />
                <span>{isLoading ? 'Actualisation...' : 'Actualiser Flux'}</span>
              </Button>
              <Link href="/telematics" className="no-underline">
                <Button variant="primary" size="sm">
                  Cartographie GPS Live &rarr;
                </Button>
              </Link>
            </div>
          </div>
        </div>

        {/* MÉTRIQUES CLÉS CONSOLIDÉES (BENTO KPIS) */}
        <ColdChainKpiHeader
          reefersCount={reefers.length}
          activeExcursionsCount={activeExcursionsCount}
          totalMonitoredCargoDzd={totalMonitoredCargoDzd}
          totalExcursionRiskDzd={totalExcursionRiskDzd}
        />

        {/* ONGLETS DE NAVIGATION */}
        <div className="flex border-b border-[var(--df-border-subtle)] gap-2 mb-6">
          <button
            onClick={() => setActiveTab('fleet')}
            className={`px-4 py-3 text-sm font-semibold border-b-2 transition-all ${
              activeTab === 'fleet'
                ? 'border-[var(--df-brand-primary)] text-[var(--df-brand-primary)]'
                : 'border-transparent text-[var(--df-text-muted)] hover:text-[var(--df-text-main)]'
            }`}
          >
            Flotte Frigorifique Connectée ({reefers.length})
          </button>
          <button
            onClick={() => setActiveTab('certificates')}
            className={`px-4 py-3 text-sm font-semibold border-b-2 transition-all ${
              activeTab === 'certificates'
                ? 'border-[var(--df-brand-primary)] text-[var(--df-brand-primary)]'
                : 'border-transparent text-[var(--df-text-muted)] hover:text-[var(--df-text-main)]'
            }`}
          >
            Certificats Sanitaires HACCP &amp; DSV ({certificates.length})
          </button>
        </div>

        {/* CONTENU ONGLET 1 : FLOTTE FRIGORIFIQUE */}
        {activeTab === 'fleet' && (
          <ReefersTableView
            reefers={reefers}
            filteredReefers={filteredReefers}
            filterCargo={filterCargo}
            onFilterCargoChange={setFilterCargo}
            onShowThermotraceProof={(reefer) => setActiveProof(buildReeferProofData(reefer))}
            onOpenCertModal={handleOpenCertModal}
          />
        )}

        {/* CONTENU ONGLET 2 : CERTIFICATS SANITAIRES HACCP */}
        {activeTab === 'certificates' && (
          <HaccpCertificatesTableView
            certificates={certificates}
            onSelectCertificate={setSelectedCertViewer}
          />
        )}

        {/* MODALES D'ÉMISSION ET DE CONSULTATION DES CERTIFICATS */}
        <ColdChainModals
          showCertModal={showCertModal}
          onCloseCertModal={() => setShowCertModal(false)}
          selectedReeferForCert={selectedReeferForCert}
          certForm={certForm}
          onCertFormChange={setCertForm}
          onSubmitCertificate={handleGenerateCertificate}
          submittingCert={submittingCert}
          selectedCertViewer={selectedCertViewer}
          onCloseCertViewer={() => setSelectedCertViewer(null)}
        />

        {/* MODALE DE PREUVE DÉCISIONNELLE THERMOTRACE */}
        <CalculationProofModal
          isOpen={!!activeProof}
          onClose={() => setActiveProof(null)}
          data={activeProof}
        />
      </main>
    </div>
  );
}
