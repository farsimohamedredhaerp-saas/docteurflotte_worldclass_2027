'use client';

import React, { useEffect, useState } from 'react';
import { AuthClient } from '../../../lib/api-auth';
import { PlatformAdminClient } from '../../../lib/api-platform-admin';
import {
  PlatformFiscalFuelPrice,
  PlatformRegulatoryEnactaRule,
  PlatformVignetteTarif,
} from '@docteurflotte/contracts';
import { IconRefreshCw, IconAlertTriangle, IconX } from '@/components/navigation/TechIcons';

export default function AdminFiscalPage() {
  const [fuelPrices, setFuelPrices] = useState<PlatformFiscalFuelPrice[]>([]);
  const [vignettes, setVignettes] = useState<PlatformVignetteTarif[]>([]);
  const [enactaRules, setEnactaRules] = useState<PlatformRegulatoryEnactaRule[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Edit Fuel Modal
  const [selectedFuel, setSelectedFuel] = useState<PlatformFiscalFuelPrice | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Edit ENACTA Modal
  const [selectedEnacta, setSelectedEnacta] = useState<PlatformRegulatoryEnactaRule | null>(null);
  const [isUpdatingEnacta, setIsUpdatingEnacta] = useState(false);
  const [enactaJustification, setEnactaJustification] = useState('');

  const loadData = () => {
    const session = AuthClient.getSession();
    if (!session.token) return;

    setIsLoading(true);
    Promise.all([
      PlatformAdminClient.getFuelPrices(session.token),
      PlatformAdminClient.getVignettes(session.token),
      PlatformAdminClient.getEnactaRules(session.token),
    ])
      .then(([fuels, vgs, rules]) => {
        setFuelPrices(fuels);
        setVignettes(vgs);
        setEnactaRules(rules);
      })
      .catch((err) => {
        setError(err.message);
      })
      .finally(() => {
        setIsLoading(false);
      });
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleUpdateFuel = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFuel) return;

    const session = AuthClient.getSession();
    if (!session.token) return;

    setIsUpdating(true);
    setSuccessMsg(null);
    try {
      await PlatformAdminClient.updateFuelPrice(
        selectedFuel.id,
        {
          price_per_liter_dzd: Number(selectedFuel.price_per_liter_dzd),
          tva_rate_pct: Number(selectedFuel.tva_rate_pct),
          is_tva_deductible: selectedFuel.is_tva_deductible,
          official_reference_joradp: selectedFuel.official_reference_joradp,
          is_active: selectedFuel.is_active,
        },
        session.token
      );
      setSuccessMsg(`Prix du carburant « ${selectedFuel.label_fr} » mis à jour.`);
      loadData();
      setTimeout(() => setSelectedFuel(null), 1200);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setIsUpdating(false);
    }
  };

  const handleOpenEditEnacta = (rule: PlatformRegulatoryEnactaRule) => {
    const baseHt = rule.tariff_base_ht_dzd ?? 2450.0;
    const tva = rule.tva_rate_pct ?? 19.0;
    const ttc = rule.tariff_total_ttc_dzd ?? Number((baseHt * (1 + tva / 100)).toFixed(2));
    const provision = rule.internal_tco_provision_dzd ?? 8500.0;
    setSelectedEnacta({
      ...rule,
      tariff_base_ht_dzd: baseHt,
      tva_rate_pct: tva,
      tariff_total_ttc_dzd: ttc,
      internal_tco_provision_dzd: provision,
    });
    setEnactaJustification('');
  };

  const handleUpdateEnacta = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEnacta) return;

    const session = AuthClient.getSession();
    if (!session.token) return;

    setIsUpdatingEnacta(true);
    setSuccessMsg(null);
    try {
      await PlatformAdminClient.updateEnactaRule(
        selectedEnacta.id,
        {
          tariff_base_ht_dzd: Number(selectedEnacta.tariff_base_ht_dzd),
          tva_rate_pct: Number(selectedEnacta.tva_rate_pct),
          tariff_total_ttc_dzd: Number(selectedEnacta.tariff_total_ttc_dzd),
          internal_tco_provision_dzd: Number(selectedEnacta.internal_tco_provision_dzd),
          periodicity_months: Number(selectedEnacta.periodicity_months),
          first_inspection_months: Number(selectedEnacta.first_inspection_months),
          official_decree_ref: selectedEnacta.official_decree_ref,
          justification: enactaJustification || undefined,
        },
        session.token
      );
      setSuccessMsg(`Barème ENACTA « ${selectedEnacta.label_fr} » mis à jour avec succès.`);
      loadData();
      setTimeout(() => setSelectedEnacta(null), 1200);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setIsUpdatingEnacta(false);
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '22px', fontWeight: 800, color: 'var(--df-text-main)', margin: '0 0 6px 0' }}>
            Barèmes Fiscaux, Énergie Naftal & Réglementation ENACTA
          </h1>
          <p style={{ fontSize: '14px', color: 'var(--df-text-secondary)', margin: 0 }}>
            Source officielle JORADP, TVA déductible, tarifs de vignettes (LF 2025 Art. 55) et contrôle technique.
          </p>
        </div>

        <button
          onClick={loadData}
          style={{
            padding: '8px 14px',
            borderRadius: '8px',
            backgroundColor: 'var(--df-bg-surface-2)',
            border: '1px solid var(--df-border-subtle)',
            color: 'var(--df-text-main)',
            fontSize: '13px',
            fontWeight: 600,
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
          }}
        >
          <IconRefreshCw size={13} />
          <span>Actualiser</span>
        </button>
      </div>

      {error && (
        <div style={{ padding: '12px 16px', borderRadius: '10px', backgroundColor: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.3)', color: '#fca5a5', fontSize: '14px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <IconAlertTriangle size={16} />
          <span>{error}</span>
        </div>
      )}

      {/* 1. Official Naftal Fuel Prices */}
      <div style={{ marginBottom: '32px' }}>
        <h2 style={{ fontSize: '17px', fontWeight: 700, color: 'var(--df-text-main)', marginBottom: '12px' }}>
          1. Prix Officiels des Carburants à la Pompe (Naftal)
        </h2>
        <div style={{ borderRadius: '12px', border: '1px solid var(--df-border-subtle)', backgroundColor: 'var(--df-bg-surface-1)', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
            <thead>
              <tr style={{ backgroundColor: 'var(--df-bg-surface-2)', borderBottom: '1px solid var(--df-border-subtle)' }}>
                <th style={{ padding: '12px 16px', color: 'var(--df-text-muted)' }}>TYPE</th>
                <th style={{ padding: '12px 16px', color: 'var(--df-text-muted)' }}>DÉSIGNATION</th>
                <th style={{ padding: '12px 16px', color: 'var(--df-text-muted)' }}>PRIX / LITRE</th>
                <th style={{ padding: '12px 16px', color: 'var(--df-text-muted)' }}>TVA</th>
                <th style={{ padding: '12px 16px', color: 'var(--df-text-muted)' }}>RÉFÉRENCE JORADP</th>
                <th style={{ padding: '12px 16px', color: 'var(--df-text-muted)' }}>STATUT</th>
                <th style={{ padding: '12px 16px', color: 'var(--df-text-muted)', textAlign: 'right' }}>ACTION</th>
              </tr>
            </thead>
            <tbody>
              {fuelPrices.map((f) => (
                <tr key={f.id} style={{ borderBottom: '1px solid var(--df-border-subtle)' }}>
                  <td style={{ padding: '12px 16px', fontWeight: 700, color: 'var(--df-text-main)' }}>{f.fuel_type}</td>
                  <td style={{ padding: '12px 16px' }}>{f.label_fr}</td>
                  <td style={{ padding: '12px 16px', fontWeight: 800, color: '#38bdf8' }}>
                    {f.price_per_liter_dzd.toFixed(2)} DZD
                  </td>
                  <td style={{ padding: '12px 16px', color: 'var(--df-text-secondary)' }}>
                    {f.tva_rate_pct}% {f.is_tva_deductible ? '(Déductible)' : '(Non déd.)'}
                  </td>
                  <td style={{ padding: '12px 16px', color: 'var(--df-text-muted)', fontSize: '12px' }}>
                    {f.official_reference_joradp}
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <span
                      style={{
                        padding: '3px 8px',
                        borderRadius: '6px',
                        fontSize: '11px',
                        fontWeight: 700,
                        backgroundColor: f.is_active ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                        color: f.is_active ? '#34d399' : '#fca5a5',
                      }}
                    >
                      {f.is_active ? 'ACTIF 2026' : 'HISTORIQUE'}
                    </span>
                  </td>
                  <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                    <button
                      onClick={() => setSelectedFuel(f)}
                      style={{
                        padding: '5px 10px',
                        borderRadius: '6px',
                        backgroundColor: 'var(--df-bg-surface-2)',
                        border: '1px solid var(--df-border-subtle)',
                        color: 'var(--df-text-main)',
                        fontSize: '12px',
                        cursor: 'pointer',
                      }}
                    >
                      Ajuster
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 2. ENACTA Vehicle Inspection Rules & Tariffs */}
      <div style={{ marginBottom: '32px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', flexWrap: 'wrap', gap: '8px' }}>
          <div>
            <h2 style={{ fontSize: '17px', fontWeight: 700, color: 'var(--df-text-main)', margin: '0 0 4px 0' }}>
              2. Barèmes & Tarifs Officiels du Contrôle Technique Automobile (ENACTA)
            </h2>
            <p style={{ fontSize: '12px', color: 'var(--df-text-muted)', margin: 0 }}>
              Configuration SuperAdmin dynamique sans redéploiement (Base HT, TVA 19%, TTC DZD et provision TCO flotte).
            </p>
          </div>
        </div>

        <div style={{ borderRadius: '12px', border: '1px solid var(--df-border-subtle)', backgroundColor: 'var(--df-bg-surface-1)', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
            <thead>
              <tr style={{ backgroundColor: 'var(--df-bg-surface-2)', borderBottom: '1px solid var(--df-border-subtle)' }}>
                <th style={{ padding: '12px 16px', color: 'var(--df-text-muted)' }}>CATÉGORIE</th>
                <th style={{ padding: '12px 16px', color: 'var(--df-text-muted)' }}>DÉSIGNATION</th>
                <th style={{ padding: '12px 16px', color: 'var(--df-text-muted)' }}>PÉRIODICITÉ</th>
                <th style={{ padding: '12px 16px', color: 'var(--df-text-muted)' }}>TARIF BASE HT</th>
                <th style={{ padding: '12px 16px', color: 'var(--df-text-muted)' }}>TVA</th>
                <th style={{ padding: '12px 16px', color: 'var(--df-text-muted)' }}>TARIF TTC (DZD)</th>
                <th style={{ padding: '12px 16px', color: 'var(--df-text-muted)' }}>PROVISION TCO</th>
                <th style={{ padding: '12px 16px', color: 'var(--df-text-muted)', textAlign: 'right' }}>ACTION</th>
              </tr>
            </thead>
            <tbody>
              {enactaRules.map((r) => {
                const baseHt = r.tariff_base_ht_dzd ?? 2450.0;
                const tva = r.tva_rate_pct ?? 19.0;
                const ttc = r.tariff_total_ttc_dzd ?? Number((baseHt * (1 + tva / 100)).toFixed(2));
                const provision = r.internal_tco_provision_dzd ?? 8500.0;
                return (
                  <tr key={r.id} style={{ borderBottom: '1px solid var(--df-border-subtle)' }}>
                    <td style={{ padding: '12px 16px', fontWeight: 700, color: 'var(--df-text-main)' }}>{r.asset_category}</td>
                    <td style={{ padding: '12px 16px' }}>
                      <div style={{ fontWeight: 600 }}>{r.label_fr}</div>
                      <div style={{ fontSize: '11px', color: 'var(--df-text-muted)' }}>{r.official_decree_ref}</div>
                    </td>
                    <td style={{ padding: '12px 16px', fontWeight: 700, color: '#fbbf24' }}>
                      Tous les {r.periodicity_months} mois
                    </td>
                    <td style={{ padding: '12px 16px', fontWeight: 600, color: 'var(--df-text-main)' }}>
                      {baseHt.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} DZD
                    </td>
                    <td style={{ padding: '12px 16px', color: 'var(--df-text-muted)' }}>
                      {tva.toFixed(1)}%
                    </td>
                    <td style={{ padding: '12px 16px', fontWeight: 800, color: '#34d399' }}>
                      {ttc.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} DZD
                    </td>
                    <td style={{ padding: '12px 16px', fontWeight: 600, color: '#60a5fa' }}>
                      {provision.toLocaleString('fr-FR')} DZD
                    </td>
                    <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                      <button
                        onClick={() => handleOpenEditEnacta(r)}
                        style={{
                          padding: '6px 12px',
                          borderRadius: '6px',
                          backgroundColor: 'var(--df-bg-surface-2)',
                          border: '1px solid var(--df-border-subtle)',
                          color: 'var(--df-accent-blue)',
                          fontSize: '12px',
                          fontWeight: 600,
                          cursor: 'pointer',
                        }}
                      >
                        Ajuster
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* 3. Vignette Automobile Rates (LF 2025 Art. 55) */}
      <div>
        <h2 style={{ fontSize: '17px', fontWeight: 700, color: 'var(--df-text-main)', marginBottom: '12px' }}>
          3. Barème des Vignettes Automobiles (Loi de Finances 2025 — Art. 55)
        </h2>
        <div style={{ borderRadius: '12px', border: '1px solid var(--df-border-subtle)', backgroundColor: 'var(--df-bg-surface-1)', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
            <thead>
              <tr style={{ backgroundColor: 'var(--df-bg-surface-2)', borderBottom: '1px solid var(--df-border-subtle)' }}>
                <th style={{ padding: '12px 16px', color: 'var(--df-text-muted)' }}>CATÉGORIE VÉHICULE</th>
                <th style={{ padding: '12px 16px', color: 'var(--df-text-muted)' }}>PUISSANCE CV</th>
                <th style={{ padding: '12px 16px', color: 'var(--df-text-muted)' }}>ÂGE VÉHICULE</th>
                <th style={{ padding: '12px 16px', color: 'var(--df-text-muted)' }}>TARIF LÉGAL</th>
                <th style={{ padding: '12px 16px', color: 'var(--df-text-muted)' }}>ANNÉE LF</th>
              </tr>
            </thead>
            <tbody>
              {vignettes.map((v) => (
                <tr key={v.id} style={{ borderBottom: '1px solid var(--df-border-subtle)' }}>
                  <td style={{ padding: '12px 16px', fontWeight: 600, color: 'var(--df-text-main)' }}>{v.vehicle_category}</td>
                  <td style={{ padding: '12px 16px' }}>{v.power_cv_min} à {v.power_cv_max >= 999 ? '∞' : `${v.power_cv_max}`} CV</td>
                  <td style={{ padding: '12px 16px' }}>{v.vehicle_age_min_years} à {v.vehicle_age_max_years >= 99 ? '∞' : `${v.vehicle_age_max_years}`} ans</td>
                  <td style={{ padding: '12px 16px', fontWeight: 800, color: '#34d399' }}>
                    {v.amount_dzd.toLocaleString('fr-FR')} DZD
                  </td>
                  <td style={{ padding: '12px 16px', color: 'var(--df-text-muted)' }}>{v.finance_law_year}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Fuel Modal */}
      {selectedFuel && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.75)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px',
            zIndex: 100,
          }}
        >
          <div
            style={{
              backgroundColor: 'var(--df-bg-surface-1)',
              borderRadius: '16px',
              border: '1px solid var(--df-border-subtle)',
              padding: '28px',
              width: '100%',
              maxWidth: '480px',
              boxShadow: 'var(--df-shadow-lg)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 700, color: 'var(--df-text-main)' }}>
                Modifier le Tarif : {selectedFuel.label_fr}
              </h3>
              <button
                onClick={() => setSelectedFuel(null)}
                style={{ background: 'none', border: 'none', color: 'var(--df-text-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '4px' }}
                aria-label="Fermer"
              >
                <IconX size={18} />
              </button>
            </div>

            {successMsg && (
              <div style={{ padding: '10px 14px', borderRadius: '8px', backgroundColor: 'rgba(16, 185, 129, 0.15)', color: '#34d399', fontSize: '13px', marginBottom: '16px' }}>
                {successMsg}
              </div>
            )}

            <form onSubmit={handleUpdateFuel} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--df-text-secondary)', marginBottom: '4px' }}>
                  Prix TTC à la pompe (DZD / Litre)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={selectedFuel.price_per_liter_dzd}
                  onChange={(e) => setSelectedFuel({ ...selectedFuel, price_per_liter_dzd: parseFloat(e.target.value) })}
                  style={{ width: '100%', padding: '10px', borderRadius: '8px', backgroundColor: 'var(--df-bg-surface-2)', border: '1px solid var(--df-border-subtle)', color: 'var(--df-text-main)', fontSize: '14px', fontWeight: 700 }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--df-text-secondary)', marginBottom: '4px' }}>
                  Référence Légale JORADP
                </label>
                <input
                  type="text"
                  value={selectedFuel.official_reference_joradp}
                  onChange={(e) => setSelectedFuel({ ...selectedFuel, official_reference_joradp: e.target.value })}
                  style={{ width: '100%', padding: '10px', borderRadius: '8px', backgroundColor: 'var(--df-bg-surface-2)', border: '1px solid var(--df-border-subtle)', color: 'var(--df-text-main)', fontSize: '13px' }}
                />
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <input
                  type="checkbox"
                  id="isActiveFuel"
                  checked={selectedFuel.is_active}
                  onChange={(e) => setSelectedFuel({ ...selectedFuel, is_active: e.target.checked })}
                />
                <label htmlFor="isActiveFuel" style={{ fontSize: '13px', color: 'var(--df-text-main)', fontWeight: 600 }}>
                  Carburant actif pour les calculs de coûts et consommation 2026
                </label>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '12px' }}>
                <button
                  type="button"
                  onClick={() => setSelectedFuel(null)}
                  style={{ padding: '9px 16px', borderRadius: '8px', background: 'none', border: '1px solid var(--df-border-subtle)', color: 'var(--df-text-muted)', fontSize: '13px', cursor: 'pointer' }}
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={isUpdating}
                  style={{ padding: '9px 18px', borderRadius: '8px', backgroundColor: 'var(--df-accent-blue)', color: '#fff', border: 'none', fontWeight: 600, fontSize: '13px', cursor: 'pointer' }}
                >
                  {isUpdating ? 'Enregistrement...' : 'Enregistrer le Tarif'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Edit ENACTA Modal */}
      {selectedEnacta && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.75)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px',
            zIndex: 100,
          }}
        >
          <div
            style={{
              backgroundColor: 'var(--df-bg-surface-1)',
              borderRadius: '16px',
              border: '1px solid var(--df-border-subtle)',
              padding: '28px',
              width: '100%',
              maxWidth: '540px',
              boxShadow: 'var(--df-shadow-lg)',
              maxHeight: '90vh',
              overflowY: 'auto',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 700, color: 'var(--df-text-main)' }}>
                  Ajuster le Barème ENACTA : {selectedEnacta.label_fr}
                </h3>
                <span style={{ fontSize: '12px', color: 'var(--df-text-muted)' }}>Catégorie : {selectedEnacta.asset_category}</span>
              </div>
              <button
                onClick={() => setSelectedEnacta(null)}
                style={{ background: 'none', border: 'none', color: 'var(--df-text-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '4px' }}
                aria-label="Fermer"
              >
                <IconX size={18} />
              </button>
            </div>

            {successMsg && (
              <div style={{ padding: '10px 14px', borderRadius: '8px', backgroundColor: 'rgba(16, 185, 129, 0.15)', color: '#34d399', fontSize: '13px', marginBottom: '16px' }}>
                {successMsg}
              </div>
            )}

            <form onSubmit={handleUpdateEnacta} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--df-text-secondary)', marginBottom: '4px' }}>
                    Tarif Base HT (DZD)
                  </label>
                  <input
                    type="number"
                    step="10"
                    min="0"
                    value={selectedEnacta.tariff_base_ht_dzd ?? 2450}
                    onChange={(e) => {
                      const base = parseFloat(e.target.value) || 0;
                      const tva = selectedEnacta.tva_rate_pct ?? 19.0;
                      const ttc = Number((base * (1 + tva / 100)).toFixed(2));
                      setSelectedEnacta({
                        ...selectedEnacta,
                        tariff_base_ht_dzd: base,
                        tariff_total_ttc_dzd: ttc,
                      });
                    }}
                    style={{ width: '100%', padding: '10px', borderRadius: '8px', backgroundColor: 'var(--df-bg-surface-2)', border: '1px solid var(--df-border-subtle)', color: 'var(--df-text-main)', fontSize: '14px', fontWeight: 700 }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--df-text-secondary)', marginBottom: '4px' }}>
                    Taux TVA (%)
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    min="0"
                    max="100"
                    value={selectedEnacta.tva_rate_pct ?? 19.0}
                    onChange={(e) => {
                      const tva = parseFloat(e.target.value) || 0;
                      const base = selectedEnacta.tariff_base_ht_dzd ?? 2450;
                      const ttc = Number((base * (1 + tva / 100)).toFixed(2));
                      setSelectedEnacta({
                        ...selectedEnacta,
                        tva_rate_pct: tva,
                        tariff_total_ttc_dzd: ttc,
                      });
                    }}
                    style={{ width: '100%', padding: '10px', borderRadius: '8px', backgroundColor: 'var(--df-bg-surface-2)', border: '1px solid var(--df-border-subtle)', color: 'var(--df-text-main)', fontSize: '14px' }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--df-text-secondary)', marginBottom: '4px' }}>
                    Tarif Total TTC (DZD)
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    min="0"
                    value={selectedEnacta.tariff_total_ttc_dzd ?? 2915.5}
                    onChange={(e) => setSelectedEnacta({ ...selectedEnacta, tariff_total_ttc_dzd: parseFloat(e.target.value) || 0 })}
                    style={{ width: '100%', padding: '10px', borderRadius: '8px', backgroundColor: 'var(--df-bg-surface-2)', border: '1px solid var(--df-border-subtle)', color: '#34d399', fontSize: '14px', fontWeight: 800 }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--df-text-secondary)', marginBottom: '4px' }}>
                    Provision Interne TCO (DZD)
                  </label>
                  <input
                    type="number"
                    step="100"
                    min="0"
                    value={selectedEnacta.internal_tco_provision_dzd ?? 8500}
                    onChange={(e) => setSelectedEnacta({ ...selectedEnacta, internal_tco_provision_dzd: parseFloat(e.target.value) || 0 })}
                    style={{ width: '100%', padding: '10px', borderRadius: '8px', backgroundColor: 'var(--df-bg-surface-2)', border: '1px solid var(--df-border-subtle)', color: '#60a5fa', fontSize: '14px', fontWeight: 700 }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--df-text-secondary)', marginBottom: '4px' }}>
                    Périodicité Contrôle (Mois)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="60"
                    value={selectedEnacta.periodicity_months}
                    onChange={(e) => setSelectedEnacta({ ...selectedEnacta, periodicity_months: parseInt(e.target.value) || 6 })}
                    style={{ width: '100%', padding: '10px', borderRadius: '8px', backgroundColor: 'var(--df-bg-surface-2)', border: '1px solid var(--df-border-subtle)', color: 'var(--df-text-main)', fontSize: '14px' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--df-text-secondary)', marginBottom: '4px' }}>
                    1er Contrôle Neuf (Mois)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="60"
                    value={selectedEnacta.first_inspection_months}
                    onChange={(e) => setSelectedEnacta({ ...selectedEnacta, first_inspection_months: parseInt(e.target.value) || 12 })}
                    style={{ width: '100%', padding: '10px', borderRadius: '8px', backgroundColor: 'var(--df-bg-surface-2)', border: '1px solid var(--df-border-subtle)', color: 'var(--df-text-main)', fontSize: '14px' }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--df-text-secondary)', marginBottom: '4px' }}>
                  Référence Réglementaire / Décret JORADP
                </label>
                <input
                  type="text"
                  value={selectedEnacta.official_decree_ref}
                  onChange={(e) => setSelectedEnacta({ ...selectedEnacta, official_decree_ref: e.target.value })}
                  style={{ width: '100%', padding: '10px', borderRadius: '8px', backgroundColor: 'var(--df-bg-surface-2)', border: '1px solid var(--df-border-subtle)', color: 'var(--df-text-main)', fontSize: '13px' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--df-text-secondary)', marginBottom: '4px' }}>
                  Justification / Note d&apos;Audit SuperAdmin
                </label>
                <input
                  type="text"
                  placeholder="Ex: Ajustement suite au barème actualisé ENACTA 2026..."
                  value={enactaJustification}
                  onChange={(e) => setEnactaJustification(e.target.value)}
                  style={{ width: '100%', padding: '10px', borderRadius: '8px', backgroundColor: 'var(--df-bg-surface-2)', border: '1px solid var(--df-border-subtle)', color: 'var(--df-text-main)', fontSize: '13px' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '12px' }}>
                <button
                  type="button"
                  onClick={() => setSelectedEnacta(null)}
                  style={{ padding: '9px 16px', borderRadius: '8px', background: 'none', border: '1px solid var(--df-border-subtle)', color: 'var(--df-text-muted)', fontSize: '13px', cursor: 'pointer' }}
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={isUpdatingEnacta}
                  style={{ padding: '9px 18px', borderRadius: '8px', backgroundColor: 'var(--df-accent-blue)', color: '#fff', border: 'none', fontWeight: 600, fontSize: '13px', cursor: 'pointer' }}
                >
                  {isUpdatingEnacta ? 'Enregistrement...' : 'Enregistrer le Barème ENACTA'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
