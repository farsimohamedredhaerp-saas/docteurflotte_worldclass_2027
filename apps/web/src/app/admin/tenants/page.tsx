'use client';

import React, { useEffect, useState } from 'react';
import { AuthClient } from '../../../lib/api-auth';
import { PlatformAdminClient } from '../../../lib/api-platform-admin';
import { PlatformTenant } from '@docteurflotte/contracts';
import { IconRefreshCw, IconX } from '../../../components/navigation/TechIcons';

export default function AdminTenantsPage() {
  const [tenants, setTenants] = useState<PlatformTenant[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedTenant, setSelectedTenant] = useState<PlatformTenant | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Filter & Search
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  const loadTenants = () => {
    const session = AuthClient.getSession();
    if (!session.token) return;

    setIsLoading(true);
    PlatformAdminClient.getTenants(session.token)
      .then((data) => {
        setTenants(data);
      })
      .catch((err) => {
        setError(err.message);
      })
      .finally(() => {
        setIsLoading(false);
      });
  };

  useEffect(() => {
    loadTenants();
  }, []);

  const handleUpdateTenant = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTenant) return;

    const session = AuthClient.getSession();
    if (!session.token) return;

    setIsUpdating(true);
    setSuccessMsg(null);
    try {
      await PlatformAdminClient.updateTenant(
        selectedTenant.id,
        {
          plan_tier: selectedTenant.plan_tier,
          status: selectedTenant.status,
          max_vehicles: Number(selectedTenant.max_vehicles),
          max_devices: Number(selectedTenant.max_devices),
          max_users: Number(selectedTenant.max_users),
          max_api_rate_per_min: Number(selectedTenant.max_api_rate_per_min),
          notes: selectedTenant.notes,
        },
        session.token
      );

      setSuccessMsg(`Organisation « ${selectedTenant.name} » mise à jour avec succès.`);
      loadTenants();
      setTimeout(() => setSelectedTenant(null), 1200);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setIsUpdating(false);
    }
  };

  const filteredTenants = tenants.filter((t) => {
    const matchesSearch =
      t.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.slug.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.contact_email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || t.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '22px', fontWeight: 800, color: 'var(--df-text-main)', margin: '0 0 6px 0' }}>
            Gestion des Tenants & Quotas Multi-Tenant
          </h1>
          <p style={{ fontSize: '14px', color: 'var(--df-text-secondary)', margin: 0 }}>
            Supervisez les organisations souscrites, attribuez les paliers (Mode 0, 1, 2) et ajustez les quotas.
          </p>
        </div>

        <button
          onClick={loadTenants}
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
          <IconRefreshCw size={14} className={isLoading ? 'animate-spin' : ''} />
          Actualiser la liste
        </button>
      </div>

      {/* Filters Bar */}
      <div
        style={{
          display: 'flex',
          gap: '12px',
          marginBottom: '20px',
          flexWrap: 'wrap',
          alignItems: 'center',
        }}
      >
        <input
          type="text"
          placeholder="Rechercher par nom, slug ou email..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{
            padding: '10px 14px',
            borderRadius: '8px',
            backgroundColor: 'var(--df-bg-surface-1)',
            border: '1px solid var(--df-border-subtle)',
            color: 'var(--df-text-main)',
            fontSize: '13px',
            minWidth: '280px',
            outline: 'none',
          }}
        />

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          style={{
            padding: '10px 14px',
            borderRadius: '8px',
            backgroundColor: 'var(--df-bg-surface-1)',
            border: '1px solid var(--df-border-subtle)',
            color: 'var(--df-text-main)',
            fontSize: '13px',
            outline: 'none',
          }}
        >
          <option value="ALL">Tous les statuts</option>
          <option value="ACTIVE">ACTIVE</option>
          <option value="TRIAL">TRIAL</option>
          <option value="SUSPENDED">SUSPENDED</option>
          <option value="TERMINATED">TERMINATED</option>
        </select>

        <span style={{ fontSize: '13px', color: 'var(--df-text-muted)', marginLeft: 'auto' }}>
          {filteredTenants.length} organisation(s) trouvée(s)
        </span>
      </div>

      {/* Tenants Table */}
      <div
        style={{
          borderRadius: '12px',
          border: '1px solid var(--df-border-subtle)',
          backgroundColor: 'var(--df-bg-surface-1)',
          overflow: 'hidden',
          boxShadow: 'var(--df-shadow-sm)',
        }}
      >
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
          <thead>
            <tr style={{ backgroundColor: 'var(--df-bg-surface-2)', borderBottom: '1px solid var(--df-border-subtle)' }}>
              <th style={{ padding: '14px 16px', fontWeight: 600, color: 'var(--df-text-muted)' }}>ORGANISATION</th>
              <th style={{ padding: '14px 16px', fontWeight: 600, color: 'var(--df-text-muted)' }}>STATUT</th>
              <th style={{ padding: '14px 16px', fontWeight: 600, color: 'var(--df-text-muted)' }}>PALIER D’EXPLOITATION</th>
              <th style={{ padding: '14px 16px', fontWeight: 600, color: 'var(--df-text-muted)' }}>VÉHICULES / QUOTA</th>
              <th style={{ padding: '14px 16px', fontWeight: 600, color: 'var(--df-text-muted)' }}>UTILISATEURS</th>
              <th style={{ padding: '14px 16px', fontWeight: 600, color: 'var(--df-text-muted)' }}>CONTACT</th>
              <th style={{ padding: '14px 16px', fontWeight: 600, color: 'var(--df-text-muted)', textAlign: 'right' }}>ACTIONS</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={7} style={{ padding: '40px', textAlign: 'center', color: 'var(--df-text-muted)' }}>
                  Chargement des tenants...
                </td>
              </tr>
            ) : filteredTenants.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ padding: '40px', textAlign: 'center', color: 'var(--df-text-muted)' }}>
                  Aucune organisation ne correspond aux critères.
                </td>
              </tr>
            ) : (
              filteredTenants.map((t) => (
                <tr
                  key={t.id}
                  style={{
                    borderBottom: '1px solid var(--df-border-subtle)',
                    transition: 'background 0.15s ease',
                  }}
                >
                  <td style={{ padding: '14px 16px' }}>
                    <div style={{ fontWeight: 700, color: 'var(--df-text-main)' }}>{t.name}</div>
                    <div style={{ fontSize: '11px', color: 'var(--df-text-muted)' }}>slug: {t.slug}</div>
                  </td>
                  <td style={{ padding: '14px 16px' }}>
                    <span
                      style={{
                        padding: '4px 8px',
                        borderRadius: '6px',
                        fontSize: '11px',
                        fontWeight: 700,
                        backgroundColor:
                          t.status === 'ACTIVE'
                            ? 'rgba(16, 185, 129, 0.15)'
                            : t.status === 'TRIAL'
                            ? 'rgba(245, 158, 11, 0.15)'
                            : 'rgba(239, 68, 68, 0.15)',
                        color:
                          t.status === 'ACTIVE'
                            ? '#34d399'
                            : t.status === 'TRIAL'
                            ? '#fbbf24'
                            : '#fca5a5',
                      }}
                    >
                      {t.status}
                    </span>
                  </td>
                  <td style={{ padding: '14px 16px' }}>
                    <span
                      style={{
                        fontSize: '12px',
                        fontWeight: 600,
                        color:
                          t.plan_tier === 'ENTERPRISE_IOT_MODE_2'
                            ? '#818cf8'
                            : t.plan_tier === 'PRO_GPS_MODE_1'
                            ? '#38bdf8'
                            : '#94a3b8',
                      }}
                    >
                      {t.plan_tier}
                    </span>
                  </td>
                  <td style={{ padding: '14px 16px' }}>
                    <span style={{ fontWeight: 700, color: 'var(--df-text-main)' }}>
                      {t.actual_vehicles ?? 0}
                    </span>{' '}
                    / {t.max_vehicles}
                  </td>
                  <td style={{ padding: '14px 16px' }}>
                    <span style={{ fontWeight: 700, color: 'var(--df-text-main)' }}>
                      {t.actual_users ?? 0}
                    </span>{' '}
                    / {t.max_users}
                  </td>
                  <td style={{ padding: '14px 16px', color: 'var(--df-text-secondary)', fontSize: '12px' }}>
                    {t.contact_email}
                  </td>
                  <td style={{ padding: '14px 16px', textAlign: 'right' }}>
                    <button
                      onClick={() => setSelectedTenant(t)}
                      style={{
                        padding: '6px 12px',
                        borderRadius: '6px',
                        backgroundColor: 'var(--df-bg-surface-2)',
                        border: '1px solid var(--df-border-subtle)',
                        color: 'var(--df-text-main)',
                        fontSize: '12px',
                        fontWeight: 600,
                        cursor: 'pointer',
                      }}
                    >
                      Modifier
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Edit Tenant Modal */}
      {selectedTenant && (
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
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 700, color: 'var(--df-text-main)' }}>
                Modifier l’Organisation : {selectedTenant.name}
              </h3>
              <button
                onClick={() => setSelectedTenant(null)}
                aria-label="Fermer"
                style={{ background: 'none', border: 'none', color: 'var(--df-text-muted)', fontSize: '18px', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
              >
                <IconX size={18} />
              </button>
            </div>

            {successMsg && (
              <div style={{ padding: '10px 14px', borderRadius: '8px', backgroundColor: 'rgba(16, 185, 129, 0.15)', color: '#34d399', fontSize: '13px', marginBottom: '16px' }}>
                {successMsg}
              </div>
            )}

            <form onSubmit={handleUpdateTenant} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--df-text-secondary)', marginBottom: '4px' }}>
                  Statut
                </label>
                <select
                  value={selectedTenant.status}
                  onChange={(e) => setSelectedTenant({ ...selectedTenant, status: e.target.value as PlatformTenant['status'] })}
                  style={{ width: '100%', padding: '10px', borderRadius: '8px', backgroundColor: 'var(--df-bg-surface-2)', border: '1px solid var(--df-border-subtle)', color: 'var(--df-text-main)', fontSize: '13px' }}
                >
                  <option value="ACTIVE">ACTIVE (Autorisé)</option>
                  <option value="TRIAL">TRIAL (Période d’essai)</option>
                  <option value="SUSPENDED">SUSPENDED (Accès bloqué)</option>
                  <option value="TERMINATED">TERMINATED (Résilié)</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--df-text-secondary)', marginBottom: '4px' }}>
                  Palier Technologique
                </label>
                <select
                  value={selectedTenant.plan_tier}
                  onChange={(e) => setSelectedTenant({ ...selectedTenant, plan_tier: e.target.value })}
                  style={{ width: '100%', padding: '10px', borderRadius: '8px', backgroundColor: 'var(--df-bg-surface-2)', border: '1px solid var(--df-border-subtle)', color: 'var(--df-text-main)', fontSize: '13px' }}
                >
                  <option value="STARTER_MODE_0">Mode 0 — Sans Boîtier (OEM-First / Pleins Naftal / DVIR)</option>
                  <option value="PRO_GPS_MODE_1">Mode 1 — GPS Standard (Traccar Souverain)</option>
                  <option value="ENTERPRISE_IOT_MODE_2">Mode 2 — Full CAN / J1939 / Télématique Avancée</option>
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--df-text-secondary)', marginBottom: '4px' }}>
                    Quota Max Véhicules
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={selectedTenant.max_vehicles}
                    onChange={(e) => setSelectedTenant({ ...selectedTenant, max_vehicles: parseInt(e.target.value, 10) })}
                    style={{ width: '100%', padding: '10px', borderRadius: '8px', backgroundColor: 'var(--df-bg-surface-2)', border: '1px solid var(--df-border-subtle)', color: 'var(--df-text-main)', fontSize: '13px' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--df-text-secondary)', marginBottom: '4px' }}>
                    Quota Max Utilisateurs
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={selectedTenant.max_users}
                    onChange={(e) => setSelectedTenant({ ...selectedTenant, max_users: parseInt(e.target.value, 10) })}
                    style={{ width: '100%', padding: '10px', borderRadius: '8px', backgroundColor: 'var(--df-bg-surface-2)', border: '1px solid var(--df-border-subtle)', color: 'var(--df-text-main)', fontSize: '13px' }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--df-text-secondary)', marginBottom: '4px' }}>
                  Plafond Requêtes API / min
                </label>
                <input
                  type="number"
                  min="30"
                  value={selectedTenant.max_api_rate_per_min}
                  onChange={(e) => setSelectedTenant({ ...selectedTenant, max_api_rate_per_min: parseInt(e.target.value, 10) })}
                  style={{ width: '100%', padding: '10px', borderRadius: '8px', backgroundColor: 'var(--df-bg-surface-2)', border: '1px solid var(--df-border-subtle)', color: 'var(--df-text-main)', fontSize: '13px' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '12px' }}>
                <button
                  type="button"
                  onClick={() => setSelectedTenant(null)}
                  style={{ padding: '9px 16px', borderRadius: '8px', background: 'none', border: '1px solid var(--df-border-subtle)', color: 'var(--df-text-muted)', fontSize: '13px', cursor: 'pointer' }}
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={isUpdating}
                  style={{ padding: '9px 18px', borderRadius: '8px', backgroundColor: 'var(--df-accent-blue)', color: '#fff', border: 'none', fontWeight: 600, fontSize: '13px', cursor: 'pointer' }}
                >
                  {isUpdating ? 'Enregistrement...' : 'Enregistrer les Modifications'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
