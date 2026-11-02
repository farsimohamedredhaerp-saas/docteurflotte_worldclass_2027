'use client';

import React, { useState } from 'react';
import { Navbar } from '../../components/navigation/Navbar';
import { Card } from '../../components/Card';
import { Badge } from '../../components/Badge';
import { Button } from '../../components/Button';
import {
  IconTruck,
  IconShieldCheck,
  IconAlertTriangle,
  IconSearch,
  IconCheck,
  IconActivity,
  IconClock,
  IconDownload,
  IconPlus,
  IconEdit,
  IconTrash,
  IconX,
} from '../../components/navigation/TechIcons';

export interface DriverRecord {
  id: string;
  name: string;
  matriculeNumber: string;
  phone: string;
  licenseCategory: 'C1' | 'C2' | 'E' | 'D' | 'B' | 'BTP_ENGIN';
  licenseNumber: string;
  licenseExpiry: string;
  medicalCheckExpiry: string;
  assignedVehiclePlate: string;
  assignedVehicleModel: string;
  currentSiteOrCorridor: string;
  ecoDrivingScore: number;
  harshBrakingCount: number;
  excessiveIdleMinutes: number;
  status: 'ON_DUTY' | 'AVAILABLE' | 'REST' | 'LICENSE_WARNING';
}

const INITIAL_DRIVERS: DriverRecord[] = [
  {
    id: 'drv-01',
    name: 'Mourad Benali',
    matriculeNumber: 'DRV-16-042',
    phone: '0550 12 34 56',
    licenseCategory: 'E',
    licenseNumber: 'DZ-16-9812401',
    licenseExpiry: '2027-04-15',
    medicalCheckExpiry: '2026-08-10',
    assignedVehiclePlate: '00421-116-16',
    assignedVehicleModel: 'Renault Trucks K 480 6x4',
    currentSiteOrCorridor: 'Corridor RN1 Ghardaïa',
    ecoDrivingScore: 92,
    harshBrakingCount: 1,
    excessiveIdleMinutes: 8,
    status: 'ON_DUTY',
  },
  {
    id: 'drv-02',
    name: 'Karim Bouzid',
    matriculeNumber: 'DRV-16-089',
    phone: '0661 45 78 90',
    licenseCategory: 'C2',
    licenseNumber: 'DZ-16-4412092',
    licenseExpiry: '2025-11-18',
    medicalCheckExpiry: '2025-11-02',
    assignedVehiclePlate: '01892-116-16',
    assignedVehicleModel: 'Mercedes-Benz Actros 3340',
    currentSiteOrCorridor: 'Base Rouiba (16)',
    ecoDrivingScore: 68,
    harshBrakingCount: 6,
    excessiveIdleMinutes: 42,
    status: 'LICENSE_WARNING',
  },
  {
    id: 'drv-03',
    name: 'Rachid Mebarki',
    matriculeNumber: 'DRV-23-014',
    phone: '0770 98 12 34',
    licenseCategory: 'BTP_ENGIN',
    licenseNumber: 'CACES-DZ-88129',
    licenseExpiry: '2028-02-20',
    medicalCheckExpiry: '2026-05-15',
    assignedVehiclePlate: 'ENG-23-018-DZ',
    assignedVehicleModel: 'Caterpillar 320D (Pelle)',
    currentSiteOrCorridor: 'Chantier Minier Annaba (23)',
    ecoDrivingScore: 94,
    harshBrakingCount: 0,
    excessiveIdleMinutes: 12,
    status: 'ON_DUTY',
  },
  {
    id: 'drv-04',
    name: 'Yacine Belhadj',
    matriculeNumber: 'DRV-30-055',
    phone: '0555 33 22 11',
    licenseCategory: 'E',
    licenseNumber: 'DZ-30-1092841',
    licenseExpiry: '2026-10-30',
    medicalCheckExpiry: '2026-04-12',
    assignedVehiclePlate: '08341-118-30',
    assignedVehicleModel: 'Shacman F3000 Benne',
    currentSiteOrCorridor: 'Base Hassi Messaoud (30)',
    ecoDrivingScore: 85,
    harshBrakingCount: 2,
    excessiveIdleMinutes: 18,
    status: 'ON_DUTY',
  },
  {
    id: 'drv-05',
    name: 'Ahmed Touati',
    matriculeNumber: 'DRV-31-012',
    phone: '0662 88 99 00',
    licenseCategory: 'B',
    licenseNumber: 'DZ-31-5510294',
    licenseExpiry: '2029-07-14',
    medicalCheckExpiry: '2026-11-20',
    assignedVehiclePlate: '00912-120-31',
    assignedVehicleModel: 'Toyota Hilux 2.4 D-4D',
    currentSiteOrCorridor: 'Pôle Oran (31)',
    ecoDrivingScore: 89,
    harshBrakingCount: 1,
    excessiveIdleMinutes: 6,
    status: 'AVAILABLE',
  },
];

