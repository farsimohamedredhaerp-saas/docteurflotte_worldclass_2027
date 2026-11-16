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
} from '../../components/navigation/TechIcons';
import { CalculationProofModal, CalculationProofData } from '../../components/decisions';
import { VehicleSilhouette } from '../../components/ui/VehicleSilhouette';

function buildReeferProofData(reefer: ReeferLiveStatus): CalculationProofData {
  const isAlert = !reefer.isWithinSafeRange;
  return {
    title: `Rapport Thermotrace & Conformité Chaîne du Froid — ${reefer.assetCode}`,
    decisionOrMetricName: `Contrôle Thermique ${reefer.cargoType} (${reefer.currentTempC > 0 ? `+${reefer.currentTempC}` : reefer.currentTempC}°C)`,
    category: 'REGULATORY',
    ruleId: `HACCP-ATP-${reefer.assetCode}`,
    legalOrOemReference: 'Arrêté Interministériel du 21 Safar 1414 / Norme Sanitaire Vétérinaire DSV & ATP',
    deterministicFormula: 'ΔT = |T_mesuré - T_consigne| ≤ Seuil_ATP_HACCP',
    formulaExplanation: `La chaîne du froid pour la cargaison ${reefer.cargoType} impose une plage de consigne stricte (+${reefer.setpointTempC}°C). En cas d'excursion thermique (ΔT > seuil), la cinétique d'échauffement génère un risque financier immédiat de dépréciation (${(reefer.estimatedCargoValueDzd / 1_000_000).toFixed(2)} M DZD).`,
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
        value: `${reefer.estimatedCargoValueDzd.toLocaleString('fr-DZ')} DZD`,
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
          ? `${reefer.estimatedCargoValueDzd.toLocaleString('fr-DZ')} DZD × Excursion ${reefer.excursionDurationMinutes} min`
          : 'Aucune dépréciation (température dans la norme)',
        intermediateResult: isAlert
          ? `${reefer.financialRiskDzd.toLocaleString('fr-DZ')} DZD de risque de perte`
          : '0 DZD de perte financière',
      },
    ],
    finalResult: {
      label: 'Verdict Sanitaire & Réglementaire DSV',
      value: isAlert ? 'RUPTURE DE CHAÎNE DU FROID' : 'LOT CERTIFIÉ CONFORME HACCP',
      conclusion: isAlert
        ? `Alerte active : Excursion de ${reefer.tempDeltaC}°C depuis ${reefer.excursionDurationMinutes} min. Risque financier chiffré à ${reefer.financialRiskDzd.toLocaleString('fr-DZ')} DZD. Intervention immédiate requise.`
        : `Température nominale (+${reefer.setpointTempC}°C). Aucune rupture thermique. Traçabilité conforme pour transport agro-alimentaire et pharmaceutique.`,
    },
  };
}

