'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useDemoMode } from '../../context/DemoModeContext';
import { Navbar } from '../../components/navigation/Navbar';
import { Card } from '../../components/Card';
import { Badge } from '../../components/Badge';
import { Button } from '../../components/Button';
import { MetricCard } from '../../components/MetricCard';
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

export default function ColdChainPage() {
  const { isDemoMode, session } = useDemoMode();
  const [reefers, setReefers] = useState<ReeferLiveStatus[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filterCargo, setFilterCargo] = useState<string>('ALL');

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
    // Rafraîchissement automatique toutes les 30 secondes
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
    <>
      <Navbar />

      <main className="df-container" style={{ paddingTop: '0.5rem' }}>
        {/* EN-TÊTE DE SECTION COCKPIT */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            marginBottom: '2rem',
            flexWrap: 'wrap',
            gap: '1.25rem',
            borderBottom: '1px solid var(--df-border-subtle)',
            paddingBottom: '1.5rem',
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
              <IconThermometer size={28} className="text-blue-500" />
              <h1
                style={{
                  fontSize: '1.85rem',
                  fontWeight: 800,
                  color: 'var(--df-text-main)',
                  letterSpacing: '-0.02em',
                  margin: 0,
                }}
              >
                Télémétrie Chaîne du Froid & Groupes Frigo (Reefers)
              </h1>
              <Badge variant="ok">Thermo King & Carrier</Badge>
            </div>
            <p
              style={{
                fontSize: '0.875rem',
                color: 'var(--df-text-muted)',
                margin: 0,
                maxWidth: '820px',
                lineHeight: 1.55,
              }}
            >
              Surveillance continue des cargaisons sensibles (viande, produits laitiers, insuline, vaccins) sous climat saharien. Détection immédiate d’excursion thermique et chiffrage du risque de dépréciation en Dinars Algériens.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
            <Button variant="outline" size="sm" onClick={loadReefers} disabled={isLoading} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <IconRefreshCw size={13} className={isLoading ? 'animate-spin' : ''} />
              <span>{isLoading ? 'Chargement...' : 'Actualiser Flux'}</span>
            </Button>
            <Link href="/telematics" style={{ textDecoration: 'none' }}>
              <Button variant="primary" size="sm">
                Cartographie GPS Live →
              </Button>
            </Link>
          </div>
        </div>

        {/* MÉTRIQUES CLÉS CONSOLIDÉES */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
            gap: '1.25rem',
            marginBottom: '2rem',
          }}
        >
          <MetricCard
            title="Caisses Frigorifiques"
            value={reefers.length.toString()}
            unit="Unités"
            description="Groupes connectés télémétrie en ligne"
            icon={<IconTruck size={18} />}
          />
          <MetricCard
            title="Excursions Thermiques"
            value={activeExcursionsCount.toString()}
            unit="Caisses"
            description={activeExcursionsCount > 0 ? 'Ruptures thermiques en cours !' : 'Toutes les caisses conformes'}
            icon={<IconAlertTriangle size={18} />}
            trend={
              activeExcursionsCount > 0
                ? {
                    direction: 'down',
                    text: `${activeExcursionsCount} dépassement(s) seuil`,
                    isPositive: false,
                  }
                : {
                    direction: 'up',
                    text: '100% dans la plage légale',
                    isPositive: true,
                  }
            }
          />
          <MetricCard
            title="Valeur Fret Sous Froid"
            value={`${(totalMonitoredCargoDzd / 1000000).toFixed(1)}`}
            unit="M DA"
            description="Cargaisons sensibles sous température dirigée"
            icon={<IconBox size={18} />}
          />
          <MetricCard
            title="Risque Financier Actuel"
            value={`${totalExcursionRiskDzd.toLocaleString('fr-DZ')}`}
            unit="DA"
            description="Pertes potentielles estimées sur avaries"
            icon={<IconShieldCheck size={18} />}
            trend={
              totalExcursionRiskDzd > 0
                ? {
                    direction: 'down',
                    text: 'Dépréciation en cours',
                    isPositive: false,
                  }
                : {
                    direction: 'up',
                    text: 'Zéro perte constatée',
                    isPositive: true,
                  }
            }
          />
        </div>

        {/* BARRE DE FILTRES ET CONTRÔLES */}
        <div
          style={{
            background: 'var(--df-bg-surface-1)',
            padding: '1rem 1.5rem',
            borderRadius: 'var(--df-radius-md)',
            border: '1px solid var(--df-border-subtle)',
            marginBottom: '2rem',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '1rem',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', flexWrap: 'wrap' }}>
            <span
              style={{
                fontSize: '0.75rem',
                fontWeight: 700,
                color: 'var(--df-text-muted)',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
              }}
            >
              Filtrer par Denrée :
            </span>
            <select
              value={filterCargo}
              onChange={(e) => setFilterCargo(e.target.value)}
              style={{
                background: 'var(--df-bg-surface-2)',
                border: '1px solid var(--df-border-subtle)',
                borderRadius: 'var(--df-radius-sm)',
                padding: '0.45rem 0.85rem',
                fontSize: '0.825rem',
                color: 'var(--df-text-main)',
                outline: 'none',
                cursor: 'pointer',
              }}
            >
              <option value="ALL">Toutes les cargaisons</option>
              <option value={ReeferCargoType.DAIRY}>Lait & Produits Laitiers</option>
              <option value={ReeferCargoType.FRESH_MEAT}>Viandes Fraîches</option>
              <option value={ReeferCargoType.PHARMA}>Pharmacie & Vaccins</option>
              <option value={ReeferCargoType.FROZEN}>Surgelés</option>
            </select>
          </div>

          <div style={{ fontSize: '0.78rem', color: 'var(--df-text-muted)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <IconShieldCheck size={14} className="text-emerald-500" /> Protocole certifié HACCP & Direction des Services Vétérinaires (DSV)
          </div>
        </div>

        {/* GRILLE DES GROUPES FRIGORIFIQUES */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))',
            gap: '1.5rem',
          }}
        >
          {filteredReefers.length === 0 ? (
            <div
              style={{
                gridColumn: '1 / -1',
                padding: '3.5rem 1.5rem',
                textAlign: 'center',
                background: 'var(--df-bg-surface-1)',
                border: '1px solid var(--df-border-subtle)',
                borderRadius: 'var(--df-radius-md)',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '0.75rem', color: 'var(--df-text-muted)' }}>
                <IconThermometer size={36} />
              </div>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--df-text-main)', margin: '0 0 0.5rem 0' }}>
                {reefers.length === 0
                  ? 'Aucun groupe frigorifique surveillé'
                  : 'Aucun groupe ne correspond à cette denrée'}
              </h3>
              <p style={{ fontSize: '0.85rem', color: 'var(--df-text-muted)', margin: '0 0 1.25rem 0', maxWidth: '520px', marginLeft: 'auto', marginRight: 'auto' }}>
                {reefers.length === 0
                  ? 'Votre parc ne comporte aucun groupe frigorifique actif. Pour tester la surveillance ATP et HACCP, basculez en mode démo ou déclarez un groupe frigorifique dans vos actifs.'
                  : 'Modifiez le filtre de cargaison sélectionné.'}
              </p>
              {reefers.length === 0 && (
                <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
                  <Link href="/assets" style={{ textDecoration: 'none' }}>
                    <Button variant="primary" size="sm">
                      + Déclarer un Actif Frigorifique
                    </Button>
                  </Link>
                </div>
              )}
            </div>
          ) : (
            filteredReefers.map((reefer) => {
              const isAlert = !reefer.isWithinSafeRange;

              return (
                <Card
                  key={reefer.assetId}
                  style={{
                    padding: '1.75rem',
                    background: isAlert
                      ? 'linear-gradient(135deg, rgba(239, 68, 68, 0.12) 0%, var(--df-bg-surface-1) 100%)'
                      : 'linear-gradient(135deg, var(--df-bg-surface-1) 0%, var(--df-bg-surface-2) 100%)',
                    border: `1px solid ${isAlert ? 'var(--df-status-danger)' : 'var(--df-border-subtle)'}`,
                    borderTop: `2px solid ${isAlert ? 'var(--df-status-danger)' : 'var(--df-accent-cyan)'}`,
                    boxShadow: isAlert ? '0 0 20px rgba(239, 68, 68, 0.2)' : 'var(--df-shadow-md)',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem', marginBottom: '1.25rem' }}>
                    <div>
                      <span
                        className="df-mono"
                        style={{
                          fontSize: '0.75rem',
                          fontWeight: 700,
                          color: 'var(--df-accent-cyan)',
                          textTransform: 'uppercase',
                          letterSpacing: '0.04em',
                        }}
                      >
                        {reefer.assetCode}
                      </span>
                      <h3
                        style={{
                          fontSize: '1.15rem',
                          fontWeight: 800,
                          color: 'var(--df-text-main)',
                          margin: '0.2rem 0 0.35rem 0',
                        }}
                      >
                        {reefer.assetName}
                      </h3>
                      <p style={{ fontSize: '0.75rem', color: 'var(--df-text-muted)', margin: 0 }}>
                        {getCargoLabel(reefer.cargoType)}
                      </p>
                    </div>

                    <Badge variant={isAlert ? 'danger' : 'ok'} pulse={isAlert}>
                      {isAlert ? 'ALERTE RUPTURE' : 'TEMP CONFORME'}
                    </Badge>
                  </div>

                  {/* CADRAN DIGITAL DE TEMPÉRATURE TÉLÉMÉTRIQUE */}
                  <div
                    style={{
                      background: 'var(--df-bg-surface-3)',
                      border: `1px solid ${isAlert ? 'rgba(239, 68, 68, 0.4)' : 'var(--df-border-medium)'}`,
                      borderRadius: 'var(--df-radius-md)',
                      padding: '1.25rem',
                      textAlign: 'center',
                      marginBottom: '1.25rem',
                      boxShadow: isAlert ? '0 0 16px rgba(239, 68, 68, 0.15)' : 'none',
                    }}
                  >
                    <span
                      style={{
                        fontSize: '0.7rem',
                        fontWeight: 700,
                        color: 'var(--df-text-muted)',
                        textTransform: 'uppercase',
                        letterSpacing: '0.06em',
                        display: 'block',
                        marginBottom: '0.35rem',
                      }}
                    >
                      Température de Reprise Frigo
                    </span>
                    <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'center', gap: '0.35rem' }}>
                      <span
                        className="df-mono"
                        style={{
                          fontSize: '3.25rem',
                          fontWeight: 800,
                          lineHeight: 1,
                          letterSpacing: '-0.02em',
                          color: isAlert ? 'var(--df-status-danger)' : 'var(--df-status-ok)',
                          textShadow: isAlert
                            ? '0 0 20px rgba(239, 68, 68, 0.5)'
                            : '0 0 20px rgba(16, 185, 129, 0.3)',
                        }}
                      >
                        {reefer.currentTempC > 0 ? `+${reefer.currentTempC}` : reefer.currentTempC}
                      </span>
                      <span style={{ fontSize: '1.25rem', fontWeight: 600, color: 'var(--df-text-muted)' }}>
                        °C
                      </span>
                    </div>

                    <div style={{ marginTop: '0.65rem', fontSize: '0.75rem', color: 'var(--df-text-muted)' }}>
                      Consigne :{' '}
                      <strong className="df-mono" style={{ color: 'var(--df-text-main)' }}>
                        +{reefer.setpointTempC}°C
                      </strong>{' '}
                      (Écart Delta : <span className="df-mono">{reefer.tempDeltaC}°C</span>)
                    </div>
                  </div>

                  {/* DÉTAILS TECHNIQUES & CAPTEURS IOT */}
                  <div
                    style={{
                      borderTop: '1px solid var(--df-border-subtle)',
                      paddingTop: '1rem',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '0.5rem',
                      fontSize: '0.78rem',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ color: 'var(--df-text-muted)' }}>Capteur Porte Caisse :</span>
                      <span
                        style={{
                          fontWeight: 700,
                          color: reefer.doorOpen ? 'var(--df-status-danger)' : 'var(--df-status-ok)',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                        }}
                      >
                        {reefer.doorOpen ? (
                          <>
                            <IconAlertTriangle size={12} /> Ouverte (Déperdition)
                          </>
                        ) : (
                          <>
                            <IconLock size={12} /> Fermée & Étanche
                          </>
                        )}
                      </span>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ color: 'var(--df-text-muted)' }}>Alimentation Groupe :</span>
                      <span style={{ fontWeight: 600, color: 'var(--df-text-main)', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                        {reefer.powerMode === ReeferPowerMode.DIESEL ? (
                          <>
                            <IconFuel size={12} /> Moteur Diesel Autonome
                          </>
                        ) : reefer.powerMode === ReeferPowerMode.ELECTRIC_STANDBY ? (
                          <>
                            <IconZap size={12} /> Prise Secteur 380V (Dépôt)
                          </>
                        ) : (
                          'Arrêt'
                        )}
                      </span>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ color: 'var(--df-text-muted)' }}>Valeur Cargaison :</span>
                      <span className="df-mono" style={{ fontWeight: 700, color: 'var(--df-text-main)' }}>
                        {(reefer.estimatedCargoValueDzd / 1000000).toFixed(2)} M DA
                      </span>
                    </div>

                    {isAlert && (
                      <div
                        style={{
                          marginTop: '0.5rem',
                          padding: '0.85rem',
                          borderRadius: 'var(--df-radius-sm)',
                          background: 'var(--df-bg-surface-1)',
                          border: '1px solid var(--df-status-danger)',
                          fontSize: '0.78rem',
                          color: 'var(--df-status-danger)',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '0.25rem',
                        }}
                      >
                        <div style={{ fontWeight: 800, display: 'flex', alignItems: 'center', gap: '5px' }}>
                          <IconAlertTriangle size={14} /> Risque financier direct de dépréciation
                        </div>
                        <div>
                          Excursion depuis : <strong className="df-mono">{reefer.excursionDurationMinutes} minutes</strong>
                        </div>
                        <div>
                          Pertes estimées :{' '}
                          <strong className="df-mono" style={{ fontSize: '0.95rem' }}>
                            {reefer.financialRiskDzd.toLocaleString('fr-DZ')} DA
                          </strong>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* PIED DE CARTE & ACTIONS */}
                  <div
                    style={{
                      marginTop: '1.25rem',
                      paddingTop: '0.85rem',
                      borderTop: '1px solid var(--df-border-subtle)',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}
                  >
                    <span className="df-mono" style={{ fontSize: '0.7rem', color: 'var(--df-text-muted)' }}>
                      Relevé : {new Date(reefer.lastUpdate).toLocaleTimeString()}
                    </span>
                    <button
                      type="button"
                      onClick={() => alert(`Téléchargement de la courbe Thermotrace certifiée DSV pour ${reefer.assetCode}`)}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: 'var(--df-accent-cyan)',
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        cursor: 'pointer',
                        padding: 0,
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                      }}
                    >
                      <IconFileText size={13} />
                      <span>Télécharger Thermotrace</span>
                    </button>
                  </div>
                </Card>
              );
            })
          )}
        </div>
      </main>
    </>
  );
}
