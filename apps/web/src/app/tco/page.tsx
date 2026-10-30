'use client';

import React, { useState } from 'react';
import { Navbar } from '../../components/navigation/Navbar';
import { Card } from '../../components/Card';
import { Badge } from '../../components/Badge';
import { Button } from '../../components/Button';
import {
  IconBarChart3,
  IconFuel,
  IconWrench,
  IconTruck,
  IconShieldCheck,
  IconAlertTriangle,
  IconArrowUpRight,
  IconArrowDownRight,
  IconDownload,
  IconPlus,
  IconEdit,
  IconTrash,
  IconX,
} from '../../components/navigation/TechIcons';

export interface AssetTcoRecord {
  id: string;
  registrationNumber: string;
  makeModel: string;
  category: 'PL_TRACTEUR' | 'PL_BENNE' | 'ENGIN_BTP' | 'VUL_UTILITAIRE';
  categoryLabel: string;
  kmOrHoursPeriod: number;
  unitType: 'km' | 'h';
  fuelCostDzd: number;
  maintenanceCostDzd: number;
  driverCostDzd: number;
  tiresAndOtherDzd: number;
  totalCostDzd: number;
  costPerUnitDzd: number;
  targetBudgetPerUnitDzd: number;
  variancePercent: number;
  status: 'OPTIMAL' | 'ON_TRACK' | 'OVER_BUDGET';
}

const INITIAL_TCO_DATA: AssetTcoRecord[] = [
  {
    id: 'tco-01',
    registrationNumber: '00421-116-16',
    makeModel: 'Renault Trucks K 480 6x4',
    category: 'PL_BENNE',
    categoryLabel: 'PL Benne Chantier',
    kmOrHoursPeriod: 6400,
    unitType: 'km',
    fuelCostDzd: 220000,
    maintenanceCostDzd: 85000,
    driverCostDzd: 110000,
    tiresAndOtherDzd: 42000,
    totalCostDzd: 457000,
    costPerUnitDzd: 71.4,
    targetBudgetPerUnitDzd: 78.0,
    variancePercent: -8.5,
    status: 'OPTIMAL',
  },
  {
    id: 'tco-02',
    registrationNumber: '01892-116-16',
    makeModel: 'Mercedes-Benz Actros 3340 S',
    category: 'PL_TRACTEUR',
    categoryLabel: 'PL Tracteur Routier',
    kmOrHoursPeriod: 8900,
    unitType: 'km',
    fuelCostDzd: 340000,
    maintenanceCostDzd: 210000,
    driverCostDzd: 125000,
    tiresAndOtherDzd: 68000,
    totalCostDzd: 743000,
    costPerUnitDzd: 83.5,
    targetBudgetPerUnitDzd: 80.0,
    variancePercent: 4.4,
    status: 'OVER_BUDGET',
  },
  {
    id: 'tco-03',
    registrationNumber: 'ENG-23-018-DZ',
    makeModel: 'Caterpillar 320D',
    category: 'ENGIN_BTP',
    categoryLabel: 'Pelle Hydraulique BTP',
    kmOrHoursPeriod: 165,
    unitType: 'h',
    fuelCostDzd: 290000,
    maintenanceCostDzd: 145000,
    driverCostDzd: 95000,
    tiresAndOtherDzd: 32000,
    totalCostDzd: 562000,
    costPerUnitDzd: 3406.0,
    targetBudgetPerUnitDzd: 3600.0,
    variancePercent: -5.4,
    status: 'OPTIMAL',
  },
  {
    id: 'tco-04',
    registrationNumber: '08341-118-30',
    makeModel: 'Shacman F3000',
    category: 'PL_BENNE',
    categoryLabel: 'PL Benne Lourde',
    kmOrHoursPeriod: 5200,
    unitType: 'km',
    fuelCostDzd: 195000,
    maintenanceCostDzd: 98000,
    driverCostDzd: 105000,
    tiresAndOtherDzd: 38000,
    totalCostDzd: 436000,
    costPerUnitDzd: 83.8,
    targetBudgetPerUnitDzd: 85.0,
    variancePercent: -1.4,
    status: 'ON_TRACK',
  },
  {
    id: 'tco-05',
    registrationNumber: '00912-120-31',
    makeModel: 'Toyota Hilux 2.4 D-4D',
    category: 'VUL_UTILITAIRE',
    categoryLabel: 'Pick-up Utilitare 4x4',
    kmOrHoursPeriod: 4100,
    unitType: 'km',
    fuelCostDzd: 68000,
    maintenanceCostDzd: 24000,
    driverCostDzd: 75000,
    tiresAndOtherDzd: 18000,
    totalCostDzd: 185000,
    costPerUnitDzd: 45.1,
    targetBudgetPerUnitDzd: 48.0,
    variancePercent: -6.0,
    status: 'OPTIMAL',
  },
];