export default function ColdChainPage() {
  const { isDemoMode, session } = useDemoMode();
  const [reefers, setReefers] = useState<ReeferLiveStatus[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filterCargo, setFilterCargo] = useState<string>('ALL');
  const [activeProof, setActiveProof] = useState<CalculationProofData | null>(null);

  const loadReefers = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await FleetIntelligenceClient.getColdChainLive(session.token || undefined, isDemoMode);
      setReefers(data);
    } catch (err) {
      console.error('Erreur télémétrie chaîne du froid:', err);
    } finally {
      setIsLoading(false);
    }
  }, [session.token, isDemoMode]);

  useEffect(() => {
    loadReefers();
    const interval = setInterval(loadReefers, 30000);
    return () => clearInterval(interval);
  }, [loadReefers]);

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

  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--df-bg-base)', color: 'var(--df-text-main)' }}>
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
                  CHAÎNE DU FROID SOUVERAINE
                </span>
                <span
                  style={{
                    backgroundColor: 'var(--df-status-ok-bg)',
                    color: 'var(--df-status-ok-text)',
                    border: '1px solid var(--df-status-ok-border)',
                  }}
                  className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold"
                >
                  Thermo King &amp; Carrier Transicold
                </span>
                <span
                  style={{
                    backgroundColor: 'var(--df-bg-surface-2)',
                    color: 'var(--df-text-secondary)',
                    border: '1px solid var(--df-border-subtle)',
                  }}
                  className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-mono"
                >
                  Norme ATP &amp; HACCP
                </span>
              </div>
              <h1 className="text-2xl font-black tracking-tight" style={{ color: 'var(--df-text-main)' }}>
                Télémétrie Chaîne du Froid &amp; Groupes Frigo
              </h1>
              <p className="text-sm max-w-3xl" style={{ color: 'var(--df-text-secondary)' }}>
                Surveillance continue des cargaisons sensibles (viande, produits laitiers, insuline, vaccins) sous climat saharien. Détection instantanée d’excursion thermique et chiffrage du risque de dépréciation en Dinars Algériens.
              </p>
            </div>

            <div className="flex items-center gap-2.5 shrink-0">
              <Button
                variant="outline"
                size="sm"
                onClick={loadReefers}
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
              border: activeExcursionsCount > 0
                ? '1px solid var(--df-status-danger-border)'
                : '1px solid var(--df-border-subtle)',
              backgroundColor: activeExcursionsCount > 0
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
                  color: activeExcursionsCount > 0 ? 'var(--df-status-danger-text)' : 'var(--df-text-muted)',
                }}
                className="text-[11px] font-bold uppercase tracking-wider"
              >
                Excursions Thermiques
              </span>
              <IconAlertTriangle
                size={16}
                style={{
                  color: activeExcursionsCount > 0 ? 'var(--df-status-danger)' : 'var(--df-text-muted)',
                }}
              />
            </div>
            <div
              className="text-3xl font-black font-mono mt-1"
              style={{
                color: activeExcursionsCount > 0 ? 'var(--df-status-danger)' : 'var(--df-status-ok)',
              }}
            >
              {activeExcursionsCount}
            </div>
            <div
              className="text-xs"
              style={{
                color: activeExcursionsCount > 0 ? 'var(--df-status-danger-text)' : 'var(--df-text-muted)',
              }}
            >
              {activeExcursionsCount > 0 ? 'Ruptures thermiques en cours !' : '100% dans la plage réglementaire'}
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
              {(totalMonitoredCargoDzd / 1_000_000).toFixed(1)} <span className="text-base font-normal" style={{ color: 'var(--df-text-muted)' }}>M DA</span>
            </div>
            <div className="text-xs" style={{ color: 'var(--df-text-muted)' }}>
              Cargaisons sous température dirigée
            </div>
          </div>

          <div
            style={{
              borderRadius: 'var(--df-radius-xl)',
              border: totalExcursionRiskDzd > 0
                ? '1px solid var(--df-status-warning-border)'
                : '1px solid var(--df-border-subtle)',
              backgroundColor: totalExcursionRiskDzd > 0
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
                  color: totalExcursionRiskDzd > 0 ? 'var(--df-status-warning-text)' : 'var(--df-text-muted)',
                }}
                className="text-[11px] font-bold uppercase tracking-wider"
              >
                Risque Financier Actuel
              </span>
              <IconShieldCheck
                size={16}
                style={{
                  color: totalExcursionRiskDzd > 0 ? 'var(--df-status-warning)' : 'var(--df-text-muted)',
                }}
              />
            </div>
            <div
              className="text-3xl font-black font-mono mt-1"
              style={{
                color: totalExcursionRiskDzd > 0 ? 'var(--df-status-warning)' : 'var(--df-status-ok)',
              }}
            >
              {totalExcursionRiskDzd.toLocaleString('fr-DZ')} <span className="text-base font-normal" style={{ color: 'var(--df-text-muted)' }}>DA</span>
            </div>
            <div
              className="text-xs"
              style={{
                color: totalExcursionRiskDzd > 0 ? 'var(--df-status-warning-text)' : 'var(--df-text-muted)',
              }}
            >
              {totalExcursionRiskDzd > 0 ? 'Dépréciation financière en cours' : 'Zéro perte constatée'}
            </div>
          </div>
        </div>

        {/* BARRE DE FILTRES ET CONTRÔLES */}
        <div
          style={{
            borderRadius: 'var(--df-radius-xl)',
            border: '1px solid var(--df-border-subtle)',
            backgroundColor: 'var(--df-bg-surface-1)',
            padding: '1rem',
            boxShadow: 'var(--df-shadow-sm)',
            marginBottom: '1.5rem',
          }}
          className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3"
        >
          <div className="flex items-center gap-3 flex-wrap">
            <span className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--df-text-muted)' }}>
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
                  ? 'Votre parc ne comporte aucun groupe frigorifique actif. Pour tester la surveillance ATP et HACCP, basculez en mode démo ou déclarez un groupe frigorifique dans vos actifs.'
                  : 'Modifiez le filtre de cargaison sélectionné.'}
              </p>
              {reefers.length === 0 && (
                <Link href="/assets" className="inline-block no-underline">
                  <Button variant="primary" size="sm">
                    + Déclarer un Actif Frigorifique
                  </Button>
                </Link>
              )}
            </div>
          ) : (
            filteredReefers.map((reefer) => {
              const isAlert = !reefer.isWithinSafeRange;

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
                  className="space-y-4 transition-all"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <div className="mt-0.5 text-[var(--df-text-secondary)] opacity-85 shrink-0">
                        <VehicleSilhouette
                          category={reefer.assetName.toLowerCase().includes('master') ? 'LIGHT_COMMERCIAL' : 'HEAVY_TRUCK'}
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
                        <h3 className="text-base font-black mt-1.5" style={{ color: 'var(--df-text-main)' }}>
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
                    <span className="text-[10px] font-bold uppercase tracking-wider block" style={{ color: 'var(--df-text-muted)' }}>
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
                      <span className="text-base font-bold" style={{ color: 'var(--df-text-muted)' }}>°C</span>
                    </div>

                    <div className="text-xs pt-1" style={{ color: 'var(--df-text-secondary)' }}>
                      Consigne :{' '}
                      <strong className="font-mono" style={{ color: 'var(--df-text-main)' }}>
                        +{reefer.setpointTempC}°C
                      </strong>{' '}
                      (Écart : <span className="font-mono">{reefer.tempDeltaC}°C</span>)
                    </div>
                  </div>

                  {/* DÉTAILS TECHNIQUES & CAPTEURS IOT */}
                  <div className="space-y-2 pt-2 border-t text-xs" style={{ borderColor: 'var(--df-border-subtle)' }}>
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
                      <span className="font-semibold inline-flex items-center gap-1.5" style={{ color: 'var(--df-text-main)' }}>
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
                        {(reefer.estimatedCargoValueDzd / 1_000_000).toFixed(2)} M DA
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
                          <IconAlertTriangle size={13} style={{ color: 'var(--df-status-danger)' }} className="shrink-0" />
                          <span>Risque financier direct de dépréciation</span>
                        </div>
                        <div className="text-[11px]" style={{ opacity: 0.9 }}>
                          Excursion depuis : <strong className="font-mono">{reefer.excursionDurationMinutes} minutes</strong>
                        </div>
                        <div className="text-[11px]" style={{ opacity: 0.9 }}>
                          Pertes estimées :{' '}
                          <strong className="font-mono text-xs">
                            {reefer.financialRiskDzd.toLocaleString('fr-DZ')} DA
                          </strong>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* PIED DE CARTE & ACTIONS */}
                  <div className="pt-3 border-t flex items-center justify-between text-xs" style={{ borderColor: 'var(--df-border-subtle)' }}>
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
                      <span>Preuve Thermotrace (HACCP / DSV)</span>
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

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
