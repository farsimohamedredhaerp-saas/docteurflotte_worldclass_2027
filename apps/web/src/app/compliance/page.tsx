'use client';

import React, { useState, useEffect } from 'react';
import { useDemoMode } from '../../context/DemoModeContext';
import { Navbar } from '../../components/navigation/Navbar';
import { Card } from '../../components/Card';
import { Badge } from '../../components/Badge';
import { Button } from '../../components/Button';
import {
  IconShieldCheck,
  IconAlertTriangle,
  IconClock,
  IconCheck,
  IconTruck,
  IconSlidersHorizontal,
  IconChevronRight,
  IconDownload,
  IconWrench,
  IconPlus,
  IconEdit,
  IconTrash,
  IconX,
  IconFileText,
  IconCompass,
  IconCreditCard,
} from '../../components/navigation/TechIcons';

export type ComplianceTab = 'ENACTA' | 'INSURANCE' | 'WILAYAS' | 'TAXES';

export interface EnactaRecord {
  id: string;
  registrationNumber: string;
  makeModel: string;
  category: 'PL' | 'BTP' | 'VL';
  lastInspectionDate: string;
  expiryDate: string;
  daysRemaining: number;
  centerName: string;
  wilaya: string;
  status: 'VALID' | 'WARNING' | 'EXPIRED';
  defectCount: number;
}

export interface InsuranceRecord {
  id: string;
  registrationNumber: string;
  makeModel: string;
  insurer: 'SAA' | 'CAAT' | 'CASH' | 'MACIR_VIE' | 'ALLIANCE';
  policyNumber: string;
  expiryDate: string;
  daysRemaining: number;
  coverageType: 'TOUS_RISQUES' | 'TIERS_COLLISION' | 'RESPONSABILITE_CIVILE';
  status: 'VALID' | 'WARNING' | 'EXPIRED';
}

interface WilayaRestriction {
  wilayaCode: number;
  wilayaName: string;
  tonnageLimit: number;
  restrictedHours: string;
  bypassRoute: string;
  legalReference: string;
  activeStatus: 'STRICT_PEAK' | 'NIGHT_EXEMPT' | 'SPECIAL_PERMIT';
}

const WILAYA_RESTRICTIONS: WilayaRestriction[] = [
  {
    wilayaCode: 16,
    wilayaName: 'Alger',
    tonnageLimit: 5.5,
    restrictedHours: '06h30 - 09h30 & 16h00 - 19h30',
    bypassRoute: "2e Rocade Sud (Boudouaou - Staouéli - Zéralda)",
    legalReference: 'Arrêté de Wilaya N° 1422 / JORADP',
    activeStatus: 'STRICT_PEAK',
  },
  {
    wilayaCode: 31,
    wilayaName: 'Oran',
    tonnageLimit: 7.5,
    restrictedHours: '07h00 - 09h30 & 16h30 - 19h00',
    bypassRoute: "4e Périphérique d'Oran / Pénétrante Est",
    legalReference: 'Arrêté N° 890 / Régulation Urbaine',
    activeStatus: 'STRICT_PEAK',
  },
  {
    wilayaCode: 25,
    wilayaName: 'Constantine',
    tonnageLimit: 5.5,
    restrictedHours: '06h45 - 09h15 & 16h00 - 18h45',
    bypassRoute: "Contournement Autoroute A1 (El Khroub - Didouche)",
    legalReference: 'Arrêté N° 512 / Transport Lourd',
    activeStatus: 'STRICT_PEAK',
  },
  {
    wilayaCode: 30,
    wilayaName: 'Ouargla / Hassi Messaoud',
    tonnageLimit: 44.0,
    restrictedHours: 'Circulation continue 24/7 (Couloir Pétrolier)',
    bypassRoute: 'RN3 / Axe Logistique Puits Sonatrach',
    legalReference: 'Dérogation Convoi Exceptionnel Hydrocarbures',
    activeStatus: 'SPECIAL_PERMIT',
  },
];