export default function TcoPage() {
  const [tcoRecords, setTcoRecords] = useState<AssetTcoRecord[]>(INITIAL_TCO_DATA);
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [notification, setNotification] = useState<string | null>(null);

  // Modal CRUD state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<AssetTcoRecord | null>(null);
  const [formState, setFormState] = useState<Partial<AssetTcoRecord>>({
    registrationNumber: '',
    makeModel: '',
    category: 'PL_BENNE',
    categoryLabel: 'Poids Lourds',
    kmOrHoursPeriod: 5000,
    unitType: 'km',
    fuelCostDzd: 180000,
    maintenanceCostDzd: 60000,
    driverCostDzd: 90000,
    tiresAndOtherDzd: 30000,
    targetBudgetPerUnitDzd: 75.0,
  });

  const handleOpenAdd = () => {
    setEditingRecord(null);
    setFormState({
      registrationNumber: '',
      makeModel: '',
      category: 'PL_BENNE',
      categoryLabel: 'PL Benne Chantier',
      kmOrHoursPeriod: 5000,
      unitType: 'km',
      fuelCostDzd: 180000,
      maintenanceCostDzd: 60000,
      driverCostDzd: 90000,
      tiresAndOtherDzd: 30000,
      targetBudgetPerUnitDzd: 75.0,
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (rec: AssetTcoRecord) => {
    setEditingRecord(rec);
    setFormState({ ...rec });
    setIsModalOpen(true);
  };

  const handleSaveTco = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formState.registrationNumber || !formState.kmOrHoursPeriod) {
      alert('Veuillez renseigner l\'immatriculation et l\'usage.');
      return;
    }

    const fuel = Number(formState.fuelCostDzd) || 0;
    const maint = Number(formState.maintenanceCostDzd) || 0;
    const driver = Number(formState.driverCostDzd) || 0;
    const other = Number(formState.tiresAndOtherDzd) || 0;
    const total = fuel + maint + driver + other;
    const usage = Number(formState.kmOrHoursPeriod) || 1;
    const costPerUnit = Number((total / usage).toFixed(1));
    const target = Number(formState.targetBudgetPerUnitDzd) || costPerUnit;
    const variance = Number((((costPerUnit - target) / target) * 100).toFixed(1));

    let status: 'OPTIMAL' | 'ON_TRACK' | 'OVER_BUDGET' = 'ON_TRACK';
    if (variance < -3) status = 'OPTIMAL';
    else if (variance > 3) status = 'OVER_BUDGET';

    if (editingRecord) {
      setTcoRecords((prev) =>
        prev.map((r) =>
          r.id === editingRecord.id
            ? ({
                ...r,
                ...formState,
                totalCostDzd: total,
                costPerUnitDzd: costPerUnit,
                variancePercent: variance,
                status,
              } as AssetTcoRecord)
            : r
        )
      );
      setNotification(`✓ Fiche TCO de ${formState.registrationNumber} mise à jour.`);
    } else {
      const newRec: AssetTcoRecord = {
        id: `tco-${Date.now().toString().slice(-4)}`,
        registrationNumber: formState.registrationNumber || '',
        makeModel: formState.makeModel || 'Véhicule',
        category: (formState.category as any) || 'PL_BENNE',
        categoryLabel: formState.categoryLabel || 'Poids Lourds',
        kmOrHoursPeriod: usage,
        unitType: (formState.unitType as any) || 'km',
        fuelCostDzd: fuel,
        maintenanceCostDzd: maint,
        driverCostDzd: driver,
        tiresAndOtherDzd: other,
        totalCostDzd: total,
        costPerUnitDzd: costPerUnit,
        targetBudgetPerUnitDzd: target,
        variancePercent: variance,
        status,
      };
      setTcoRecords((prev) => [newRec, ...prev]);
      setNotification(`✓ Nouvelle fiche TCO créée pour ${newRec.registrationNumber}`);
    }

    setIsModalOpen(false);
    setTimeout(() => setNotification(null), 5000);
  };

  const handleDeleteTco = (id: string, plate: string) => {
    if (confirm(`Confirmez-vous la suppression de la fiche TCO pour ${plate} ?`)) {
      setTcoRecords((prev) => prev.filter((r) => r.id !== id));
      setNotification(`ℹ Fiche TCO supprimée pour ${plate}`);
      setTimeout(() => setNotification(null), 4000);
    }
  };

  const filteredData = tcoRecords.filter((item) => {
    if (selectedCategory !== 'ALL' && !item.category.startsWith(selectedCategory)) return false;
    if (statusFilter !== 'ALL' && item.status !== statusFilter) return false;
    return true;
  });

  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--df-bg-base)', color: 'var(--df-text-main)' }}>
      {/* 1. BARRE HORIZONTALE UNIVERSELLE */}
      <Navbar />

      <div style={{ maxWidth: '1440px', margin: '0 auto', padding: '0 1.25rem 3rem 1.25rem' }}>
        {/* BANNIÈRE DE NOTIFICATION */}
        {notification && (
          <div
            role="status"
            style={{
              background: 'var(--df-bg-surface-1)',
              border: '1px solid var(--df-accent-blue)',
              color: 'var(--df-text-main)',
              padding: '0.85rem 1.25rem',
              borderRadius: 'var(--df-radius-md)',
              marginBottom: '1.25rem',
              boxShadow: 'var(--df-shadow-md)',
            }}
          >
            {notification}
          </div>
        )}

        {/* 2. LAYOUT DUAL-BAR : SIDEBAR VERTICALE + TABLEAU PRINCIPAL */}
        <div style={{ display: 'flex', gap: '1.25rem', alignItems: 'flex-start' }}>
          {/* SIDEBAR CONTEXTUELLE VERTICALE */}
          <aside
            style={{
              width: '260px',
              flexShrink: 0,
              background: 'var(--df-bg-surface-1)',
              border: '1px solid var(--df-border-subtle)',
              borderRadius: 'var(--df-radius-lg)',
              padding: '1rem',
              boxShadow: 'var(--df-shadow-sm)',
              position: 'sticky',
              top: '90px',
            }}
          >
            <div style={{ fontSize: '0.70rem', fontWeight: 700, color: 'var(--df-text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '0.75rem' }}>
              Filtres Contrôle de Gestion
            </div>

            <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
              {[
                { id: 'ALL', label: 'Toutes les Fiches', count: tcoRecords.length, icon: '📊' },
                { id: 'OPTIMAL', label: 'Sous Budget (Gain)', count: tcoRecords.filter((r) => r.status === 'OPTIMAL').length, icon: '🟢' },
                { id: 'ON_TRACK', label: 'En Cible Budgétaire', count: tcoRecords.filter((r) => r.status === 'ON_TRACK').length, icon: '⚖️' },
                { id: 'OVER_BUDGET', label: 'En Dérive de Coût', count: tcoRecords.filter((r) => r.status === 'OVER_BUDGET').length, icon: '🔴' },
              ].map((item) => (
                <button
                  key={item.id}
                  onClick={() => setStatusFilter(item.id)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '0.60rem 0.75rem',
                    borderRadius: 'var(--df-radius-md)',
                    border: statusFilter === item.id ? '1px solid var(--df-accent-blue)' : '1px solid transparent',
                    background: statusFilter === item.id ? 'var(--df-accent-blue-subtle)' : 'transparent',
                    color: statusFilter === item.id ? 'var(--df-accent-blue)' : 'var(--df-text-secondary)',
                    fontWeight: statusFilter === item.id ? 700 : 500,
                    fontSize: '0.80rem',
                    cursor: 'pointer',
                    textAlign: 'left',
                    transition: 'all var(--df-transition-fast)',
                  }}
                >
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                    <span>{item.icon}</span>
                    <span>{item.label}</span>
                  </span>
                  <span
                    className="df-mono"
                    style={{
                      fontSize: '0.68rem',
                      padding: '1px 5px',
                      borderRadius: '4px',
                      background: statusFilter === item.id ? 'var(--df-accent-blue)' : 'var(--df-bg-surface-2)',
                      color: statusFilter === item.id ? '#FFFFFF' : 'var(--df-text-muted)',
                    }}
                  >
                    {item.count}
                  </span>
                </button>
              ))}
            </nav>

            <div style={{ height: '1px', background: 'var(--df-border-subtle)', margin: '1rem 0' }} />

            {/* ACTION CRUD */}
            <Button variant="primary" size="sm" onClick={handleOpenAdd} style={{ width: '100%', justifyContent: 'center' }}>
              <IconPlus size={14} />
              <span>+ Fiche Coût TCO</span>
            </Button>

            <div style={{ marginTop: '1.25rem', padding: '0.65rem', background: 'var(--df-bg-surface-2)', borderRadius: 'var(--df-radius-md)', fontSize: '0.70rem', color: 'var(--df-text-muted)' }}>
              <div style={{ fontWeight: 700, color: 'var(--df-text-main)', marginBottom: '0.2rem' }}>
                Devise &amp; Métrologie DZ
              </div>
              Tous les montants sont calculés en Dinars Algériens (DZD) selon le barème officiel Naftal.
            </div>
          </aside>

          {/* CONTENU CENTRAL */}
          <main style={{ flex: 1, minWidth: 0 }}>
            {/* EN-TÊTE PRINCIPAL */}
            <div
              style={{
                padding: '1.25rem 1.5rem',
                background: 'var(--df-bg-surface-1)',
                border: '1px solid var(--df-border-subtle)',
                borderRadius: 'var(--df-radius-lg)',
                marginBottom: '1.25rem',
                boxShadow: 'var(--df-shadow-sm)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '1rem',
              }}
            >
              <div>
                <h1 style={{ fontSize: '1.5rem', fontWeight: 800, margin: '0 0 0.25rem 0', color: 'var(--df-text-main)' }}>
                  Contrôle de Gestion &amp; TCO au Kilomètre / Heure
                </h1>
                <p style={{ fontSize: '0.80rem', color: 'var(--df-text-secondary)', margin: 0 }}>
                  Décomposition analytique des coûts d&apos;exploitation et suivi des écarts budgétaires.
                </p>
              </div>

              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <Button variant="primary" size="sm" onClick={handleOpenAdd}>
                  <IconPlus size={14} />
                  <span>Nouvelle Fiche TCO</span>
                </Button>
              </div>
            </div>

            {/* SYNTHÈSE DES COÛTS */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: '1rem',
                marginBottom: '1.25rem',
              }}
            >
              <Card>
                <span style={{ fontSize: '0.72rem', color: 'var(--df-text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>TCO Moyen Poids Lourds</span>
                <div className="df-mono" style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--df-text-main)', margin: '0.25rem 0' }}>76.20 DA / km</div>
                <span style={{ fontSize: '0.70rem', color: 'var(--df-status-ok)' }}>-3.5% vs budget</span>
              </Card>

              <Card>
                <span style={{ fontSize: '0.72rem', color: 'var(--df-text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Coût Horaire BTP</span>
                <div className="df-mono" style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--df-text-main)', margin: '0.25rem 0' }}>3 406 DA / h</div>
                <span style={{ fontSize: '0.70rem', color: 'var(--df-text-muted)' }}>Par heure de godet</span>
              </Card>

              <Card>
                <span style={{ fontSize: '0.72rem', color: 'var(--df-text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Économie Nette Réalisée</span>
                <div className="df-mono" style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--df-status-ok)', margin: '0.25rem 0' }}>+380 000 DA</div>
                <span style={{ fontSize: '0.70rem', color: 'var(--df-status-ok)' }}>Ce mois vs prévisionnel</span>
              </Card>
            </div>

            {/* TABLEAU TCO AVEC ACTIONS CRUD */}
            <div
              style={{
                background: 'var(--df-bg-surface-1)',
                border: '1px solid var(--df-border-subtle)',
                borderRadius: 'var(--df-radius-lg)',
                overflow: 'hidden',
                boxShadow: 'var(--df-shadow-sm)',
              }}
            >
              <div
                style={{
                  padding: '1rem 1.25rem',
                  borderBottom: '1px solid var(--df-border-subtle)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: '0.75rem',
                }}
              >
                <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--df-text-main)' }}>
                  Grand Livre Analytique des Véhicules ({filteredData.length})
                </div>

                <div style={{ display: 'flex', gap: '0.35rem' }}>
                  {[
                    { id: 'ALL', label: 'Tous' },
                    { id: 'PL', label: 'Poids Lourds' },
                    { id: 'ENGIN', label: 'Engins BTP' },
                    { id: 'VUL', label: 'Utilitaires' },
                  ].map((f) => (
                    <button
                      key={f.id}
                      onClick={() => setSelectedCategory(f.id)}
                      style={{
                        background: selectedCategory === f.id ? 'var(--df-accent-blue)' : 'var(--df-bg-surface-2)',
                        color: selectedCategory === f.id ? '#FFFFFF' : 'var(--df-text-secondary)',
                        border: '1px solid var(--df-border-subtle)',
                        borderRadius: 'var(--df-radius-sm)',
                        padding: '0.35rem 0.75rem',
                        fontSize: '0.76rem',
                        fontWeight: 600,
                        cursor: 'pointer',
                      }}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>
              </div>

              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.82rem' }}>
                  <thead>
                    <tr style={{ background: 'var(--df-bg-surface-2)', borderBottom: '1px solid var(--df-border-subtle)', color: 'var(--df-text-secondary)', textTransform: 'uppercase', fontSize: '0.70rem' }}>
                      <th style={{ padding: '0.75rem 1rem' }}>Immatriculation</th>
                      <th style={{ padding: '0.75rem 1rem' }}>Usage Période</th>
                      <th style={{ padding: '0.75rem 1rem' }}>Carburant Naftal</th>
                      <th style={{ padding: '0.75rem 1rem' }}>Maintenance</th>
                      <th style={{ padding: '0.75rem 1rem' }}>Total DZD</th>
                      <th style={{ padding: '0.75rem 1rem' }}>Coût / km ou h</th>
                      <th style={{ padding: '0.75rem 1rem' }}>Budget Cible</th>
                      <th style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>Actions CRUD</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredData.map((row) => (
                      <tr key={row.id} style={{ borderBottom: '1px solid var(--df-border-subtle)' }}>
                        <td style={{ padding: '0.85rem 1rem' }}>
                          <div style={{ fontWeight: 700, color: 'var(--df-text-main)', fontFamily: 'var(--df-font-mono)' }}>
                            {row.registrationNumber}
                          </div>
                          <div style={{ fontSize: '0.68rem', color: 'var(--df-text-muted)' }}>{row.makeModel}</div>
                        </td>
                        <td style={{ padding: '0.85rem 1rem', fontFamily: 'var(--df-font-mono)' }}>
                          {row.kmOrHoursPeriod.toLocaleString('fr-DZ')} {row.unitType}
                        </td>
                        <td style={{ padding: '0.85rem 1rem', fontFamily: 'var(--df-font-mono)' }}>
                          {row.fuelCostDzd.toLocaleString('fr-DZ')} DA
                        </td>
                        <td style={{ padding: '0.85rem 1rem', fontFamily: 'var(--df-font-mono)' }}>
                          {row.maintenanceCostDzd.toLocaleString('fr-DZ')} DA
                        </td>
                        <td style={{ padding: '0.85rem 1rem', fontFamily: 'var(--df-font-mono)', fontWeight: 700 }}>
                          {row.totalCostDzd.toLocaleString('fr-DZ')} DA
                        </td>
                        <td style={{ padding: '0.85rem 1rem' }}>
                          <div className="df-mono" style={{ fontWeight: 800, color: row.status === 'OVER_BUDGET' ? 'var(--df-status-danger)' : 'var(--df-status-ok)' }}>
                            {row.costPerUnitDzd.toFixed(1)} DA/{row.unitType}
                          </div>
                        </td>
                        <td style={{ padding: '0.85rem 1rem', fontFamily: 'var(--df-font-mono)', color: 'var(--df-text-muted)' }}>
                          {row.targetBudgetPerUnitDzd.toFixed(1)} DA/{row.unitType}
                        </td>
                        <td style={{ padding: '0.85rem 1rem', textAlign: 'right' }}>
                          <div style={{ display: 'inline-flex', gap: '0.35rem' }}>
                            <button
                              onClick={() => handleOpenEdit(row)}
                              title="Modifier cette fiche"
                              style={{
                                background: 'var(--df-bg-surface-2)',
                                border: '1px solid var(--df-border-subtle)',
                                borderRadius: 'var(--df-radius-sm)',
                                padding: '0.35rem 0.55rem',
                                color: 'var(--df-text-secondary)',
                                cursor: 'pointer',
                              }}
                            >
                              <IconEdit size={13} />
                            </button>
                            <button
                              onClick={() => handleDeleteTco(row.id, row.registrationNumber)}
                              title="Supprimer cette fiche"
                              style={{
                                background: 'var(--df-status-danger-bg)',
                                border: '1px solid var(--df-status-danger-border)',
                                borderRadius: 'var(--df-radius-sm)',
                                padding: '0.35rem 0.55rem',
                                color: 'var(--df-status-danger-text)',
                                cursor: 'pointer',
                              }}
                            >
                              <IconTrash size={13} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </main>
        </div>
      </div>

      {/* MODAL CRUD FICHE TCO (CRÉER / MODIFIER) */}
      {isModalOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.65)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 100,
            padding: '1rem',
          }}
        >
          <div
            style={{
              width: '100%',
              maxWidth: '540px',
              background: 'var(--df-bg-surface-1)',
              border: '1px solid var(--df-border-subtle)',
              borderRadius: 'var(--df-radius-lg)',
              boxShadow: 'var(--df-shadow-lg)',
              padding: '1.5rem',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 800, margin: 0, color: 'var(--df-text-main)' }}>
                {editingRecord ? 'Modifier Fiche Coût TCO' : 'Nouvelle Fiche de Coût TCO'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} style={{ background: 'transparent', border: 'none', color: 'var(--df-text-muted)', cursor: 'pointer' }}>
                <IconX size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveTco} style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div>
                  <label style={{ fontSize: '0.74rem', fontWeight: 600, color: 'var(--df-text-muted)', display: 'block', marginBottom: '0.25rem' }}>
                    Immatriculation *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="00421-116-16"
                    value={formState.registrationNumber || ''}
                    onChange={(e) => setFormState({ ...formState, registrationNumber: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '0.5rem 0.75rem',
                      background: 'var(--df-bg-surface-2)',
                      border: '1px solid var(--df-border-subtle)',
                      borderRadius: 'var(--df-radius-sm)',
                      color: 'var(--df-text-main)',
                      fontFamily: 'var(--df-font-mono)',
                    }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '0.74rem', fontWeight: 600, color: 'var(--df-text-muted)', display: 'block', marginBottom: '0.25rem' }}>
                    Modèle Véhicule
                  </label>
                  <input
                    type="text"
                    placeholder="Renault Trucks K 480"
                    value={formState.makeModel || ''}
                    onChange={(e) => setFormState({ ...formState, makeModel: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '0.5rem 0.75rem',
                      background: 'var(--df-bg-surface-2)',
                      border: '1px solid var(--df-border-subtle)',
                      borderRadius: 'var(--df-radius-sm)',
                      color: 'var(--df-text-main)',
                    }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '0.75rem' }}>
                <div>
                  <label style={{ fontSize: '0.74rem', fontWeight: 600, color: 'var(--df-text-muted)', display: 'block', marginBottom: '0.25rem' }}>
                    Usage Période (Distance ou Heures) *
                  </label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={formState.kmOrHoursPeriod || ''}
                    onChange={(e) => setFormState({ ...formState, kmOrHoursPeriod: Number(e.target.value) })}
                    style={{
                      width: '100%',
                      padding: '0.5rem 0.75rem',
                      background: 'var(--df-bg-surface-2)',
                      border: '1px solid var(--df-border-subtle)',
                      borderRadius: 'var(--df-radius-sm)',
                      color: 'var(--df-text-main)',
                      fontFamily: 'var(--df-font-mono)',
                    }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '0.74rem', fontWeight: 600, color: 'var(--df-text-muted)', display: 'block', marginBottom: '0.25rem' }}>
                    Unité
                  </label>
                  <select
                    value={formState.unitType || 'km'}
                    onChange={(e) => setFormState({ ...formState, unitType: e.target.value as any })}
                    style={{
                      width: '100%',
                      padding: '0.5rem 0.75rem',
                      background: 'var(--df-bg-surface-2)',
                      border: '1px solid var(--df-border-subtle)',
                      borderRadius: 'var(--df-radius-sm)',
                      color: 'var(--df-text-main)',
                    }}
                  >
                    <option value="km">Kilomètres (km)</option>
                    <option value="h">Heures Moteur (h)</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div>
                  <label style={{ fontSize: '0.74rem', fontWeight: 600, color: 'var(--df-text-muted)', display: 'block', marginBottom: '0.25rem' }}>
                    Carburant Gasoil (DA)
                  </label>
                  <input
                    type="number"
                    value={formState.fuelCostDzd || 0}
                    onChange={(e) => setFormState({ ...formState, fuelCostDzd: Number(e.target.value) })}
                    style={{
                      width: '100%',
                      padding: '0.5rem 0.75rem',
                      background: 'var(--df-bg-surface-2)',
                      border: '1px solid var(--df-border-subtle)',
                      borderRadius: 'var(--df-radius-sm)',
                      color: 'var(--df-text-main)',
                      fontFamily: 'var(--df-font-mono)',
                    }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '0.74rem', fontWeight: 600, color: 'var(--df-text-muted)', display: 'block', marginBottom: '0.25rem' }}>
                    Maintenance &amp; Pièces (DA)
                  </label>
                  <input
                    type="number"
                    value={formState.maintenanceCostDzd || 0}
                    onChange={(e) => setFormState({ ...formState, maintenanceCostDzd: Number(e.target.value) })}
                    style={{
                      width: '100%',
                      padding: '0.5rem 0.75rem',
                      background: 'var(--df-bg-surface-2)',
                      border: '1px solid var(--df-border-subtle)',
                      borderRadius: 'var(--df-radius-sm)',
                      color: 'var(--df-text-main)',
                      fontFamily: 'var(--df-font-mono)',
                    }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div>
                  <label style={{ fontSize: '0.74rem', fontWeight: 600, color: 'var(--df-text-muted)', display: 'block', marginBottom: '0.25rem' }}>
                    Chauffeur &amp; Missions (DA)
                  </label>
                  <input
                    type="number"
                    value={formState.driverCostDzd || 0}
                    onChange={(e) => setFormState({ ...formState, driverCostDzd: Number(e.target.value) })}
                    style={{
                      width: '100%',
                      padding: '0.5rem 0.75rem',
                      background: 'var(--df-bg-surface-2)',
                      border: '1px solid var(--df-border-subtle)',
                      borderRadius: 'var(--df-radius-sm)',
                      color: 'var(--df-text-main)',
                      fontFamily: 'var(--df-font-mono)',
                    }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '0.74rem', fontWeight: 600, color: 'var(--df-text-muted)', display: 'block', marginBottom: '0.25rem' }}>
                    Budget Cible par Unité (DA/{formState.unitType})
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={formState.targetBudgetPerUnitDzd || 0}
                    onChange={(e) => setFormState({ ...formState, targetBudgetPerUnitDzd: Number(e.target.value) })}
                    style={{
                      width: '100%',
                      padding: '0.5rem 0.75rem',
                      background: 'var(--df-bg-surface-2)',
                      border: '1px solid var(--df-border-subtle)',
                      borderRadius: 'var(--df-radius-sm)',
                      color: 'var(--df-text-main)',
                      fontFamily: 'var(--df-font-mono)',
                    }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.65rem', marginTop: '1rem' }}>
                <Button variant="secondary" size="sm" type="button" onClick={() => setIsModalOpen(false)}>
                  Annuler
                </Button>
                <Button variant="primary" size="sm" type="submit">
                  {editingRecord ? 'Enregistrer Modifications' : 'Créer la Fiche TCO'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
