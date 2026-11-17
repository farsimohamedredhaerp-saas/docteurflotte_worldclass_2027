'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useDemoMode } from '../../context/DemoModeContext';
import { Navbar } from '../../components/navigation/Navbar';
import { Badge } from '../../components/Badge';
import { Button } from '../../components/Button';
import {
  FleetIntelligenceClient,
  ReeferLiveStatus,
  ReeferCargoType,
  ReeferPowerMode,
  ReeferHaccpCertificate,
  GenerateHaccpCertificateDto,
} from '../../lib/api-fleet-intelligence';
import {
  IconThermometer,
  IconTruck,
  IconAlertTriangle,
  IconBox,
  IconShieldCheck,
  IconLock,
  IconFileText,
  IconRefreshCw,
  IconZap,
  IconFuel,
  IconPlus,
  IconCheck,
  IconX,
} from '../../components/navigation/TechIcons';
import { CalculationProofModal, CalculationProofData } from '../../components/decisions';
import { VehicleSilhouette } from '../../components/ui/VehicleSilhouette';
import { formatCurrency } from '../../lib/currency-formatter';

function buildReeferProofData(reefer: ReeferLiveStatus): CalculationProofData {
  const isAlert = !reefer.isWithinSafeRange;
  return {
    title: `Rapport Thermotrace & Conformité Chaîne du Froid — ${reefer.assetCode}`,
    decisionOrMetricName: `Contrôle Thermique ${reefer.cargoType} (${reefer.currentTempC > 0 ? `+${reefer.currentTempC}` : reefer.currentTempC}°C)`,
    category: 'REGULATORY',
    ruleId: `HACCP-ATP-${reefer.assetCode}`,
    legalOrOemReference:
      'Arrêté Interministériel du 21 Safar 1414 / Norme Sanitaire Vétérinaire DSV & Agrément ATP',
    deterministicFormula: 'ΔT = |T_mesuré - T_consigne| ≤ Seuil_ATP_HACCP',
    formulaExplanation: `La chaîne du froid pour la cargaison ${reefer.cargoType} impose une plage de consigne stricte (+${reefer.setpointTempC}°C). En cas d'excursion thermique (ΔT > seuil), la cinétique d'échauffement génère un risque financier immédiat de dépréciation (${formatCurrency(reefer.estimatedCargoValueDzd)}).`,
    variables: [
      {
        name: 'Température Relevée Frigo',
        symbol: 'T_mesuré',
        value: `${reefer.currentTempC}°C`,
        source: 'Sonde BLE Haute Fréquence (Calibrée)',
      },
      {
        name: 'Consigne Réglementaire',
        symbol: 'T_consigne',
        value: `+${reefer.setpointTempC}°C`,
        source: 'Barème HACCP / ATP Algérie',
      },
      {
        name: 'Écart de Température',
        symbol: 'ΔT',
        value: `${reefer.tempDeltaC}°C`,
        source: 'Calcul différentiel temps réel',
      },
      {
        name: 'Réservoir Groupe Frigo (200L)',
        symbol: 'Aux_Fuel',
        value: `${reefer.auxiliaryFuelLevelLiters ?? 180} L (${reefer.auxiliaryFuelLevelPct ?? 90}%)`,
        source: 'Jauge capacitive cuve auxiliaire Carrier/Thermo King',
      },
      {
        name: 'Capteur Porte Caisse',
        symbol: 'Door_Sensor',
        value: reefer.doorOpen ? 'OUVERTE (Déperdition)' : 'Fermée & Étanche',
        source: 'Capteur magnétique IoT Traccar',
      },
      {
        name: 'Mode Alimentation',
        symbol: 'Power_Mode',
        value: reefer.powerMode,
        source: 'Micro-contrôleur Thermo King / Carrier',
      },
      {
        name: 'Valeur Cargaison Assurée',
        symbol: 'Cargo_DZD',
        value: formatCurrency(reefer.estimatedCargoValueDzd),
        source: 'Bordereau de livraison & Déclaration DGI',
      },
    ],
    steps: [
      {
        stepNumber: 1,
        description: 'Vérification de la plage de température admissible',
        formula: 'SafeRange_Min ≤ T_mesuré ≤ SafeRange_Max',
        calculation: `${reefer.currentTempC}°C comparé à la consigne +${reefer.setpointTempC}°C`,
        intermediateResult: isAlert ? 'EXCURSION THERMIQUE DÉTECTÉE' : 'CONFORME À LA PLAGE',
      },
      {
        stepNumber: 2,
        description: 'Évaluation de la cinétique de dépréciation marchande',
        formula: 'Risque_DZD = Cargo_DZD × f(ΔT, Durée_Excursion)',
        calculation: isAlert
          ? `${formatCurrency(reefer.estimatedCargoValueDzd)} × Excursion ${reefer.excursionDurationMinutes} min`
          : 'Aucune dépréciation (température dans la norme)',
        intermediateResult: isAlert
          ? `${formatCurrency(reefer.financialRiskDzd)} de risque de perte`
          : '0 DZD de perte financière',
      },
    ],
    finalResult: {
      label: 'Verdict Sanitaire & Réglementaire DSV',
      value: isAlert ? 'RUPTURE DE CHAÎNE DU FROID' : 'LOT CERTIFIÉ CONFORME HACCP',
      conclusion: isAlert
        ? `Alerte active : Excursion de ${reefer.tempDeltaC}°C depuis ${reefer.excursionDurationMinutes} min. Risque financier chiffré à ${formatCurrency(reefer.financialRiskDzd)}. Intervention immédiate requise.`
        : `Température nominale (+${reefer.setpointTempC}°C). Aucune rupture thermique. Traçabilité conforme pour transport agro-alimentaire et pharmaceutique.`,
    },
  };
}

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
  const [certForm, setCertForm] = useState({
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

  const getCargoLabel = (cargo: ReeferCargoType) => {
    switch (cargo) {
      case ReeferCargoType.DAIRY:
        return 'Lait & Produits Laitiers (+2°C / +4.5°C)';
      case ReeferCargoType.FRESH_MEAT:
        return 'Viandes Fraîches (0°C / +2.5°C)';
      case ReeferCargoType.FROZEN:
        return 'Surgelés (-25°C / -18°C)';
      case ReeferCargoType.PHARMA:
        return 'Pharmacie & Vaccins (+2°C / +8°C)';
      case ReeferCargoType.PRODUCE:
        return 'Fruits & Légumes (+6°C / +12°C)';
      default:
        return cargo;
    }
  };

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
                  CHAÎNE DU FROID SOUVERAINE & BI-MOTEURS
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
                  Cartographie GPS Live →
                </Button>
              </Link>
            </div>
          </div>
        </div>

        {/* MÉTRIQUES CLÉS CONSOLIDÉES (BENTO KPIS) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4" style={{ marginBottom: '1.5rem' }}>
          <div
            style={{
              borderRadius: 'var(--df-radius-xl)',
              border: '1px solid var(--df-border-subtle)',
              backgroundColor: 'var(--df-bg-surface-1)',
              padding: '1.25rem',
              boxShadow: 'var(--df-shadow-sm)',
            }}
            className="space-y-1"
          >
            <div className="flex items-center justify-between" style={{ color: 'var(--df-text-muted)' }}>
              <span className="text-[11px] font-bold uppercase tracking-wider">Groupes Connectés</span>
              <IconTruck size={16} />
            </div>
            <div className="text-3xl font-black font-mono mt-1" style={{ color: 'var(--df-text-main)' }}>
              {reefers.length}
            </div>
            <div className="text-xs" style={{ color: 'var(--df-text-muted)' }}>
              Caisses frigorifiques télémétrie active
            </div>
          </div>

          <div
            style={{
              borderRadius: 'var(--df-radius-xl)',
              border:
                activeExcursionsCount > 0
                  ? '1px solid var(--df-status-danger-border)'
                  : '1px solid var(--df-border-subtle)',
              backgroundColor:
                activeExcursionsCount > 0
                  ? 'var(--df-status-danger-bg)'
                  : 'var(--df-bg-surface-1)',
              padding: '1.25rem',
              boxShadow: 'var(--df-shadow-sm)',
            }}
            className="space-y-1"
          >
            <div className="flex items-center justify-between">
              <span
                style={{
                  color:
                    activeExcursionsCount > 0
                      ? 'var(--df-status-danger-text)'
                      : 'var(--df-text-muted)',
                }}
                className="text-[11px] font-bold uppercase tracking-wider"
              >
                Excursions Thermiques
              </span>
              <IconAlertTriangle
                size={16}
                style={{
                  color:
                    activeExcursionsCount > 0
                      ? 'var(--df-status-danger)'
                      : 'var(--df-text-muted)',
                }}
              />
            </div>
            <div
              className="text-3xl font-black font-mono mt-1"
              style={{
                color:
                  activeExcursionsCount > 0
                    ? 'var(--df-status-danger)'
                    : 'var(--df-status-ok)',
              }}
            >
              {activeExcursionsCount}
            </div>
            <div
              className="text-xs"
              style={{
                color:
                  activeExcursionsCount > 0
                    ? 'var(--df-status-danger-text)'
                    : 'var(--df-text-muted)',
              }}
            >
              {activeExcursionsCount > 0
                ? 'Ruptures thermiques en cours !'
                : '100% dans la plage réglementaire'}
            </div>
          </div>

          <div
            style={{
              borderRadius: 'var(--df-radius-xl)',
              border: '1px solid var(--df-border-subtle)',
              backgroundColor: 'var(--df-bg-surface-1)',
              padding: '1.25rem',
              boxShadow: 'var(--df-shadow-sm)',
            }}
            className="space-y-1"
          >
            <div className="flex items-center justify-between" style={{ color: 'var(--df-text-muted)' }}>
              <span className="text-[11px] font-bold uppercase tracking-wider">Valeur Fret Sous Froid</span>
              <IconBox size={16} />
            </div>
            <div className="text-3xl font-black font-mono mt-1" style={{ color: 'var(--df-text-main)' }}>
              {formatCurrency(totalMonitoredCargoDzd)}
            </div>
            <div className="text-xs" style={{ color: 'var(--df-text-muted)' }}>
              Cargaisons sous température dirigée
            </div>
          </div>

          <div
            style={{
              borderRadius: 'var(--df-radius-xl)',
              border:
                totalExcursionRiskDzd > 0
                  ? '1px solid var(--df-status-warning-border)'
                  : '1px solid var(--df-border-subtle)',
              backgroundColor:
                totalExcursionRiskDzd > 0
                  ? 'var(--df-status-warning-bg)'
                  : 'var(--df-bg-surface-1)',
              padding: '1.25rem',
              boxShadow: 'var(--df-shadow-sm)',
            }}
            className="space-y-1"
          >
            <div className="flex items-center justify-between">
              <span
                style={{
                  color:
                    totalExcursionRiskDzd > 0
                      ? 'var(--df-status-warning-text)'
                      : 'var(--df-text-muted)',
                }}
                className="text-[11px] font-bold uppercase tracking-wider"
              >
                Risque Financier Actuel
              </span>
              <IconShieldCheck
                size={16}
                style={{
                  color:
                    totalExcursionRiskDzd > 0
                      ? 'var(--df-status-warning)'
                      : 'var(--df-text-muted)',
                }}
              />
            </div>
            <div
              className="text-3xl font-black font-mono mt-1"
              style={{
                color:
                  totalExcursionRiskDzd > 0
                    ? 'var(--df-status-warning)'
                    : 'var(--df-status-ok)',
              }}
            >
              {formatCurrency(totalExcursionRiskDzd)}
            </div>
            <div
              className="text-xs"
              style={{
                color:
                  totalExcursionRiskDzd > 0
                    ? 'var(--df-status-warning-text)'
                    : 'var(--df-text-muted)',
              }}
            >
              {totalExcursionRiskDzd > 0 ? 'Dépréciation financière en cours' : 'Zéro perte constatée'}
            </div>
          </div>
        </div>

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
          <div className="space-y-6">
            {/* BARRE DE FILTRES ET CONTRÔLES */}
            <div
              style={{
                borderRadius: 'var(--df-radius-xl)',
                border: '1px solid var(--df-border-subtle)',
                backgroundColor: 'var(--df-bg-surface-1)',
                padding: '1rem',
                boxShadow: 'var(--df-shadow-sm)',
              }}
              className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3"
            >
              <div className="flex items-center gap-3 flex-wrap">
                <span
                  className="text-xs font-bold uppercase tracking-wider"
                  style={{ color: 'var(--df-text-muted)' }}
                >
                  Filtrer par Denrée :
                </span>
                <div className="flex items-center gap-1.5 flex-wrap">
                  {[
                    { id: 'ALL', label: 'Toutes' },
                    { id: ReeferCargoType.DAIRY, label: 'Lait & Laitiers' },
                    { id: ReeferCargoType.FRESH_MEAT, label: 'Viandes Fraîches' },
                    { id: ReeferCargoType.PHARMA, label: 'Pharmacie' },
                    { id: ReeferCargoType.FROZEN, label: 'Surgelés' },
                  ].map((c) => {
                    const isSel = filterCargo === c.id;
                    return (
                      <button
                        key={c.id}
                        onClick={() => setFilterCargo(c.id)}
                        style={{
                          backgroundColor: isSel ? 'var(--df-accent-blue-subtle)' : 'transparent',
                          color: isSel ? 'var(--df-accent-blue)' : 'var(--df-text-secondary)',
                          border: isSel ? '1px solid var(--df-accent-blue)' : '1px solid transparent',
                          fontWeight: isSel ? 700 : 500,
                          borderRadius: 'var(--df-radius-md)',
                          padding: '0.35rem 0.75rem',
                          fontSize: '0.75rem',
                          cursor: 'pointer',
                        }}
                      >
                        {c.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="flex items-center gap-1.5 text-xs" style={{ color: 'var(--df-text-secondary)' }}>
                <IconShieldCheck size={14} style={{ color: 'var(--df-status-ok)' }} className="shrink-0" />
                <span>Protocole certifié HACCP &amp; Direction des Services Vétérinaires (DSV)</span>
              </div>
            </div>

            {/* GRILLE DES GROUPES FRIGORIFIQUES */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredReefers.length === 0 ? (
                <div
                  style={{
                    borderRadius: 'var(--df-radius-xl)',
                    border: '1px solid var(--df-border-subtle)',
                    backgroundColor: 'var(--df-bg-surface-1)',
                    padding: '4rem 1rem',
                    textAlign: 'center',
                    boxShadow: 'var(--df-shadow-sm)',
                  }}
                  className="col-span-full"
                >
                  <div
                    style={{
                      backgroundColor: 'var(--df-accent-blue-subtle)',
                      color: 'var(--df-accent-blue)',
                      width: '48px',
                      height: '48px',
                      borderRadius: 'var(--df-radius-lg)',
                    }}
                    className="inline-flex items-center justify-center mb-3"
                  >
                    <IconThermometer size={24} />
                  </div>
                  <h3 className="text-base font-bold mb-1" style={{ color: 'var(--df-text-main)' }}>
                    {reefers.length === 0
                      ? 'Aucun groupe frigorifique surveillé'
                      : 'Aucun groupe ne correspond à cette denrée'}
                  </h3>
                  <p className="text-xs max-w-md mx-auto mb-4" style={{ color: 'var(--df-text-muted)' }}>
                    {reefers.length === 0
                      ? 'Votre parc ne comporte aucun groupe frigorifique actif. Basculez en mode démo pour tester la surveillance ATP et HACCP.'
                      : 'Modifiez le filtre de cargaison sélectionné.'}
                  </p>
                </div>
              ) : (
                filteredReefers.map((reefer) => {
                  const isAlert = !reefer.isWithinSafeRange;
                  const auxFuel = reefer.auxiliaryFuelLevelLiters ?? 160;
                  const auxCap = reefer.auxiliaryTankCapacityLiters ?? 200;
                  const auxPct = Math.round((auxFuel / auxCap) * 100);

                  return (
                    <div
                      key={reefer.assetId}
                      style={{
                        borderRadius: 'var(--df-radius-xl)',
                        border: isAlert
                          ? '1px solid var(--df-status-danger-border)'
                          : '1px solid var(--df-border-subtle)',
                        backgroundColor: isAlert
                          ? 'var(--df-status-danger-bg)'
                          : 'var(--df-bg-surface-1)',
                        padding: '1.5rem',
                        boxShadow: 'var(--df-shadow-sm)',
                      }}
                      className="space-y-4 transition-all flex flex-col justify-between"
                    >
                      <div className="space-y-3">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-start gap-3">
                            <div className="mt-0.5 text-[var(--df-text-secondary)] opacity-85 shrink-0">
                              <VehicleSilhouette
                                category={
                                  reefer.assetName.toLowerCase().includes('master')
                                    ? 'LIGHT_COMMERCIAL'
                                    : 'HEAVY_TRUCK'
                                }
                                size="sm"
                              />
                            </div>
                            <div>
                              <span
                                style={{
                                  backgroundColor: 'var(--df-bg-surface-2)',
                                  color: 'var(--df-text-secondary)',
                                  borderRadius: 'var(--df-radius-xs)',
                                  border: '1px solid var(--df-border-subtle)',
                                }}
                                className="font-mono text-xs font-bold px-2 py-0.5"
                              >
                                {reefer.assetCode}
                              </span>
                              <h3
                                className="text-base font-black mt-1.5"
                                style={{ color: 'var(--df-text-main)' }}
                              >
                                {reefer.assetName}
                              </h3>
                              <p className="text-xs mt-0.5" style={{ color: 'var(--df-text-muted)' }}>
                                {getCargoLabel(reefer.cargoType)}
                              </p>
                            </div>
                          </div>

                          <Badge variant={isAlert ? 'danger' : 'ok'} pulse>
                            {isAlert ? 'ALERTE RUPTURE' : 'TEMP CONFORME'}
                          </Badge>
                        </div>

                        {/* CADRAN DIGITAL DE TEMPÉRATURE TÉLÉMÉTRIQUE */}
                        <div
                          style={{
                            borderRadius: 'var(--df-radius-md)',
                            border: isAlert
                              ? '1px solid var(--df-status-danger-border)'
                              : '1px solid var(--df-border-subtle)',
                            backgroundColor: isAlert
                              ? 'var(--df-status-danger-bg)'
                              : 'var(--df-bg-surface-2)',
                            padding: '1.25rem',
                            textAlign: 'center',
                          }}
                          className="space-y-1"
                        >
                          <span
                            className="text-[10px] font-bold uppercase tracking-wider block"
                            style={{ color: 'var(--df-text-muted)' }}
                          >
                            Température de Reprise Frigo
                          </span>
                          <div className="flex items-baseline justify-center gap-1">
                            <span
                              className="text-4xl font-black font-mono tracking-tight"
                              style={{
                                color: isAlert ? 'var(--df-status-danger)' : 'var(--df-status-ok)',
                              }}
                            >
                              {reefer.currentTempC > 0 ? `+${reefer.currentTempC}` : reefer.currentTempC}
                            </span>
                            <span className="text-base font-bold" style={{ color: 'var(--df-text-muted)' }}>
                              °C
                            </span>
                          </div>

                          <div className="text-xs pt-1" style={{ color: 'var(--df-text-secondary)' }}>
                            Consigne :{' '}
                            <strong className="font-mono" style={{ color: 'var(--df-text-main)' }}>
                              +{reefer.setpointTempC}°C
                            </strong>{' '}
                            (Écart : <span className="font-mono">{reefer.tempDeltaC}°C</span>)
                          </div>
                        </div>

                        {/* RÉSERVOIR CARBURANT DÉDIÉ GROUPE (BI-MOTEUR) */}
                        <div
                          style={{
                            borderRadius: 'var(--df-radius-md)',
                            backgroundColor: 'var(--df-bg-surface-2)',
                            padding: '0.75rem 1rem',
                            border: '1px solid var(--df-border-subtle)',
                          }}
                          className="space-y-1.5"
                        >
                          <div className="flex justify-between items-center text-xs">
                            <span
                              className="font-semibold flex items-center gap-1.5"
                              style={{ color: 'var(--df-text-main)' }}
                            >
                              <IconFuel size={14} className="text-amber-500" />
                              Réservoir Frigo Dédié (Gasoil) :
                            </span>
                            <span className="font-mono font-bold" style={{ color: 'var(--df-text-main)' }}>
                              {auxFuel} L / {auxCap} L ({auxPct}%)
                            </span>
                          </div>
                          <div className="w-full h-2 rounded-full bg-[var(--df-bg-base)] overflow-hidden border border-[var(--df-border-subtle)]">
                            <div
                              className={`h-full transition-all ${
                                auxPct <= 20 ? 'bg-red-500' : 'bg-amber-500'
                              }`}
                              style={{ width: `${auxPct}%` }}
                            />
                          </div>
                          {reefer.atpCertificateNumber && (
                            <div className="flex justify-between text-[11px] text-[var(--df-text-muted)] pt-0.5">
                              <span>Agrément ATP: {reefer.atpCertificateNumber}</span>
                              <span>Exp: {reefer.atpExpiryDate || '2027'}</span>
                            </div>
                          )}
                        </div>

                        {/* DÉTAILS TECHNIQUES & CAPTEURS IOT */}
                        <div
                          className="space-y-2 pt-2 border-t text-xs"
                          style={{ borderColor: 'var(--df-border-subtle)' }}
                        >
                          <div className="flex justify-between items-center">
                            <span style={{ color: 'var(--df-text-muted)' }}>Capteur Porte Caisse :</span>
                            <span
                              style={{
                                color: reefer.doorOpen ? 'var(--df-status-danger)' : 'var(--df-status-ok)',
                              }}
                              className="font-semibold inline-flex items-center gap-1.5"
                            >
                              {reefer.doorOpen ? (
                                <>
                                  <IconAlertTriangle size={12} />
                                  <span>Ouverte (Déperdition)</span>
                                </>
                              ) : (
                                <>
                                  <IconLock size={12} />
                                  <span>Fermée &amp; Étanche</span>
                                </>
                              )}
                            </span>
                          </div>

                          <div className="flex justify-between items-center">
                            <span style={{ color: 'var(--df-text-muted)' }}>Alimentation Groupe :</span>
                            <span
                              className="font-semibold inline-flex items-center gap-1.5"
                              style={{ color: 'var(--df-text-main)' }}
                            >
                              {reefer.powerMode === ReeferPowerMode.DIESEL ? (
                                <>
                                  <IconFuel size={12} style={{ color: 'var(--df-status-warning)' }} />
                                  <span>Moteur Diesel Autonome</span>
                                </>
                              ) : reefer.powerMode === ReeferPowerMode.ELECTRIC_STANDBY ? (
                                <>
                                  <IconZap size={12} style={{ color: 'var(--df-accent-blue)' }} />
                                  <span>Prise Secteur 380V (Dépôt)</span>
                                </>
                              ) : (
                                <span>Arrêt</span>
                              )}
                            </span>
                          </div>

                          <div className="flex justify-between items-center">
                            <span style={{ color: 'var(--df-text-muted)' }}>Valeur Cargaison :</span>
                            <span className="font-mono font-bold" style={{ color: 'var(--df-text-main)' }}>
                              {formatCurrency(reefer.estimatedCargoValueDzd)}
                            </span>
                          </div>

                          {isAlert && (
                            <div
                              style={{
                                borderRadius: 'var(--df-radius-sm)',
                                backgroundColor: 'var(--df-status-danger-bg)',
                                border: '1px solid var(--df-status-danger-border)',
                                color: 'var(--df-status-danger-text)',
                                padding: '0.75rem',
                              }}
                              className="text-xs space-y-1"
                            >
                              <div className="font-bold flex items-center gap-1.5">
                                <IconAlertTriangle
                                  size={13}
                                  style={{ color: 'var(--df-status-danger)' }}
                                  className="shrink-0"
                                />
                                <span>Risque financier direct de dépréciation</span>
                              </div>
                              <div className="text-[11px]" style={{ opacity: 0.9 }}>
                                Excursion depuis :{' '}
                                <strong className="font-mono">{reefer.excursionDurationMinutes} minutes</strong>
                              </div>
                              <div className="text-[11px]" style={{ opacity: 0.9 }}>
                                Pertes estimées :{' '}
                                <strong className="font-mono text-xs">
                                  {formatCurrency(reefer.financialRiskDzd)}
                                </strong>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* PIED DE CARTE & ACTIONS */}
                      <div
                        className="pt-3 border-t flex flex-col gap-2 text-xs"
                        style={{ borderColor: 'var(--df-border-subtle)' }}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-mono text-[11px]" style={{ color: 'var(--df-text-muted)' }}>
                            Relevé : {new Date(reefer.lastUpdate).toLocaleTimeString('fr-DZ')}
                          </span>
                          <button
                            type="button"
                            onClick={() => setActiveProof(buildReeferProofData(reefer))}
                            style={{ color: 'var(--df-accent-blue)' }}
                            className="inline-flex items-center gap-1 font-bold hover:underline cursor-pointer"
                          >
                            <IconFileText size={13} />
                            <span>Preuve Thermotrace</span>
                          </button>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleOpenCertModal(reefer)}
                          className="w-full inline-flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-xs font-semibold bg-[var(--df-bg-surface-2)] border border-[var(--df-border-subtle)] text-[var(--df-text-main)] hover:bg-[var(--df-brand-primary)] hover:text-white transition-all"
                        >
                          <IconShieldCheck size={14} className="text-emerald-500" />
                          <span>Délivrer Certificat Sanitaire HACCP / DSV</span>
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* CONTENU ONGLET 2 : CERTIFICATS SANITAIRES HACCP */}
        {activeTab === 'certificates' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h2 className="text-lg font-bold text-[var(--df-text-main)] flex items-center gap-2">
                  <IconShieldCheck size={20} className="text-emerald-500" />
                  Certificats Sanitaires de Traçabilité Thermique &amp; ATP
                </h2>
                <p className="text-xs text-[var(--df-text-muted)]">
                  Documents juridiques et sanitaires scellés par empreinte cryptographique SHA-256,
                  opposables à la Direction des Services Vétérinaires (DSV) et aux compagnies d’assurance.
                </p>
              </div>
            </div>

            {certificates.length === 0 ? (
              <div className="text-center py-16 border border-dashed border-[var(--df-border-subtle)] rounded-2xl space-y-3">
                <IconFileText size={36} className="mx-auto text-[var(--df-text-muted)] opacity-60" />
                <p className="text-base font-semibold text-[var(--df-text-main)]">
                  Aucun certificat HACCP émis pour le moment
                </p>
                <p className="text-xs text-[var(--df-text-muted)] max-w-md mx-auto">
                  Générez un certificat officiel de fin de mission depuis l’onglet flotte frigorifique.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto rounded-2xl border border-[var(--df-border-subtle)] bg-[var(--df-bg-surface-1)]">
                <table className="w-full text-left text-sm">
                  <thead className="border-b border-[var(--df-border-subtle)] text-xs uppercase text-[var(--df-text-muted)] font-semibold bg-[var(--df-bg-base)]">
                    <tr>
                      <th className="py-3 px-4">Réf. Certificat</th>
                      <th className="py-3 px-4">Trajet (Wilayas)</th>
                      <th className="py-3 px-4">Cargaison</th>
                      <th className="py-3 px-4 text-center">Températures (Min/Moy/Max)</th>
                      <th className="py-3 px-4 text-right">Carburant Groupe Auxiliaire</th>
                      <th className="py-3 px-4 text-center">Verdict Sanitaire</th>
                      <th className="py-3 px-4 text-center">Scellé SHA-256</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--df-border-subtle)]">
                    {certificates.map((cert) => (
                      <tr
                        key={cert.id}
                        className="hover:bg-[var(--df-bg-surface-2)] transition-colors cursor-pointer"
                        onClick={() => setSelectedCertViewer(cert)}
                      >
                        <td className="py-3 px-4">
                          <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
                            {cert.certificateRef}
                          </span>
                          <div className="text-[10px] text-[var(--df-text-muted)]">
                            {new Date(cert.departureTime).toLocaleDateString('fr-DZ')}
                          </div>
                        </td>
                        <td className="py-3 px-4 text-xs">
                          <span className="font-semibold text-[var(--df-text-main)]">
                            Wilaya {cert.departureWilaya.toString().padStart(2, '0')} → Wilaya{' '}
                            {cert.arrivalWilaya.toString().padStart(2, '0')}
                          </span>
                          <div className="text-[10px] text-[var(--df-text-muted)]">
                            {cert.missionRef || 'Mission Régulière'}
                          </div>
                        </td>
                        <td className="py-3 px-4 text-xs">
                          <span className="font-semibold">{cert.cargoType}</span>
                          <div className="text-[11px] text-[var(--df-text-muted)] line-clamp-1">
                            {cert.cargoDescription}
                          </div>
                        </td>
                        <td className="py-3 px-4 text-center font-mono text-xs">
                          <span className="text-blue-500">+{cert.minTempRecordedC}°C</span> /{' '}
                          <span className="font-bold">+{cert.averageTempC}°C</span> /{' '}
                          <span className="text-red-500">+{cert.maxTempRecordedC}°C</span>
                        </td>
                        <td className="py-3 px-4 text-right text-xs">
                          <div className="font-mono font-bold">
                            {cert.auxiliaryFuelConsumedLiters} L
                          </div>
                          <div className="text-[10px] text-[var(--df-text-muted)]">
                            {formatCurrency(cert.auxiliaryFuelCostDzd)}
                          </div>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span
                            className={`px-2 py-0.5 rounded text-xs font-semibold ${
                              cert.complianceStatus === 'CONFORME_HACCP'
                                ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30'
                                : 'bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/30'
                            }`}
                          >
                            {cert.complianceStatus === 'CONFORME_HACCP'
                              ? 'CONFORME DSV'
                              : 'NON CONFORME'}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span
                            title={cert.sha256Hash}
                            className="inline-flex items-center gap-1 font-mono text-[10px] text-[var(--df-text-muted)] px-1.5 py-0.5 rounded bg-[var(--df-bg-base)] border border-[var(--df-border-subtle)]"
                          >
                            <IconShieldCheck size={12} className="text-emerald-500" />
                            {cert.sha256Hash.slice(0, 8)}…
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* MODALE D'ÉMISSION DE CERTIFICAT SANITAIRE HACCP */}
        {showCertModal && selectedReeferForCert && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-[var(--df-bg-surface-1)] border border-[var(--df-border-subtle)] rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-xl">
              <div className="flex items-center justify-between border-b border-[var(--df-border-subtle)] pb-3">
                <h3 className="text-base font-bold text-[var(--df-text-main)] flex items-center gap-2">
                  <IconShieldCheck size={18} className="text-emerald-500" />
                  Délivrance de Certificat Sanitaire HACCP / DSV
                </h3>
                <button
                  onClick={() => setShowCertModal(false)}
                  className="text-[var(--df-text-muted)] hover:text-[var(--df-text-main)]"
                >
                  <IconX size={18} />
                </button>
              </div>

              <form onSubmit={handleGenerateCertificate} className="space-y-4 text-xs">
                <div className="p-3 rounded-xl bg-[var(--df-bg-surface-2)] border border-[var(--df-border-subtle)] space-y-1">
                  <div className="font-semibold text-[var(--df-text-main)]">
                    {selectedReeferForCert.assetCode} — {selectedReeferForCert.assetName}
                  </div>
                  <div className="text-[11px] text-[var(--df-text-muted)]">
                    Cargaison: {selectedReeferForCert.cargoType} • Température actuelle:{' '}
                    {selectedReeferForCert.currentTempC}°C (Consigne: +{selectedReeferForCert.setpointTempC}°C)
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-[var(--df-text-main)]">
                    Référence Mission / Bon de Livraison *
                  </label>
                  <input
                    required
                    type="text"
                    value={certForm.missionRef}
                    onChange={(e) => setCertForm({ ...certForm, missionRef: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-[var(--df-border-subtle)] bg-[var(--df-bg-base)] text-[var(--df-text-main)] focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="font-semibold text-[var(--df-text-main)]">
                      Wilaya de Départ (Code 1-58) *
                    </label>
                    <input
                      required
                      type="number"
                      min="1"
                      max="58"
                      value={certForm.departureWilaya}
                      onChange={(e) =>
                        setCertForm({ ...certForm, departureWilaya: Number(e.target.value) })
                      }
                      className="w-full px-3 py-2 rounded-xl border border-[var(--df-border-subtle)] bg-[var(--df-bg-base)] text-[var(--df-text-main)] focus:outline-none font-mono"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="font-semibold text-[var(--df-text-main)]">
                      Wilaya d’Arrivée (Code 1-58) *
                    </label>
                    <input
                      required
                      type="number"
                      min="1"
                      max="58"
                      value={certForm.arrivalWilaya}
                      onChange={(e) =>
                        setCertForm({ ...certForm, arrivalWilaya: Number(e.target.value) })
                      }
                      className="w-full px-3 py-2 rounded-xl border border-[var(--df-border-subtle)] bg-[var(--df-bg-base)] text-[var(--df-text-main)] focus:outline-none font-mono"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-[var(--df-text-main)]">
                    Date &amp; Heure de Départ du Lot *
                  </label>
                  <input
                    required
                    type="datetime-local"
                    value={certForm.departureTime}
                    onChange={(e) => setCertForm({ ...certForm, departureTime: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-[var(--df-border-subtle)] bg-[var(--df-bg-base)] text-[var(--df-text-main)] focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-[var(--df-text-main)]">
                    Description Détaillée du Fret Alimentaire / Pharma
                  </label>
                  <input
                    type="text"
                    value={certForm.cargoDescription}
                    onChange={(e) => setCertForm({ ...certForm, cargoDescription: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-[var(--df-border-subtle)] bg-[var(--df-bg-base)] text-[var(--df-text-main)] focus:outline-none"
                  />
                </div>

                <div className="flex items-center justify-end gap-3 pt-3 border-t border-[var(--df-border-subtle)]">
                  <button
                    type="button"
                    onClick={() => setShowCertModal(false)}
                    className="px-4 py-2 rounded-xl border border-[var(--df-border-subtle)] text-[var(--df-text-muted)] hover:text-[var(--df-text-main)]"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    disabled={submittingCert}
                    className="px-4 py-2 rounded-xl bg-emerald-600 text-white font-semibold hover:bg-emerald-700"
                  >
                    {submittingCert ? 'Génération…' : 'Générer & Sceller SHA-256'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* MODALE D'AFFICHAGE DU CERTIFICAT OFFICIEL HACCP */}
        {selectedCertViewer && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-[var(--df-bg-surface-1)] border border-[var(--df-border-subtle)] rounded-2xl max-w-2xl w-full p-6 space-y-4 shadow-xl">
              <div className="flex items-center justify-between border-b border-[var(--df-border-subtle)] pb-3">
                <div className="flex items-center gap-2">
                  <IconShieldCheck size={22} className="text-emerald-500" />
                  <div>
                    <h3 className="text-base font-bold text-[var(--df-text-main)]">
                      Certificat Sanitaire de Traçabilité Thermique &amp; ATP
                    </h3>
                    <p className="text-[11px] font-mono text-emerald-600 dark:text-emerald-400">
                      Réf: {selectedCertViewer.certificateRef}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedCertViewer(null)}
                  className="text-[var(--df-text-muted)] hover:text-[var(--df-text-main)]"
                >
                  <IconX size={18} />
                </button>
              </div>

              <div className="space-y-3 text-xs">
                <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-800 dark:text-emerald-300">
                  <div className="font-bold flex items-center gap-1.5 text-sm">
                    <IconCheck size={16} />
                    <span>{selectedCertViewer.complianceStatus}</span>
                  </div>
                  <p className="mt-1">{selectedCertViewer.sanitaryVerdict}</p>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-2">
                  <div className="p-3 rounded-xl bg-[var(--df-bg-surface-2)] border border-[var(--df-border-subtle)] space-y-1">
                    <span className="text-[10px] font-bold uppercase text-[var(--df-text-muted)]">
                      Paramètres Thermiques Mission
                    </span>
                    <div className="text-sm font-mono font-bold text-[var(--df-text-main)]">
                      Moyenne : +{selectedCertViewer.averageTempC}°C
                    </div>
                    <div className="text-[11px] text-[var(--df-text-muted)]">
                      Min: +{selectedCertViewer.minTempRecordedC}°C • Max: +
                      {selectedCertViewer.maxTempRecordedC}°C
                    </div>
                    <div className="text-[11px] text-[var(--df-text-muted)]">
                      Excursion cumulée: {selectedCertViewer.totalExcursionMinutes} minutes
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-[var(--df-bg-surface-2)] border border-[var(--df-border-subtle)] space-y-1">
                    <span className="text-[10px] font-bold uppercase text-[var(--df-text-muted)]">
                      Consommation Groupe Frigo Auxiliaire
                    </span>
                    <div className="text-sm font-mono font-bold text-amber-600 dark:text-amber-400">
                      {selectedCertViewer.auxiliaryFuelConsumedLiters} Litres de Gasoil
                    </div>
                    <div className="text-[11px] text-[var(--df-text-muted)]">
                      Coût carburant groupe : {formatCurrency(selectedCertViewer.auxiliaryFuelCostDzd)}
                    </div>
                    <div className="text-[11px] text-[var(--df-text-muted)]">
                      Réservoir dédié 200 L contrôlé
                    </div>
                  </div>
                </div>

                <div className="pt-2 space-y-1">
                  <span className="text-[10px] font-bold uppercase text-[var(--df-text-muted)]">
                    Scellé Cryptographique d’Intégrité SHA-256 (Inaltérable) :
                  </span>
                  <div className="p-2 rounded-lg bg-[var(--df-bg-base)] border border-[var(--df-border-subtle)] font-mono text-[10px] break-all text-[var(--df-text-main)]">
                    {selectedCertViewer.sha256Hash}
                  </div>
                </div>

                <div className="pt-2 text-[11px] text-[var(--df-text-muted)] text-center">
                  Document officiel certifié conforme à l’Arrêté Interministériel du 21 Safar 1414
                  et opposable aux contrôles vétérinaires DSV et commissions de discipline.
                </div>
              </div>

              <div className="flex items-center justify-end pt-3 border-t border-[var(--df-border-subtle)]">
                <button
                  type="button"
                  onClick={() => setSelectedCertViewer(null)}
                  className="px-4 py-2 rounded-xl bg-[var(--df-brand-primary)] text-white font-semibold"
                >
                  Fermer
                </button>
              </div>
            </div>
          </div>
        )}

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