export default function CompliancePage() {
  const { isDemoMode } = useDemoMode();
  const [activeTab, setActiveTab] = useState<'ENACTA' | 'INSURANCE' | 'WILAYAS' | 'TAXES'>('ENACTA');
  const [enactaList, setEnactaList] = useState<EnactaRecord[]>([]);
  const [insuranceList, setInsuranceList] = useState<InsuranceRecord[]>([]);
  const [notification, setNotification] = useState<string | null>(null);

  useEffect(() => {
    if (isDemoMode) {
      import('@/lib/simulation-sandbox').then((sandbox) => {
        setEnactaList(sandbox.MOCK_SANDBOX_ENACTA);
        setInsuranceList(sandbox.MOCK_SANDBOX_INSURANCE);
      });
    } else {
      setEnactaList([]);
      setInsuranceList([]);
    }
  }, [isDemoMode]);

  // États pour les modales CRUD
  const [isEnactaModalOpen, setIsEnactaModalOpen] = useState(false);
  const [editingEnacta, setEditingEnacta] = useState<EnactaRecord | null>(null);
  const [enactaForm, setEnactaForm] = useState<Partial<EnactaRecord>>({
    registrationNumber: '',
    makeModel: '',
    category: 'PL',
    lastInspectionDate: new Date().toISOString().split('T')[0],
    expiryDate: '',
    centerName: 'Centre ENACTA Rouiba (16)',
    wilaya: 'Alger (16)',
    status: 'VALID',
  });

  const [isInsuranceModalOpen, setIsInsuranceModalOpen] = useState(false);
  const [editingInsurance, setEditingInsurance] = useState<InsuranceRecord | null>(null);
  const [insuranceForm, setInsuranceForm] = useState<Partial<InsuranceRecord>>({
    registrationNumber: '',
    makeModel: '',
    insurer: 'CAAT',
    policyNumber: '',
    expiryDate: '',
    coverageType: 'TOUS_RISQUES',
    status: 'VALID',
  });

  // Gestion ENACTA CRUD
  const handleOpenAddEnacta = () => {
    setEditingEnacta(null);
    setEnactaForm({
      registrationNumber: '',
      makeModel: '',
      category: 'PL',
      lastInspectionDate: new Date().toISOString().split('T')[0],
      expiryDate: '',
      centerName: 'Centre ENACTA Rouiba (16)',
      wilaya: 'Alger (16)',
      status: 'VALID',
    });
    setIsEnactaModalOpen(true);
  };

  const handleOpenEditEnacta = (rec: EnactaRecord) => {
    setEditingEnacta(rec);
    setEnactaForm({ ...rec });
    setIsEnactaModalOpen(true);
  };

  const handleSaveEnacta = (e: React.FormEvent) => {
    e.preventDefault();
    if (!enactaForm.registrationNumber || !enactaForm.expiryDate) {
      alert('Veuillez remplir l\'immatriculation et la date d\'échéance.');
      return;
    }

    if (editingEnacta) {
      setEnactaList((prev) =>
        prev.map((item) =>
          item.id === editingEnacta.id ? ({ ...item, ...enactaForm } as EnactaRecord) : item
        )
      );
      setNotification(`Contrôle ENACTA mis à jour pour ${enactaForm.registrationNumber}`);
    } else {
      const newRec: EnactaRecord = {
        id: `EN-${Date.now().toString().slice(-4)}`,
        registrationNumber: enactaForm.registrationNumber || '',
        makeModel: enactaForm.makeModel || 'Véhicule',
        category: (enactaForm.category as EnactaRecord['category']) || 'PL',
        lastInspectionDate: enactaForm.lastInspectionDate || '',
        expiryDate: enactaForm.expiryDate || '',
        daysRemaining: 180,
        centerName: enactaForm.centerName || 'Centre Agréé',
        wilaya: enactaForm.wilaya || 'Alger (16)',
        status: (enactaForm.status as EnactaRecord['status']) || 'VALID',
        defectCount: 0,
      };
      setEnactaList((prev) => [newRec, ...prev]);
      setNotification(`Nouveau contrôle ENACTA consigné pour ${newRec.registrationNumber}`);
    }

    setIsEnactaModalOpen(false);
    setTimeout(() => setNotification(null), 5000);
  };

  const handleDeleteEnacta = (id: string, plate: string) => {
    if (confirm(`Êtes-vous sûr de vouloir supprimer le contrôle de ${plate} ?`)) {
      setEnactaList((prev) => prev.filter((i) => i.id !== id));
      setNotification(`Contrôle ENACTA supprimé pour ${plate}`);
      setTimeout(() => setNotification(null), 4000);
    }
  };

  // Gestion Assurance CRUD
  const handleOpenAddInsurance = () => {
    setEditingInsurance(null);
    setInsuranceForm({
      registrationNumber: '',
      makeModel: '',
      insurer: 'CAAT',
      policyNumber: '',
      expiryDate: '',
      coverageType: 'TOUS_RISQUES',
      status: 'VALID',
    });
    setIsInsuranceModalOpen(true);
  };

  const handleOpenEditInsurance = (ins: InsuranceRecord) => {
    setEditingInsurance(ins);
    setInsuranceForm({ ...ins });
    setIsInsuranceModalOpen(true);
  };

  const handleSaveInsurance = (e: React.FormEvent) => {
    e.preventDefault();
    if (!insuranceForm.registrationNumber || !insuranceForm.policyNumber) {
      alert('Veuillez remplir l\'immatriculation et le numéro de police.');
      return;
    }

    if (editingInsurance) {
      setInsuranceList((prev) =>
        prev.map((item) =>
          item.id === editingInsurance.id ? ({ ...item, ...insuranceForm } as InsuranceRecord) : item
        )
      );
      setNotification(`Police d'assurance mise à jour pour ${insuranceForm.registrationNumber}`);
    } else {
      const newIns: InsuranceRecord = {
        id: `INS-${Date.now().toString().slice(-4)}`,
        registrationNumber: insuranceForm.registrationNumber || '',
        makeModel: insuranceForm.makeModel || 'Véhicule',
        insurer: (insuranceForm.insurer as InsuranceRecord['insurer']) || 'CAAT',
        policyNumber: insuranceForm.policyNumber || '',
        expiryDate: insuranceForm.expiryDate || '',
        daysRemaining: 365,
        coverageType: (insuranceForm.coverageType as InsuranceRecord['coverageType']) || 'TOUS_RISQUES',
        status: (insuranceForm.status as InsuranceRecord['status']) || 'VALID',
      };
      setInsuranceList((prev) => [newIns, ...prev]);
      setNotification(`Nouvelle police d'assurance consignée pour ${newIns.registrationNumber}`);
    }

    setIsInsuranceModalOpen(false);
    setTimeout(() => setNotification(null), 5000);
  };

  const handleDeleteInsurance = (id: string, plate: string) => {
    if (confirm(`Êtes-vous sûr de vouloir supprimer la police de ${plate} ?`)) {
      setInsuranceList((prev) => prev.filter((i) => i.id !== id));
      setNotification(`ℹ Police d'assurance supprimée pour ${plate}`);
      setTimeout(() => setNotification(null), 4000);
    }
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--df-bg-base)', color: 'var(--df-text-main)' }}>
      {/* 1. BARRE HORIZONTALE PRINCIPALE */}
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

        {/* 2. LAYOUT DUAL-BAR : BARRE VERTICALE CONTEXTUELLE + CONTENU PRINCIPAL */}
        <div style={{ display: 'flex', gap: '1.25rem', alignItems: 'flex-start' }}>
          {/* BARRE VERTICALE CONTEXTUELLE (SIDEBAR) */}
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
              Piliers Réglementaires DZ
            </div>

            <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
              {[
                { id: 'ENACTA', label: 'Contrôles ENACTA', count: enactaList.length, icon: <IconShieldCheck size={14} /> },
                { id: 'INSURANCE', label: 'Assurances & Cartes', count: insuranceList.length, icon: <IconFileText size={14} /> },
                { id: 'WILAYAS', label: 'Restrictions Wilayas', count: WILAYA_RESTRICTIONS.length, icon: <IconCompass size={14} /> },
                { id: 'TAXES', label: 'Vignettes & Fiscalité', icon: <IconCreditCard size={14} /> },
              ].map((item) => (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id as ComplianceTab)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '0.60rem 0.75rem',
                    borderRadius: 'var(--df-radius-md)',
                    border: activeTab === item.id ? '1px solid var(--df-accent-blue)' : '1px solid transparent',
                    background: activeTab === item.id ? 'var(--df-accent-blue-subtle)' : 'transparent',
                    color: activeTab === item.id ? 'var(--df-accent-blue)' : 'var(--df-text-secondary)',
                    fontWeight: activeTab === item.id ? 700 : 500,
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
                  {item.count !== undefined && (
                    <span
                      className="df-mono"
                      style={{
                        fontSize: '0.68rem',
                        padding: '1px 5px',
                        borderRadius: '4px',
                        background: activeTab === item.id ? 'var(--df-accent-blue)' : 'var(--df-bg-surface-2)',
                        color: activeTab === item.id ? '#FFFFFF' : 'var(--df-text-muted)',
                      }}
                    >
                      {item.count}
                    </span>
                  )}
                </button>
              ))}
            </nav>

            <div style={{ height: '1px', background: 'var(--df-border-subtle)', margin: '1rem 0' }} />

            {/* BOUTONS D'ACTION CRUD DANS LA SIDEBAR */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <Button variant="primary" size="sm" onClick={handleOpenAddEnacta} style={{ width: '100%', justifyContent: 'center' }}>
                <IconPlus size={14} />
                <span>+ Visite ENACTA</span>
              </Button>

              <Button variant="secondary" size="sm" onClick={handleOpenAddInsurance} style={{ width: '100%', justifyContent: 'center' }}>
                <IconPlus size={14} />
                <span>+ Police Assurance</span>
              </Button>
            </div>

            <div style={{ marginTop: '1.25rem', padding: '0.65rem', background: 'var(--df-bg-surface-2)', borderRadius: 'var(--df-radius-md)', fontSize: '0.70rem', color: 'var(--df-text-muted)' }}>
              <div style={{ fontWeight: 700, color: 'var(--df-text-main)', marginBottom: '0.2rem' }}>
                Conformité Loi 18-07
              </div>
              Toutes les données réglementaires sont hébergées souverainement en Algérie.
            </div>
          </aside>

          {/* CONTENU CENTRAL PRINCIPAL */}
          <main style={{ flex: 1, minWidth: 0 }}>
            {/* EN-TÊTE DE LA SECTION ACTIVE */}
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
                  {activeTab === 'ENACTA' && 'Contrôles Techniques Poids Lourds & VL (ENACTA)'}
                  {activeTab === 'INSURANCE' && 'Portefeuille des Polices d\'Assurances (Algérie)'}
                  {activeTab === 'WILAYAS' && 'Restrictions de Circulation Poids Lourds par Wilaya'}
                  {activeTab === 'TAXES' && 'Fiscalité des Véhicules & Vignettes LF 2025/2026'}
                </h1>
                <p style={{ fontSize: '0.80rem', color: 'var(--df-text-secondary)', margin: 0 }}>
                  Gestion active des obligations légales avec mise à jour et traçabilité en temps réel.
                </p>
              </div>

              <div>
                {activeTab === 'ENACTA' && (
                  <Button variant="primary" size="sm" onClick={handleOpenAddEnacta}>
                    <IconPlus size={14} />
                    <span>Ajouter Contrôle</span>
                  </Button>
                )}
                {activeTab === 'INSURANCE' && (
                  <Button variant="primary" size="sm" onClick={handleOpenAddInsurance}>
                    <IconPlus size={14} />
                    <span>Ajouter Police</span>
                  </Button>
                )}
              </div>
            </div>

            {/* TABLEAU ENACTA AVEC ACTIONS CRUD (MODIFIER / SUPPRIMER) */}
            {activeTab === 'ENACTA' && (
              <div
                style={{
                  background: 'var(--df-bg-surface-1)',
                  border: '1px solid var(--df-border-subtle)',
                  borderRadius: 'var(--df-radius-lg)',
                  overflow: 'hidden',
                  boxShadow: 'var(--df-shadow-sm)',
                }}
              >
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.82rem' }}>
                    <thead>
                      <tr style={{ background: 'var(--df-bg-surface-2)', borderBottom: '1px solid var(--df-border-subtle)', color: 'var(--df-text-secondary)', textTransform: 'uppercase', fontSize: '0.70rem' }}>
                        <th style={{ padding: '0.75rem 1rem' }}>Véhicule / Immatriculation</th>
                        <th style={{ padding: '0.75rem 1rem' }}>Catégorie</th>
                        <th style={{ padding: '0.75rem 1rem' }}>Dernière Visite</th>
                        <th style={{ padding: '0.75rem 1rem' }}>Échéance Légale</th>
                        <th style={{ padding: '0.75rem 1rem' }}>Centre ENACTA</th>
                        <th style={{ padding: '0.75rem 1rem' }}>Statut</th>
                        <th style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>Actions CRUD</th>
                      </tr>
                    </thead>
                    <tbody>
                      {enactaList.length === 0 ? (
                        <tr>
                          <td colSpan={7} style={{ padding: '3rem 1rem', textAlign: 'center' }}>
                            <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'rgba(59, 130, 246, 0.1)', border: '1px solid rgba(59, 130, 246, 0.2)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', color: '#60a5fa', marginBottom: '0.75rem' }}>
                              <IconShieldCheck size={20} />
                            </div>
                            <div style={{ fontWeight: 700, color: 'var(--df-text-main)', marginBottom: '0.25rem' }}>
                              Aucun contrôle technique ENACTA enregistré
                            </div>
                            <div style={{ fontSize: '0.8rem', color: 'var(--df-text-muted)', marginBottom: '1rem' }}>
                              Enregistrez une première visite ou activez le mode démo pour explorer la simulation.
                            </div>
                            <Button variant="primary" size="sm" onClick={handleOpenAddEnacta}>
                              + Ajouter un contrôle ENACTA
                            </Button>
                          </td>
                        </tr>
                      ) : (
                        enactaList.map((item) => (
                        <tr key={item.id} style={{ borderBottom: '1px solid var(--df-border-subtle)' }}>
                          <td style={{ padding: '0.85rem 1rem' }}>
                            <div style={{ fontWeight: 700, fontFamily: 'var(--df-font-mono)', color: 'var(--df-text-main)' }}>
                              {item.registrationNumber}
                            </div>
                            <div style={{ fontSize: '0.70rem', color: 'var(--df-text-muted)' }}>{item.makeModel}</div>
                          </td>
                          <td style={{ padding: '0.85rem 1rem' }}>
                            <Badge variant="neutral">{item.category}</Badge>
                          </td>
                          <td style={{ padding: '0.85rem 1rem', fontFamily: 'var(--df-font-mono)' }}>
                            {item.lastInspectionDate}
                          </td>
                          <td style={{ padding: '0.85rem 1rem' }}>
                            <div style={{ fontFamily: 'var(--df-font-mono)', fontWeight: 600 }}>{item.expiryDate}</div>
                            <span
                              style={{
                                fontSize: '0.70rem',
                                fontWeight: 700,
                                color: item.daysRemaining < 0 ? 'var(--df-status-danger)' : item.daysRemaining < 30 ? 'var(--df-status-warning)' : 'var(--df-status-ok)',
                              }}
                            >
                              {item.daysRemaining < 0 ? `Dépassé (${Math.abs(item.daysRemaining)}j)` : `${item.daysRemaining}j restants`}
                            </span>
                          </td>
                          <td style={{ padding: '0.85rem 1rem' }}>
                            <div>{item.centerName}</div>
                            <div style={{ fontSize: '0.68rem', color: 'var(--df-text-muted)' }}>{item.wilaya}</div>
                          </td>
                          <td style={{ padding: '0.85rem 1rem' }}>
                            {item.status === 'VALID' && <Badge variant="ok">CONFORME</Badge>}
                            {item.status === 'WARNING' && <Badge variant="warning">URGENT</Badge>}
                            {item.status === 'EXPIRED' && <Badge variant="danger">IMMOBILISÉ</Badge>}
                          </td>
                          <td style={{ padding: '0.85rem 1rem', textAlign: 'right' }}>
                            <div style={{ display: 'inline-flex', gap: '0.35rem' }}>
                              <button
                                onClick={() => handleOpenEditEnacta(item)}
                                title="Modifier ce contrôle"
                                style={{
                                  background: 'var(--df-bg-surface-2)',
                                  border: '1px solid var(--df-border-subtle)',
                                  borderRadius: 'var(--df-radius-sm)',
                                  padding: '0.35rem 0.55rem',
                                  color: 'var(--df-text-secondary)',
                                  cursor: 'pointer',
                                  display: 'flex',
                                  alignItems: 'center',
                                }}
                              >
                                <IconEdit size={13} />
                              </button>
                              <button
                                onClick={() => handleDeleteEnacta(item.id, item.registrationNumber)}
                                title="Supprimer ce contrôle"
                                style={{
                                  background: 'var(--df-status-danger-bg)',
                                  border: '1px solid var(--df-status-danger-border)',
                                  borderRadius: 'var(--df-radius-sm)',
                                  padding: '0.35rem 0.55rem',
                                  color: 'var(--df-status-danger-text)',
                                  cursor: 'pointer',
                                  display: 'flex',
                                  alignItems: 'center',
                                }}
                              >
                                <IconTrash size={13} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      )))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* TABLEAU ASSURANCES AVEC ACTIONS CRUD (MODIFIER / SUPPRIMER) */}
            {activeTab === 'INSURANCE' && (
              <div
                style={{
                  background: 'var(--df-bg-surface-1)',
                  border: '1px solid var(--df-border-subtle)',
                  borderRadius: 'var(--df-radius-lg)',
                  overflow: 'hidden',
                  boxShadow: 'var(--df-shadow-sm)',
                }}
              >
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.82rem' }}>
                    <thead>
                      <tr style={{ background: 'var(--df-bg-surface-2)', borderBottom: '1px solid var(--df-border-subtle)', color: 'var(--df-text-secondary)', textTransform: 'uppercase', fontSize: '0.70rem' }}>
                        <th style={{ padding: '0.75rem 1rem' }}>Immatriculation</th>
                        <th style={{ padding: '0.75rem 1rem' }}>Compagnie</th>
                        <th style={{ padding: '0.75rem 1rem' }}>N° de Police</th>
                        <th style={{ padding: '0.75rem 1rem' }}>Formule</th>
                        <th style={{ padding: '0.75rem 1rem' }}>Échéance</th>
                        <th style={{ padding: '0.75rem 1rem' }}>Statut</th>
                        <th style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>Actions CRUD</th>
                      </tr>
                    </thead>
                    <tbody>
                      {insuranceList.length === 0 ? (
                        <tr>
                          <td colSpan={7} style={{ padding: '3rem 1rem', textAlign: 'center' }}>
                            <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'rgba(59, 130, 246, 0.1)', border: '1px solid rgba(59, 130, 246, 0.2)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', color: '#60a5fa', marginBottom: '0.75rem' }}>
                              <IconFileText size={20} />
                            </div>
                            <div style={{ fontWeight: 700, color: 'var(--df-text-main)', marginBottom: '0.25rem' }}>
                              Aucune police d&apos;assurance enregistrée
                            </div>
                            <div style={{ fontSize: '0.8rem', color: 'var(--df-text-muted)', marginBottom: '1rem' }}>
                              Enregistrez une première police (CAAT, SAA, CASH, etc.) ou activez le mode démo pour explorer la simulation.
                            </div>
                            <Button variant="primary" size="sm" onClick={handleOpenAddInsurance}>
                              + Ajouter une police d&apos;assurance
                            </Button>
                          </td>
                        </tr>
                      ) : (
                        insuranceList.map((ins) => (
                        <tr key={ins.id} style={{ borderBottom: '1px solid var(--df-border-subtle)' }}>
                          <td style={{ padding: '0.85rem 1rem', fontWeight: 700, fontFamily: 'var(--df-font-mono)' }}>
                            {ins.registrationNumber}
                            <div style={{ fontSize: '0.68rem', color: 'var(--df-text-muted)', fontWeight: 400 }}>{ins.makeModel}</div>
                          </td>
                          <td style={{ padding: '0.85rem 1rem', fontWeight: 700, color: 'var(--df-accent-blue)' }}>
                            {ins.insurer}
                          </td>
                          <td style={{ padding: '0.85rem 1rem', fontFamily: 'var(--df-font-mono)' }}>{ins.policyNumber}</td>
                          <td style={{ padding: '0.85rem 1rem' }}>
                            <Badge variant="neutral">{ins.coverageType.replace('_', ' ')}</Badge>
                          </td>
                          <td style={{ padding: '0.85rem 1rem', fontFamily: 'var(--df-font-mono)' }}>{ins.expiryDate}</td>
                          <td style={{ padding: '0.85rem 1rem' }}>
                            {ins.status === 'VALID' ? <Badge variant="ok">EN COURS</Badge> : <Badge variant="warning">RENOUVELLEMENT</Badge>}
                          </td>
                          <td style={{ padding: '0.85rem 1rem', textAlign: 'right' }}>
                            <div style={{ display: 'inline-flex', gap: '0.35rem' }}>
                              <button
                                onClick={() => handleOpenEditInsurance(ins)}
                                title="Modifier"
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
                                onClick={() => handleDeleteInsurance(ins.id, ins.registrationNumber)}
                                title="Supprimer"
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
                      )))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {activeTab === 'WILAYAS' && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1rem' }}>
                {WILAYA_RESTRICTIONS.map((wil) => (
                  <Card key={wil.wilayaCode}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                      <span style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--df-text-main)' }}>
                        Wilaya de {wil.wilayaName} ({wil.wilayaCode})
                      </span>
                      <Badge variant={wil.activeStatus === 'STRICT_PEAK' ? 'warning' : 'ok'}>
                        {wil.activeStatus === 'STRICT_PEAK' ? 'HEURES DE POINTE' : 'DÉROGATION'}
                      </Badge>
                    </div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--df-text-muted)', fontFamily: 'var(--df-font-mono)', marginBottom: '0.75rem' }}>
                      {wil.legalReference}
                    </div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--df-status-danger)', fontWeight: 700, marginBottom: '0.35rem' }}>
                      Interdiction : &gt; {wil.tonnageLimit}t de {wil.restrictedHours}
                    </div>
                    <div style={{ padding: '0.5rem', background: 'var(--df-bg-surface-2)', borderRadius: 'var(--df-radius-sm)', fontSize: '0.74rem' }}>
                      Déviation : <strong style={{ color: 'var(--df-accent-blue)' }}>{wil.bypassRoute}</strong>
                    </div>
                  </Card>
                ))}
              </div>
            )}

            {activeTab === 'TAXES' && (
              <Card>
                <h3 style={{ fontSize: '1rem', fontWeight: 800, margin: '0 0 0.5rem 0' }}>Barème Fiscal LF 2025/2026</h3>
                <p style={{ fontSize: '0.80rem', color: 'var(--df-text-secondary)', marginBottom: '1rem' }}>
                  Application des droits de timbre et vignettes automobiles en Dinars Algériens.
                </p>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem' }}>
                  <div style={{ padding: '1rem', background: 'var(--df-bg-surface-2)', borderRadius: 'var(--df-radius-md)' }}>
                    <div style={{ fontSize: '0.72rem', color: 'var(--df-text-muted)', textTransform: 'uppercase' }}>Poids Lourds (&gt; 10t)</div>
                    <div className="df-mono" style={{ fontSize: '1.4rem', fontWeight: 800, margin: '0.25rem 0' }}>18 000 DA</div>
                    <span style={{ fontSize: '0.70rem', color: 'var(--df-text-secondary)' }}>Par véhicule / an</span>
                  </div>
                  <div style={{ padding: '1rem', background: 'var(--df-bg-surface-2)', borderRadius: 'var(--df-radius-md)' }}>
                    <div style={{ fontSize: '0.72rem', color: 'var(--df-text-muted)', textTransform: 'uppercase' }}>Utilitaires VUL / Pick-up</div>
                    <div className="df-mono" style={{ fontSize: '1.4rem', fontWeight: 800, margin: '0.25rem 0' }}>6 000 DA</div>
                    <span style={{ fontSize: '0.70rem', color: 'var(--df-text-secondary)' }}>Par véhicule / an</span>
                  </div>
                </div>
              </Card>
            )}
          </main>
        </div>
      </div>

      {/* MODAL CRUD ENACTA (CRÉER / MODIFIER) */}
      {isEnactaModalOpen && (
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
              maxWidth: '520px',
              background: 'var(--df-bg-surface-1)',
              border: '1px solid var(--df-border-subtle)',
              borderRadius: 'var(--df-radius-lg)',
              boxShadow: 'var(--df-shadow-lg)',
              padding: '1.5rem',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 800, margin: 0, color: 'var(--df-text-main)' }}>
                {editingEnacta ? 'Modifier Contrôle ENACTA' : 'Nouveau Contrôle Technique ENACTA'}
              </h3>
              <button onClick={() => setIsEnactaModalOpen(false)} style={{ background: 'transparent', border: 'none', color: 'var(--df-text-muted)', cursor: 'pointer' }}>
                <IconX size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveEnacta} style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              <div>
                <label style={{ fontSize: '0.74rem', fontWeight: 600, color: 'var(--df-text-muted)', display: 'block', marginBottom: '0.25rem' }}>
                  Immatriculation Véhicule (Format DZ) *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: 00421-116-16"
                  value={enactaForm.registrationNumber || ''}
                  onChange={(e) => setEnactaForm({ ...enactaForm, registrationNumber: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '0.5rem 0.75rem',
                    background: 'var(--df-bg-surface-2)',
                    border: '1px solid var(--df-border-subtle)',
                    borderRadius: 'var(--df-radius-sm)',
                    color: 'var(--df-text-main)',
                    fontFamily: 'var(--df-font-mono)',
                    outline: 'none',
                  }}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.74rem', fontWeight: 600, color: 'var(--df-text-muted)', display: 'block', marginBottom: '0.25rem' }}>
                  Marque &amp; Modèle
                </label>
                <input
                  type="text"
                  placeholder="Ex: Renault Trucks K 480"
                  value={enactaForm.makeModel || ''}
                  onChange={(e) => setEnactaForm({ ...enactaForm, makeModel: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '0.5rem 0.75rem',
                    background: 'var(--df-bg-surface-2)',
                    border: '1px solid var(--df-border-subtle)',
                    borderRadius: 'var(--df-radius-sm)',
                    color: 'var(--df-text-main)',
                    outline: 'none',
                  }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div>
                  <label style={{ fontSize: '0.74rem', fontWeight: 600, color: 'var(--df-text-muted)', display: 'block', marginBottom: '0.25rem' }}>
                    Catégorie
                  </label>
                  <select
                    value={enactaForm.category || 'PL'}
                    onChange={(e) => setEnactaForm({ ...enactaForm, category: e.target.value as EnactaRecord['category'] })}
                    style={{
                      width: '100%',
                      padding: '0.5rem 0.75rem',
                      background: 'var(--df-bg-surface-2)',
                      border: '1px solid var(--df-border-subtle)',
                      borderRadius: 'var(--df-radius-sm)',
                      color: 'var(--df-text-main)',
                    }}
                  >
                    <option value="PL">Poids Lourds (PL)</option>
                    <option value="BTP">Engins BTP</option>
                    <option value="VL">Véhicule Léger (VL)</option>
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: '0.74rem', fontWeight: 600, color: 'var(--df-text-muted)', display: 'block', marginBottom: '0.25rem' }}>
                    Date Limite Échéance *
                  </label>
                  <input
                    type="date"
                    required
                    value={enactaForm.expiryDate || ''}
                    onChange={(e) => setEnactaForm({ ...enactaForm, expiryDate: e.target.value })}
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

              <div>
                <label style={{ fontSize: '0.74rem', fontWeight: 600, color: 'var(--df-text-muted)', display: 'block', marginBottom: '0.25rem' }}>
                  Centre Agréé ENACTA
                </label>
                <input
                  type="text"
                  placeholder="Ex: Centre ENACTA Rouiba (16)"
                  value={enactaForm.centerName || ''}
                  onChange={(e) => setEnactaForm({ ...enactaForm, centerName: e.target.value })}
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

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.65rem', marginTop: '1rem' }}>
                <Button variant="secondary" size="sm" type="button" onClick={() => setIsEnactaModalOpen(false)}>
                  Annuler
                </Button>
                <Button variant="primary" size="sm" type="submit">
                  {editingEnacta ? 'Mettre à jour' : 'Enregistrer le Contrôle'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL CRUD ASSURANCE (CRÉER / MODIFIER) */}
      {isInsuranceModalOpen && (
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
              maxWidth: '520px',
              background: 'var(--df-bg-surface-1)',
              border: '1px solid var(--df-border-subtle)',
              borderRadius: 'var(--df-radius-lg)',
              boxShadow: 'var(--df-shadow-lg)',
              padding: '1.5rem',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 800, margin: 0, color: 'var(--df-text-main)' }}>
                {editingInsurance ? 'Modifier Police d\'Assurance' : 'Nouvelle Police d\'Assurance'}
              </h3>
              <button onClick={() => setIsInsuranceModalOpen(false)} style={{ background: 'transparent', border: 'none', color: 'var(--df-text-muted)', cursor: 'pointer' }}>
                <IconX size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveInsurance} style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              <div>
                <label style={{ fontSize: '0.74rem', fontWeight: 600, color: 'var(--df-text-muted)', display: 'block', marginBottom: '0.25rem' }}>
                  Immatriculation Véhicule *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: 01892-116-16"
                  value={insuranceForm.registrationNumber || ''}
                  onChange={(e) => setInsuranceForm({ ...insuranceForm, registrationNumber: e.target.value })}
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

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div>
                  <label style={{ fontSize: '0.74rem', fontWeight: 600, color: 'var(--df-text-muted)', display: 'block', marginBottom: '0.25rem' }}>
                    Compagnie d&apos;Assurance
                  </label>
                  <select
                    value={insuranceForm.insurer || 'CAAT'}
                    onChange={(e) => setInsuranceForm({ ...insuranceForm, insurer: e.target.value as InsuranceRecord['insurer'] })}
                    style={{
                      width: '100%',
                      padding: '0.5rem 0.75rem',
                      background: 'var(--df-bg-surface-2)',
                      border: '1px solid var(--df-border-subtle)',
                      borderRadius: 'var(--df-radius-sm)',
                      color: 'var(--df-text-main)',
                    }}
                  >
                    <option value="CAAT">CAAT</option>
                    <option value="SAA">SAA</option>
                    <option value="CASH">CASH Assurances</option>
                    <option value="MACIR_VIE">Macir Vie</option>
                    <option value="ALLIANCE">Alliance Assurances</option>
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: '0.74rem', fontWeight: 600, color: 'var(--df-text-muted)', display: 'block', marginBottom: '0.25rem' }}>
                    N° de Police *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: CAAT-FLT-2026-00481"
                    value={insuranceForm.policyNumber || ''}
                    onChange={(e) => setInsuranceForm({ ...insuranceForm, policyNumber: e.target.value })}
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
                    Formule de Couverture
                  </label>
                  <select
                    value={insuranceForm.coverageType || 'TOUS_RISQUES'}
                    onChange={(e) => setInsuranceForm({ ...insuranceForm, coverageType: e.target.value as InsuranceRecord['coverageType'] })}
                    style={{
                      width: '100%',
                      padding: '0.5rem 0.75rem',
                      background: 'var(--df-bg-surface-2)',
                      border: '1px solid var(--df-border-subtle)',
                      borderRadius: 'var(--df-radius-sm)',
                      color: 'var(--df-text-main)',
                    }}
                  >
                    <option value="TOUS_RISQUES">Tous Risques</option>
                    <option value="TIERS_COLLISION">Tiers &amp; Collision</option>
                    <option value="RESPONSABILITE_CIVILE">Responsabilité Civile</option>
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: '0.74rem', fontWeight: 600, color: 'var(--df-text-muted)', display: 'block', marginBottom: '0.25rem' }}>
                    Date d&apos;Échéance
                  </label>
                  <input
                    type="date"
                    required
                    value={insuranceForm.expiryDate || ''}
                    onChange={(e) => setInsuranceForm({ ...insuranceForm, expiryDate: e.target.value })}
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

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.65rem', marginTop: '1rem' }}>
                <Button variant="secondary" size="sm" type="button" onClick={() => setIsInsuranceModalOpen(false)}>
                  Annuler
                </Button>
                <Button variant="primary" size="sm" type="submit">
                  {editingInsurance ? 'Mettre à jour' : 'Enregistrer la Police'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