export default function DriversPage() {
  const [drivers, setDrivers] = useState<DriverRecord[]>(INITIAL_DRIVERS);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [notification, setNotification] = useState<string | null>(null);

  // Modal CRUD State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDriver, setEditingDriver] = useState<DriverRecord | null>(null);
  const [formState, setFormState] = useState<Partial<DriverRecord>>({
    name: '',
    matriculeNumber: '',
    phone: '',
    licenseCategory: 'E',
    licenseNumber: '',
    licenseExpiry: '',
    medicalCheckExpiry: '',
    assignedVehiclePlate: '',
    assignedVehicleModel: '',
    currentSiteOrCorridor: 'Base Centrale Rouiba',
    status: 'AVAILABLE',
  });

  const handleOpenAdd = () => {
    setEditingDriver(null);
    setFormState({
      name: '',
      matriculeNumber: `DRV-16-${Math.floor(100 + Math.random() * 900)}`,
      phone: '0550 ',
      licenseCategory: 'E',
      licenseNumber: 'DZ-16-',
      licenseExpiry: '',
      medicalCheckExpiry: '',
      assignedVehiclePlate: '',
      assignedVehicleModel: '',
      currentSiteOrCorridor: 'Base Rouiba (16)',
      status: 'AVAILABLE',
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (driver: DriverRecord) => {
    setEditingDriver(driver);
    setFormState({ ...driver });
    setIsModalOpen(true);
  };

  const handleSaveDriver = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formState.name || !formState.licenseNumber) {
      alert('Veuillez renseigner le nom et le numéro de permis.');
      return;
    }

    if (editingDriver) {
      setDrivers((prev) =>
        prev.map((d) => (d.id === editingDriver.id ? ({ ...d, ...formState } as DriverRecord) : d))
      );
      setNotification(`✓ Fiche conducteur de ${formState.name} mise à jour.`);
    } else {
      const newDriver: DriverRecord = {
        id: `drv-${Date.now().toString().slice(-4)}`,
        name: formState.name || '',
        matriculeNumber: formState.matriculeNumber || `DRV-${Date.now().toString().slice(-3)}`,
        phone: formState.phone || '0550 00 00 00',
        licenseCategory: (formState.licenseCategory as DriverRecord['licenseCategory']) || 'E',
        licenseNumber: formState.licenseNumber || '',
        licenseExpiry: formState.licenseExpiry || '2028-01-01',
        medicalCheckExpiry: formState.medicalCheckExpiry || '2026-12-31',
        assignedVehiclePlate: formState.assignedVehiclePlate || 'EN ATTENTE',
        assignedVehicleModel: formState.assignedVehicleModel || 'Non Affecté',
        currentSiteOrCorridor: formState.currentSiteOrCorridor || 'Base Centrale',
        ecoDrivingScore: 85,
        harshBrakingCount: 0,
        excessiveIdleMinutes: 0,
        status: (formState.status as DriverRecord['status']) || 'AVAILABLE',
      };
      setDrivers((prev) => [newDriver, ...prev]);
      setNotification(`✓ Nouveau conducteur ${newDriver.name} enregistré avec succès.`);
    }

    setIsModalOpen(false);
    setTimeout(() => setNotification(null), 5000);
  };

  const handleDeleteDriver = (id: string, name: string) => {
    if (confirm(`Confirmez-vous la suppression du conducteur ${name} ?`)) {
      setDrivers((prev) => prev.filter((d) => d.id !== id));
      setNotification(`ℹ Conducteur ${name} retiré de l'effectif.`);
      setTimeout(() => setNotification(null), 4000);
    }
  };

  const filteredDrivers = drivers.filter((d) => {
    if (categoryFilter !== 'ALL') {
      if (categoryFilter === 'HEAVY' && d.licenseCategory !== 'C1' && d.licenseCategory !== 'C2' && d.licenseCategory !== 'E') return false;
      if (categoryFilter === 'BTP' && d.licenseCategory !== 'BTP_ENGIN') return false;
      if (categoryFilter === 'LIGHT' && d.licenseCategory !== 'B') return false;
    }
    if (statusFilter !== 'ALL' && d.status !== statusFilter) {
      return false;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      return (
        d.name.toLowerCase().includes(q) ||
        d.matriculeNumber.toLowerCase().includes(q) ||
        d.assignedVehiclePlate.toLowerCase().includes(q) ||
        d.currentSiteOrCorridor.toLowerCase().includes(q)
      );
    }
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
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
            }}
          >
            <span style={{ color: 'var(--df-status-ok)' }}>
              <IconCheck size={16} strokeWidth={2} />
            </span>
            <span style={{ fontSize: '0.875rem', fontWeight: 600 }}>{notification}</span>
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
              Filtres Effectif &amp; Missions
            </div>

            <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
              {[
                { id: 'ALL', label: 'Tout l\'Effectif', count: drivers.length, icon: '👥' },
                { id: 'ON_DUTY', label: 'En Route / Mission', count: drivers.filter((d) => d.status === 'ON_DUTY').length, icon: '🚛' },
                { id: 'AVAILABLE', label: 'Disponibles', count: drivers.filter((d) => d.status === 'AVAILABLE').length, icon: '🟢' },
                { id: 'LICENSE_WARNING', label: 'Alerte Permis / Visite', count: drivers.filter((d) => d.status === 'LICENSE_WARNING').length, icon: '⚠️' },
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

            {/* ACTION CRUD PRINCIPALE */}
            <Button variant="primary" size="sm" onClick={handleOpenAdd} style={{ width: '100%', justifyContent: 'center' }}>
              <IconPlus size={14} />
              <span>+ Nouveau Chauffeur</span>
            </Button>

            <div style={{ marginTop: '1.25rem', padding: '0.65rem', background: 'var(--df-bg-surface-2)', borderRadius: 'var(--df-radius-md)', fontSize: '0.70rem', color: 'var(--df-text-muted)' }}>
              <div style={{ fontWeight: 700, color: 'var(--df-text-main)', marginBottom: '0.2rem' }}>
                Habilitations Code Route DZ
              </div>
              Contrôle strict des permis C1, C2, E et attestations médicales obligatoires.
            </div>
          </aside>

          {/* CONTENU CENTRAL PRINCIPAL */}
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
                  Ressources Humaines &amp; Équipages de Flotte
                </h1>
                <p style={{ fontSize: '0.80rem', color: 'var(--df-text-secondary)', margin: 0 }}>
                  Suivi des conducteurs, validité des permis et gestion opérationnelle des affectations.
                </p>
              </div>

              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <Button variant="primary" size="sm" onClick={handleOpenAdd}>
                  <IconPlus size={14} />
                  <span>Ajouter Chauffeur</span>
                </Button>
              </div>
            </div>

            {/* BARRE DE RECHERCHE ET FILTRES RAPIDES */}
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
                <div style={{ position: 'relative', width: '100%', maxWidth: '320px' }}>
                  <input
                    type="text"
                    placeholder="Filtrer chauffeur, matricule, camion..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '0.45rem 0.85rem',
                      background: 'var(--df-bg-surface-2)',
                      border: '1px solid var(--df-border-subtle)',
                      borderRadius: 'var(--df-radius-md)',
                      fontSize: '0.80rem',
                      color: 'var(--df-text-main)',
                      outline: 'none',
                    }}
                  />
                </div>

                <div style={{ display: 'flex', gap: '0.35rem' }}>
                  {[
                    { id: 'ALL', label: 'Toutes Catégories' },
                    { id: 'HEAVY', label: 'Permis Poids Lourds (C/E)' },
                    { id: 'BTP', label: 'Engins BTP' },
                    { id: 'LIGHT', label: 'Utilitaires (B)' },
                  ].map((f) => (
                    <button
                      key={f.id}
                      onClick={() => setCategoryFilter(f.id)}
                      style={{
                        background: categoryFilter === f.id ? 'var(--df-accent-blue)' : 'var(--df-bg-surface-2)',
                        color: categoryFilter === f.id ? '#FFFFFF' : 'var(--df-text-secondary)',
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

              {/* TABLEAU HAUTE DENSITÉ DES CONDUCTEURS AVEC ACTIONS CRUD */}
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.82rem' }}>
                  <thead>
                    <tr style={{ background: 'var(--df-bg-surface-2)', borderBottom: '1px solid var(--df-border-subtle)', color: 'var(--df-text-secondary)', textTransform: 'uppercase', fontSize: '0.70rem' }}>
                      <th style={{ padding: '0.75rem 1rem' }}>Conducteur &amp; Contact</th>
                      <th style={{ padding: '0.75rem 1rem' }}>Catégorie &amp; Permis</th>
                      <th style={{ padding: '0.75rem 1rem' }}>Validité Permis</th>
                      <th style={{ padding: '0.75rem 1rem' }}>Visite Médicale</th>
                      <th style={{ padding: '0.75rem 1rem' }}>Véhicule Affecté</th>
                      <th style={{ padding: '0.75rem 1rem' }}>Site / Mission</th>
                      <th style={{ padding: '0.75rem 1rem' }}>Score Éco</th>
                      <th style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>Actions CRUD</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredDrivers.map((d) => (
                      <tr key={d.id} style={{ borderBottom: '1px solid var(--df-border-subtle)' }}>
                        <td style={{ padding: '0.85rem 1rem' }}>
                          <div style={{ fontWeight: 700, color: 'var(--df-text-main)' }}>{d.name}</div>
                          <div style={{ fontSize: '0.70rem', color: 'var(--df-text-muted)', fontFamily: 'var(--df-font-mono)' }}>
                            {d.matriculeNumber} • {d.phone}
                          </div>
                        </td>
                        <td style={{ padding: '0.85rem 1rem' }}>
                          <Badge variant="neutral">Permis {d.licenseCategory}</Badge>
                          <div style={{ fontSize: '0.68rem', color: 'var(--df-text-muted)', fontFamily: 'var(--df-font-mono)', marginTop: '0.2rem' }}>
                            {d.licenseNumber}
                          </div>
                        </td>
                        <td style={{ padding: '0.85rem 1rem', fontFamily: 'var(--df-font-mono)' }}>{d.licenseExpiry}</td>
                        <td style={{ padding: '0.85rem 1rem', fontFamily: 'var(--df-font-mono)' }}>
                          <span style={{ color: d.status === 'LICENSE_WARNING' ? 'var(--df-status-warning)' : 'inherit', fontWeight: d.status === 'LICENSE_WARNING' ? 700 : 400 }}>
                            {d.medicalCheckExpiry}
                          </span>
                        </td>
                        <td style={{ padding: '0.85rem 1rem' }}>
                          <div style={{ fontWeight: 700, fontFamily: 'var(--df-font-mono)', color: 'var(--df-accent-blue)' }}>
                            {d.assignedVehiclePlate}
                          </div>
                          <div style={{ fontSize: '0.68rem', color: 'var(--df-text-muted)' }}>{d.assignedVehicleModel}</div>
                        </td>
                        <td style={{ padding: '0.85rem 1rem', fontSize: '0.76rem' }}>{d.currentSiteOrCorridor}</td>
                        <td style={{ padding: '0.85rem 1rem' }}>
                          <div className="df-mono" style={{ fontWeight: 800, color: d.ecoDrivingScore >= 80 ? 'var(--df-status-ok)' : 'var(--df-status-warning)' }}>
                            {d.ecoDrivingScore}/100
                          </div>
                        </td>
                        <td style={{ padding: '0.85rem 1rem', textAlign: 'right' }}>
                          <div style={{ display: 'inline-flex', gap: '0.35rem' }}>
                            <button
                              onClick={() => handleOpenEdit(d)}
                              title="Modifier ce conducteur"
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
                              onClick={() => handleDeleteDriver(d.id, d.name)}
                              title="Supprimer ce conducteur"
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

      {/* MODAL CRUD CHAUFFEUR (CRÉER / MODIFIER) */}
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
                {editingDriver ? 'Modifier Fiche Chauffeur' : 'Nouveau Conducteur / Opérateur'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} style={{ background: 'transparent', border: 'none', color: 'var(--df-text-muted)', cursor: 'pointer' }}>
                <IconX size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveDriver} style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div>
                  <label style={{ fontSize: '0.74rem', fontWeight: 600, color: 'var(--df-text-muted)', display: 'block', marginBottom: '0.25rem' }}>
                    Nom &amp; Prénom *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Sofiane Djebbar"
                    value={formState.name || ''}
                    onChange={(e) => setFormState({ ...formState, name: e.target.value })}
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

                <div>
                  <label style={{ fontSize: '0.74rem', fontWeight: 600, color: 'var(--df-text-muted)', display: 'block', marginBottom: '0.25rem' }}>
                    Téléphone
                  </label>
                  <input
                    type="text"
                    placeholder="0550 00 00 00"
                    value={formState.phone || ''}
                    onChange={(e) => setFormState({ ...formState, phone: e.target.value })}
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

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div>
                  <label style={{ fontSize: '0.74rem', fontWeight: 600, color: 'var(--df-text-muted)', display: 'block', marginBottom: '0.25rem' }}>
                    Catégorie Permis
                  </label>
                  <select
                    value={formState.licenseCategory || 'E'}
                    onChange={(e) => setFormState({ ...formState, licenseCategory: e.target.value as DriverRecord['licenseCategory'] })}
                    style={{
                      width: '100%',
                      padding: '0.5rem 0.75rem',
                      background: 'var(--df-bg-surface-2)',
                      border: '1px solid var(--df-border-subtle)',
                      borderRadius: 'var(--df-radius-sm)',
                      color: 'var(--df-text-main)',
                    }}
                  >
                    <option value="E">Permis E (Semi-remorque)</option>
                    <option value="C2">Permis C2 (Poids Lourds &gt; 19t)</option>
                    <option value="C1">Permis C1 (Porteurs &lt; 19t)</option>
                    <option value="BTP_ENGIN">CACES / Engins BTP</option>
                    <option value="B">Permis B (Utilitaires)</option>
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: '0.74rem', fontWeight: 600, color: 'var(--df-text-muted)', display: 'block', marginBottom: '0.25rem' }}>
                    N° de Permis *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="DZ-16-..."
                    value={formState.licenseNumber || ''}
                    onChange={(e) => setFormState({ ...formState, licenseNumber: e.target.value })}
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
                    Date Expiration Permis
                  </label>
                  <input
                    type="date"
                    value={formState.licenseExpiry || ''}
                    onChange={(e) => setFormState({ ...formState, licenseExpiry: e.target.value })}
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

                <div>
                  <label style={{ fontSize: '0.74rem', fontWeight: 600, color: 'var(--df-text-muted)', display: 'block', marginBottom: '0.25rem' }}>
                    Validité Visite Médicale
                  </label>
                  <input
                    type="date"
                    value={formState.medicalCheckExpiry || ''}
                    onChange={(e) => setFormState({ ...formState, medicalCheckExpiry: e.target.value })}
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

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div>
                  <label style={{ fontSize: '0.74rem', fontWeight: 600, color: 'var(--df-text-muted)', display: 'block', marginBottom: '0.25rem' }}>
                    Immatriculation Affectée
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: 00421-116-16"
                    value={formState.assignedVehiclePlate || ''}
                    onChange={(e) => setFormState({ ...formState, assignedVehiclePlate: e.target.value })}
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
                    Statut Opérationnel
                  </label>
                  <select
                    value={formState.status || 'AVAILABLE'}
                    onChange={(e) => setFormState({ ...formState, status: e.target.value as DriverRecord['status'] })}
                    style={{
                      width: '100%',
                      padding: '0.5rem 0.75rem',
                      background: 'var(--df-bg-surface-2)',
                      border: '1px solid var(--df-border-subtle)',
                      borderRadius: 'var(--df-radius-sm)',
                      color: 'var(--df-text-main)',
                    }}
                  >
                    <option value="AVAILABLE">Disponible</option>
                    <option value="ON_DUTY">En Route / Mission</option>
                    <option value="REST">Repos Légal</option>
                    <option value="LICENSE_WARNING">Visite Médicale Urgente</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.65rem', marginTop: '1rem' }}>
                <Button variant="secondary" size="sm" type="button" onClick={() => setIsModalOpen(false)}>
                  Annuler
                </Button>
                <Button variant="primary" size="sm" type="submit">
                  {editingDriver ? 'Enregistrer Modifications' : 'Créer Chauffeur'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
