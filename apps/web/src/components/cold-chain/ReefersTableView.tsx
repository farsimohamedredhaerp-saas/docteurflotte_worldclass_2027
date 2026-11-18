'use client';

import React from 'react';
import { Badge } from '@/components/Badge';
import {
  IconThermometer,
  IconAlertTriangle,
  IconShieldCheck,
  IconLock,
  IconFileText,
  IconZap,
  IconFuel,
} from '@/components/navigation/TechIcons';
import { VehicleSilhouette } from '@/components/ui/VehicleSilhouette';
import { formatCurrency } from '@/lib/currency-formatter';
import {
  ReeferLiveStatus,
  ReeferCargoType,
  ReeferPowerMode,
} from '@/lib/api-fleet-intelligence';

export function getCargoLabel(cargo: ReeferCargoType) {
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
}

interface ReefersTableViewProps {
  reefers: ReeferLiveStatus[];
  filteredReefers: ReeferLiveStatus[];
  filterCargo: string;
  onFilterCargoChange: (cargo: string) => void;
  onShowThermotraceProof: (reefer: ReeferLiveStatus) => void;
  onOpenCertModal: (reefer: ReeferLiveStatus) => void;
}

export function ReefersTableView({
  reefers,
  filteredReefers,
  filterCargo,
  onFilterCargoChange,
  onShowThermotraceProof,
  onOpenCertModal,
}: ReefersTableViewProps) {
  return (
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
                  onClick={() => onFilterCargoChange(c.id)}
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
                      onClick={() => onShowThermotraceProof(reefer)}
                      style={{ color: 'var(--df-accent-blue)' }}
                      className="inline-flex items-center gap-1 font-bold hover:underline cursor-pointer"
                    >
                      <IconFileText size={13} />
                      <span>Preuve Thermotrace</span>
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() => onOpenCertModal(reefer)}
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
  );
}

