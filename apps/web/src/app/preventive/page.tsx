'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Navbar } from '../../components/navigation/Navbar';
import { Card } from '../../components/Card';
import { Badge } from '../../components/Badge';
import { Button } from '../../components/Button';
import {
  IconWrench,
  IconTruck,
  IconShieldCheck,
  IconAlertTriangle,
  IconSlidersHorizontal,
  IconClock,
  IconCheck,
  IconDownload,
  IconPlus,
  IconEdit,
  IconTrash,
  IconX,
  IconSearch,
} from '../../components/navigation/TechIcons';
import { BreakthroughInnovationsPanel } from '../../components/preventive/BreakthroughInnovationsPanel';

export interface OemMaintenanceTemplate {
  id: string;
  make: string;
  model: string;
  category: 'POIDS_LOURDS' | 'ENGINS_BTP' | 'UTILITAIRES';
  standardIntervalText: string;
  saharaIntervalText: string;
  severityFactor: number;
  engineOilSpec: string;
  transmissionSpec: string;
  coolantSpec: string;
  criticalPoints: string[];
}

export interface UpcomingPreventiveDue {
  id: string;
  registrationNumber: string;
  makeModel: string;
  templateName: string;
  currentCounter: number;
  dueCounter: number;
  remainingCounter: number;
  unit: 'km' | 'h';
  progressPercent: number;
  urgency: 'URGENT' | 'WARNING' | 'NOMINAL';
  assignedSite: string;
}

const INITIAL_OEM_TEMPLATES: OemMaintenanceTemplate[] = [
  {
    id: 'TPL-RT-K480',
    make: 'Renault Trucks',
    model: 'K 480 / T 480 DTi 13 (Euro 3/5)',
    category: 'POIDS_LOURDS',
    standardIntervalText: '40 000 km / 800 h',
    saharaIntervalText: '26 000 km / 550 h (Facteur 0.65)',
    severityFactor: 0.65,
    engineOilSpec: '15W-40 VDS-4.5 / ACEA E9 (36 Litres)',
    transmissionSpec: '75W-80 ZF TE-ML 02E (14 Litres)',
    coolantSpec: 'OAT Silicate-Free Protect 100°C',
    criticalPoints: [
      'Double filtration gasoil séparateur d’eau (Gasoil Naftal)',
      'Nettoyage préfiltre à air cyclonique à bain d’huile',
      'Graissage sellette d’attelage et pivots tous les 5 000 km',
    ],
  },
  {
    id: 'TPL-SC-R450',
    make: 'Scania',
    model: 'R 450 / G 410 DC13 XPI',
    category: 'POIDS_LOURDS',
    standardIntervalText: '45 000 km / 900 h',
    saharaIntervalText: '30 000 km / 600 h (Facteur 0.67)',
    severityFactor: 0.67,
    engineOilSpec: 'LDF-4 10W-40 Long Drain (38 Litres)',
    transmissionSpec: 'STO 1:0 75W-90 (16 Litres)',
    coolantSpec: 'Scania Antifreeze & Corrosion Inhibitor',
    criticalPoints: [
      'Nettoyage centrifugeuse d’huile moteur',
      'Contrôle jeu aux soupapes et injecteurs-pompes PDE',
      'Pression soufflante turbo et durites silicone intercooler',
    ],
  },
  {
    id: 'TPL-CAT-320D',
    make: 'Caterpillar',
    model: 'Pelle Hydraulique 320D / 336D',
    category: 'ENGINS_BTP',
    standardIntervalText: 'PM1 (250h) • PM2 (500h) • PM3 (1000h) • PM4 (2000h)',
    saharaIntervalText: 'PM1 (175h) • PM2 (350h) (Poussière carrière / BTP)',
    severityFactor: 0.70,
    engineOilSpec: 'Cat DEO-ULS 15W-40 (25 Litres)',
    transmissionSpec: 'Cat HYDO Advanced 10 (260 Litres Hydraulique)',
    coolantSpec: 'Cat ELC Extended Life Coolant',
    criticalPoints: [
      'Échantillonnage huile SOS (Spectrométrie d’usure)',
      'Vidange réducteurs de translation et tourelle',
      'Contrôle tension des chenilles et clapets de sécurité',
    ],
  },
  {
    id: 'TPL-TOY-HILUX',
    make: 'Toyota',
    model: 'Hilux 2.4 / 2.8 D-4D 4x4',
    category: 'UTILITAIRES',
    standardIntervalText: '10 000 km / 300 h',
    saharaIntervalText: '7 500 km / 200 h',
    severityFactor: 0.75,
    engineOilSpec: '5W-30 C2 / 15W-40 API CJ-4 (7.5 Litres)',
    transmissionSpec: 'GL-5 75W-90 Ponts & Boîte transfert (4.8 Litres)',
    coolantSpec: 'Toyota Super Long Life Coolant Pink',
    criticalPoints: [
      'Soufflage filtre à air habitacle et moteur tous les 2 500 km',
      'Graissage croisillons d’arbres de transmission 4x4',
      'Contrôle purge décanteur filtre à carburant',
    ],
  },
];

const INITIAL_UPCOMING_PREVENTIVE: UpcomingPreventiveDue[] = [
  {
    id: 'due-01',
    registrationNumber: '01892-116-16',
    makeModel: 'Mercedes-Benz Actros 3340',
    templateName: 'Plan Poids Lourds Sévère (25 000 km)',
    currentCounter: 342900,
    dueCounter: 342450,
    remainingCounter: -450,
    unit: 'km',
    progressPercent: 101.8,
    urgency: 'URGENT',
    assignedSite: 'Rouiba (16)',
  },
  {
    id: 'due-02',
    registrationNumber: 'ENG-23-018-DZ',
    makeModel: 'Caterpillar 320D',
    templateName: 'Cycle BTP PM2 Filtration (350 h)',
    currentCounter: 512,
    dueCounter: 500,
    remainingCounter: -12,
    unit: 'h',
    progressPercent: 102.4,
    urgency: 'URGENT',
    assignedSite: 'Chantier Annaba (23)',
  },
  {
    id: 'due-03',
    registrationNumber: '00421-116-16',
    makeModel: 'Renault Trucks K 480',
    templateName: 'Plan Poids Lourds Sévère (26 000 km)',
    currentCounter: 284150,
    dueCounter: 286000,
    remainingCounter: 1850,
    unit: 'km',
    progressPercent: 92.8,
    urgency: 'WARNING',
    assignedSite: 'Ghardaïa (47)',
  },
  {
    id: 'due-04',
    registrationNumber: '00912-120-31',
    makeModel: 'Toyota Hilux 2.4 D-4D',
    templateName: 'Plan Utilitaires 4x4 (7 500 km)',
    currentCounter: 42100,
    dueCounter: 45000,
    remainingCounter: 2900,
    unit: 'km',
    progressPercent: 61.3,
    urgency: 'NOMINAL',
    assignedSite: 'Oran (31)',
  },
];

export default function PreventivePage() {
  const [templates, setTemplates] = useState<OemMaintenanceTemplate[]>(INITIAL_OEM_TEMPLATES);
  const [upcoming, setUpcoming] = useState<UpcomingPreventiveDue[]>(INITIAL_UPCOMING_PREVENTIVE);
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [selectedUrgency, setSelectedUrgency] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [climateZone, setClimateZone] = useState<'TELL' | 'PLATEAUS' | 'SAHARA'>('SAHARA');
  const [notification, setNotification] = useState<string | null>(null);

  // État de modal CRUD Plan OEM
  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<OemMaintenanceTemplate | null>(null);
  const [templateForm, setTemplateForm] = useState({
    make: '',
    model: '',
    category: 'POIDS_LOURDS' as 'POIDS_LOURDS' | 'ENGINS_BTP' | 'UTILITAIRES',
    standardIntervalText: '',
    saharaIntervalText: '',
    severityFactor: 0.65,
    engineOilSpec: '',
    transmissionSpec: '',
    coolantSpec: '',
    criticalPointsText: '',
  });

  // État de modal CRUD Échéance Préventive
  const [isDueModalOpen, setIsDueModalOpen] = useState(false);
  const [editingDue, setEditingDue] = useState<UpcomingPreventiveDue | null>(null);
  const [dueForm, setDueForm] = useState({
    registrationNumber: '',
    makeModel: '',
    templateName: '',
    currentCounter: 100000,
    dueCounter: 105000,
    unit: 'km' as 'km' | 'h',
    assignedSite: 'Dépôt Central Alger (16)',
  });

  // État de modal Confirmation de suppression
  const [deleteConfirm, setDeleteConfirm] = useState<{
    type: 'TEMPLATE' | 'DUE';
    id: string;
    label: string;
  } | null>(null);

  const showNotification = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 4500);
  };

  const handleCreateWorkOrder = (plate: string, template: string) => {
    showNotification(`✓ Ordre de Travail Préventif déclenché pour l'actif ${plate} (${template}). Transmis à l'atelier.`);
  };

  // Gestion Template OEM
  const handleOpenTemplateModal = (tpl?: OemMaintenanceTemplate) => {
    if (tpl) {
      setEditingTemplate(tpl);
      setTemplateForm({
        make: tpl.make,
        model: tpl.model,
        category: tpl.category,
        standardIntervalText: tpl.standardIntervalText,
        saharaIntervalText: tpl.saharaIntervalText,
        severityFactor: tpl.severityFactor,
        engineOilSpec: tpl.engineOilSpec,
        transmissionSpec: tpl.transmissionSpec,
        coolantSpec: tpl.coolantSpec,
        criticalPointsText: tpl.criticalPoints.join('\n'),
      });
    } else {
      setEditingTemplate(null);
      setTemplateForm({
        make: '',
        model: '',
        category: 'POIDS_LOURDS',
        standardIntervalText: '30 000 km / 600 h',
        saharaIntervalText: '20 000 km / 400 h (Facteur 0.67)',
        severityFactor: 0.67,
        engineOilSpec: '15W-40 API CK-4 (30 Litres)',
        transmissionSpec: '80W-90 GL-5 (12 Litres)',
        coolantSpec: 'Liquide 50% OAT -37°C / +108°C',
        criticalPointsText: 'Purge décanteur carburant\nContrôle colmatage filtre à air à bain d’huile',
      });
    }
    setIsTemplateModalOpen(true);
  };

  const handleSaveTemplate = (e: React.FormEvent) => {
    e.preventDefault();
    const points = templateForm.criticalPointsText
      .split('\n')
      .map((p) => p.trim())
      .filter(Boolean);

    if (editingTemplate) {
      setTemplates((prev) =>
        prev.map((t) =>
          t.id === editingTemplate.id
            ? {
                ...t,
                make: templateForm.make,
                model: templateForm.model,
                category: templateForm.category,
                standardIntervalText: templateForm.standardIntervalText,
                saharaIntervalText: templateForm.saharaIntervalText,
                severityFactor: Number(templateForm.severityFactor),
                engineOilSpec: templateForm.engineOilSpec,
                transmissionSpec: templateForm.transmissionSpec,
                coolantSpec: templateForm.coolantSpec,
                criticalPoints: points,
              }
            : t
        )
      );
      showNotification(`✓ Programme d'entretien ${templateForm.make} ${templateForm.model} mis à jour avec succès.`);
    } else {
      const newId = `TPL-CUSTOM-${Date.now().toString().slice(-4)}`;
      const newTpl: OemMaintenanceTemplate = {
        id: newId,
        make: templateForm.make,
        model: templateForm.model,
        category: templateForm.category,
        standardIntervalText: templateForm.standardIntervalText,
        saharaIntervalText: templateForm.saharaIntervalText,
        severityFactor: Number(templateForm.severityFactor),
        engineOilSpec: templateForm.engineOilSpec,
        transmissionSpec: templateForm.transmissionSpec,
        coolantSpec: templateForm.coolantSpec,
        criticalPoints: points,
      };
      setTemplates((prev) => [newTpl, ...prev]);
      showNotification(`✓ Nouveau gabarit OEM ${templateForm.make} ${templateForm.model} ajouté au catalogue.`);
    }
    setIsTemplateModalOpen(false);
  };

  // Gestion Échéance Préventive
  const handleOpenDueModal = (due?: UpcomingPreventiveDue) => {
    if (due) {
      setEditingDue(due);
      setDueForm({
        registrationNumber: due.registrationNumber,
        makeModel: due.makeModel,
        templateName: due.templateName,
        currentCounter: due.currentCounter,
        dueCounter: due.dueCounter,
        unit: due.unit,
        assignedSite: due.assignedSite,
      });
    } else {
      setEditingDue(null);
      setDueForm({
        registrationNumber: '08341-118-30',
        makeModel: 'Shacman F3000 Benne',
        templateName: 'Plan Poids Lourds Sévère (20 000 km)',
        currentCounter: 148500,
        dueCounter: 150000,
        unit: 'km',
        assignedSite: 'Hassi Messaoud (30)',
      });
    }
    setIsDueModalOpen(true);
  };

  const handleSaveDue = (e: React.FormEvent) => {
    e.preventDefault();
    const cur = Number(dueForm.currentCounter);
    const target = Number(dueForm.dueCounter);
    const remaining = target - cur;
    const progress = cur > 0 ? Math.round((cur / target) * 1000) / 10 : 0;
    const urgency: 'URGENT' | 'WARNING' | 'NOMINAL' =
      remaining < 0 ? 'URGENT' : remaining < 2000 ? 'WARNING' : 'NOMINAL';

    if (editingDue) {
      setUpcoming((prev) =>
        prev.map((d) =>
          d.id === editingDue.id
            ? {
                ...d,
                registrationNumber: dueForm.registrationNumber,
                makeModel: dueForm.makeModel,
                templateName: dueForm.templateName,
                currentCounter: cur,
                dueCounter: target,
                remainingCounter: remaining,
                unit: dueForm.unit,
                progressPercent: progress,
                urgency,
                assignedSite: dueForm.assignedSite,
              }
            : d
        )
      );
      showNotification(`✓ Échéance préventive de l'actif ${dueForm.registrationNumber} mise à jour.`);
    } else {
      const newDue: UpcomingPreventiveDue = {
        id: `due-${Date.now().toString().slice(-4)}`,
        registrationNumber: dueForm.registrationNumber,
        makeModel: dueForm.makeModel,
        templateName: dueForm.templateName,
        currentCounter: cur,
        dueCounter: target,
        remainingCounter: remaining,
        unit: dueForm.unit,
        progressPercent: progress,
        urgency,
        assignedSite: dueForm.assignedSite,
      };
      setUpcoming((prev) => [newDue, ...prev]);
      showNotification(`✓ Nouvelle alerte d'échéance ajoutée pour l'actif ${dueForm.registrationNumber}.`);
    }
    setIsDueModalOpen(false);
  };

  // Suppression
  const handleConfirmDelete = () => {
    if (!deleteConfirm) return;
    if (deleteConfirm.type === 'TEMPLATE') {
      setTemplates((prev) => prev.filter((t) => t.id !== deleteConfirm.id));
      showNotification(`✓ Programme OEM « ${deleteConfirm.label} » supprimé du référentiel.`);
    } else {
      setUpcoming((prev) => prev.filter((d) => d.id !== deleteConfirm.id));
      showNotification(`✓ Alerte d'échéance pour « ${deleteConfirm.label} » supprimée.`);
    }
    setDeleteConfirm(null);
  };

  // Filtrage
  const filteredTemplates = templates.filter((tpl) => {
    const matchesCat = selectedCategory === 'ALL' || tpl.category === selectedCategory;
    const matchesSearch =
      searchQuery.trim() === '' ||
      tpl.make.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tpl.model.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesSearch;
  });

  const filteredUpcoming = upcoming.filter((item) => {
    if (selectedUrgency === 'ALL') return true;
    return item.urgency === selectedUrgency;
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

        {/* 2. LAYOUT DUAL-BAR : SIDEBAR VERTICALE + CONTENU PRINCIPAL */}
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
              Actions Préventives
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1.25rem' }}>
              <Button
                variant="primary"
                size="sm"
                onClick={() => handleOpenTemplateModal()}
                style={{ width: '100%', justifyContent: 'center', gap: '0.4rem' }}
              >
                <IconPlus size={14} />
                <span>Nouveau Plan OEM</span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleOpenDueModal()}
                style={{ width: '100%', justifyContent: 'center', gap: '0.4rem' }}
              >
                <IconPlus size={14} />
                <span>Ajouter Échéance</span>
              </Button>
            </div>

            <div style={{ height: '1px', background: 'var(--df-border-subtle)', margin: '0.5rem 0 1rem 0' }} />

            <div style={{ fontSize: '0.70rem', fontWeight: 700, color: 'var(--df-text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '0.75rem' }}>
              Filtre par Catégorie
            </div>

            <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', marginBottom: '1.25rem' }}>
              {[
                { id: 'ALL', label: 'Tous les Plans', count: templates.length, icon: '📋' },
                { id: 'POIDS_LOURDS', label: 'Poids Lourds', count: templates.filter((t) => t.category === 'POIDS_LOURDS').length, icon: '🚛' },
                { id: 'ENGINS_BTP', label: 'Engins BTP', count: templates.filter((t) => t.category === 'ENGINS_BTP').length, icon: '🚜' },
                { id: 'UTILITAIRES', label: 'Utilitaires & 4x4', count: templates.filter((t) => t.category === 'UTILITAIRES').length, icon: '🛻' },
              ].map((item) => (
                <button
                  key={item.id}
                  onClick={() => setSelectedCategory(item.id)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '0.5rem 0.65rem',
                    borderRadius: 'var(--df-radius-md)',
                    border: 'none',
                    background: selectedCategory === item.id ? 'var(--df-bg-surface-2)' : 'transparent',
                    color: selectedCategory === item.id ? 'var(--df-accent-blue)' : 'var(--df-text-secondary)',
                    fontWeight: selectedCategory === item.id ? 700 : 500,
                    fontSize: '0.78rem',
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
                    style={{
                      background: selectedCategory === item.id ? 'var(--df-accent-blue)' : 'var(--df-bg-surface-2)',
                      color: selectedCategory === item.id ? '#FFFFFF' : 'var(--df-text-muted)',
                      padding: '0.1rem 0.45rem',
                      borderRadius: 'var(--df-radius-full)',
                      fontSize: '0.70rem',
                      fontWeight: 700,
                    }}
                  >
                    {item.count}
                  </span>
                </button>
              ))}
            </nav>

            <div style={{ height: '1px', background: 'var(--df-border-subtle)', margin: '0.5rem 0 1rem 0' }} />

            <div style={{ fontSize: '0.70rem', fontWeight: 700, color: 'var(--df-text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '0.75rem' }}>
              État des Échéances
            </div>

            <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', marginBottom: '1.25rem' }}>
              {[
                { id: 'ALL', label: 'Toutes les Échéances', count: upcoming.length, color: 'var(--df-text-secondary)' },
                { id: 'URGENT', label: 'Dépassées (DANGER)', count: upcoming.filter((u) => u.urgency === 'URGENT').length, color: 'var(--df-status-danger)' },
                { id: 'WARNING', label: 'Imminentes (< 2000)', count: upcoming.filter((u) => u.urgency === 'WARNING').length, color: 'var(--df-status-warning)' },
                { id: 'NOMINAL', label: 'Nominales', count: upcoming.filter((u) => u.urgency === 'NOMINAL').length, color: 'var(--df-status-ok)' },
              ].map((item) => (
                <button
                  key={item.id}
                  onClick={() => setSelectedUrgency(item.id)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '0.45rem 0.65rem',
                    borderRadius: 'var(--df-radius-md)',
                    border: 'none',
                    background: selectedUrgency === item.id ? 'var(--df-bg-surface-2)' : 'transparent',
                    color: selectedUrgency === item.id ? item.color : 'var(--df-text-secondary)',
                    fontWeight: selectedUrgency === item.id ? 700 : 500,
                    fontSize: '0.76rem',
                    cursor: 'pointer',
                    textAlign: 'left',
                  }}
                >
                  <span>{item.label}</span>
                  <span
                    style={{
                      background: 'var(--df-bg-surface-2)',
                      color: item.color,
                      padding: '0.1rem 0.45rem',
                      borderRadius: 'var(--df-radius-full)',
                      fontSize: '0.70rem',
                      fontWeight: 700,
                    }}
                  >
                    {item.count}
                  </span>
                </button>
              ))}
            </nav>

            <div style={{ height: '1px', background: 'var(--df-border-subtle)', margin: '0.5rem 0 1rem 0' }} />

            <div style={{ fontSize: '0.70rem', fontWeight: 700, color: 'var(--df-text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '0.5rem' }}>
              Sévérité Thermique
            </div>
            <select
              value={climateZone}
              onChange={(e) => setClimateZone(e.target.value as any)}
              style={{
                width: '100%',
                padding: '0.45rem',
                borderRadius: 'var(--df-radius-md)',
                background: 'var(--df-bg-surface-2)',
                color: 'var(--df-text-main)',
                border: '1px solid var(--df-border-subtle)',
                fontSize: '0.76rem',
                fontWeight: 600,
              }}
            >
              <option value="SAHARA">Grand Sud (&gt; 45°C) • x0.65</option>
              <option value="PLATEAUS">Hauts-Plateaux • x0.85</option>
              <option value="TELL">Tell / Nord • x1.00</option>
            </select>
          </aside>

          {/* CONTENU PRINCIPAL */}
          <main style={{ flex: 1, minWidth: 0 }}>
            {/* EN-TÊTE PRINCIPAL */}
            <section
              style={{
                padding: '1.5rem',
                marginBottom: '1.5rem',
                background: 'var(--df-bg-surface-1)',
                border: '1px solid var(--df-border-subtle)',
                borderRadius: 'var(--df-radius-lg)',
                boxShadow: 'var(--df-shadow-sm)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '1.25rem',
              }}
            >
              <div>
                <div style={{ display: 'inline-flex', gap: '0.45rem', marginBottom: '0.5rem', flexWrap: 'wrap' }}>
                  <span
                    style={{
                      background: '#059669',
                      color: '#FFFFFF',
                      fontSize: '11px',
                      fontWeight: 800,
                      padding: '3px 10px',
                      borderRadius: '6px',
                      letterSpacing: '0.04em',
                    }}
                  >
                    🧬 MAINTENANCE 5.0 PRESCRIPTIVE &amp; COGNITIVE
                  </span>
                  <Badge variant="ok">SOUVERAIN ALGÉRIE (LOI 18-07)</Badge>
                  <Badge variant="neutral">Physique Déterministe 0 DA • DZD</Badge>
                </div>
                <h1
                  style={{
                    fontSize: '1.75rem',
                    fontWeight: 800,
                    color: 'var(--df-text-main)',
                    letterSpacing: '-0.025em',
                    marginBottom: '0.35rem',
                  }}
                >
                  Cockpit de Maintenance 5.0 &amp; Plans Constructeur OEM
                </h1>
                <p style={{ fontSize: '0.88rem', color: 'var(--df-text-secondary)', maxWidth: '780px', margin: 0 }}>
                  Le décisionnel prescriptif de classe mondiale : 5 algorithmes physiques déterministes à 0 DA de coût matériel, arbitrage financier direct en Dinars Algériens (SAD $\rightarrow$ ADS), et bibliothèque de programmes d&apos;entretien constructeur (Renault Trucks, Scania, CAT, Toyota, Shacman) calibrés pour le stress saharien.
                </p>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                <div
                  style={{
                    background: 'var(--df-bg-surface-2)',
                    padding: '0.5rem 0.85rem',
                    borderRadius: 'var(--df-radius-md)',
                    border: '1px solid var(--df-border-subtle)',
                    textAlign: 'right',
                  }}
                >
                  <span style={{ fontSize: '0.68rem', color: 'var(--df-text-muted)', display: 'block', textTransform: 'uppercase' }}>
                    Zone Active
                  </span>
                  <strong style={{ fontSize: '0.82rem', color: 'var(--df-accent-blue)' }}>
                    {climateZone === 'SAHARA' ? 'Grand Sud (Sahara > 45°C)' : climateZone === 'PLATEAUS' ? 'Hauts-Plateaux' : 'Tell / Littoral'}
                  </strong>
                </div>
              </div>
            </section>

            {/* SECTION MONOPOLE : 5 INNOVATIONS TECHNOLOGIQUES DE RUPTURE (0 DA) */}
            <section style={{ marginBottom: '2rem' }}>
              <BreakthroughInnovationsPanel />
            </section>

            {/* SECTION 1 : ÉCHÉANCES PRÉVENTIVES DE LA FLOTTE */}
            <section style={{ marginBottom: '2rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                <div>
                  <h2 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--df-text-main)', margin: 0 }}>
                    Échéances Préventives de la Flotte ({filteredUpcoming.length})
                  </h2>
                  <span style={{ fontSize: '0.74rem', color: 'var(--df-text-muted)' }}>
                    Suivi temps réel des compteurs certifiés km &amp; heures moteur
                  </span>
                </div>
                <Button variant="outline" size="sm" onClick={() => handleOpenDueModal()} style={{ gap: '0.35rem' }}>
                  <IconPlus size={13} />
                  <span>Ajouter Échéance</span>
                </Button>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
                {filteredUpcoming.map((item) => (
                  <Card key={item.id}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                      <div>
                        <span style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--df-text-main)', fontFamily: 'var(--df-font-mono)' }}>
                          {item.registrationNumber}
                        </span>
                        <div style={{ fontSize: '0.74rem', color: 'var(--df-text-muted)' }}>{item.makeModel}</div>
                      </div>
                      <Badge variant={item.urgency === 'URGENT' ? 'danger' : item.urgency === 'WARNING' ? 'warning' : 'ok'}>
                        {item.urgency === 'URGENT' ? 'DÉPASSÉ' : item.urgency === 'WARNING' ? 'IMMINENT' : 'NOMINAL'}
                      </Badge>
                    </div>

                    <div style={{ fontSize: '0.76rem', color: 'var(--df-text-secondary)', marginBottom: '0.75rem', fontWeight: 600 }}>
                      {item.templateName}
                    </div>

                    {/* Barre de progression d'échéance */}
                    <div style={{ marginBottom: '0.85rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', marginBottom: '0.25rem' }}>
                        <span style={{ color: 'var(--df-text-muted)' }}>
                          Compteur : {item.currentCounter.toLocaleString('fr-DZ')} {item.unit}
                        </span>
                        <strong
                          style={{
                            color: item.remainingCounter < 0 ? 'var(--df-status-danger)' : 'var(--df-status-ok)',
                            fontFamily: 'var(--df-font-mono)',
                          }}
                        >
                          {item.remainingCounter < 0
                            ? `Dépassement de ${Math.abs(item.remainingCounter)} ${item.unit}`
                            : `Reste ${item.remainingCounter} ${item.unit}`}
                        </strong>
                      </div>
                      <div style={{ height: '6px', borderRadius: '3px', background: 'var(--df-bg-surface-2)', overflow: 'hidden' }}>
                        <div
                          style={{
                            width: `${Math.min(100, item.progressPercent)}%`,
                            height: '100%',
                            background:
                              item.remainingCounter < 0
                                ? 'var(--df-status-danger)'
                                : item.progressPercent > 85
                                ? 'var(--df-status-warning)'
                                : 'var(--df-status-ok)',
                          }}
                        />
                      </div>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.65rem' }}>
                      <span style={{ fontSize: '0.70rem', color: 'var(--df-text-muted)' }}>Site : {item.assignedSite}</span>
                      <Button
                        variant={item.urgency === 'URGENT' ? 'primary' : 'secondary'}
                        size="sm"
                        onClick={() => handleCreateWorkOrder(item.registrationNumber, item.templateName)}
                      >
                        Déclencher OT
                      </Button>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.35rem', borderTop: '1px solid var(--df-border-subtle)', paddingTop: '0.5rem' }}>
                      <button
                        onClick={() => handleOpenDueModal(item)}
                        title="Modifier l'échéance"
                        style={{
                          background: 'transparent',
                          border: 'none',
                          color: 'var(--df-text-muted)',
                          cursor: 'pointer',
                          padding: '0.25rem',
                          display: 'flex',
                          alignItems: 'center',
                          borderRadius: 'var(--df-radius-sm)',
                        }}
                      >
                        <IconEdit size={14} />
                      </button>
                      <button
                        onClick={() => setDeleteConfirm({ type: 'DUE', id: item.id, label: `${item.registrationNumber} (${item.templateName})` })}
                        title="Supprimer l'alerte d'échéance"
                        style={{
                          background: 'transparent',
                          border: 'none',
                          color: 'var(--df-status-danger)',
                          cursor: 'pointer',
                          padding: '0.25rem',
                          display: 'flex',
                          alignItems: 'center',
                          borderRadius: 'var(--df-radius-sm)',
                        }}
                      >
                        <IconTrash size={14} />
                      </button>
                    </div>
                  </Card>
                ))}
              </div>
            </section>

            {/* SECTION 2 : CATALOGUE DES PLANS OEM */}
            <section>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.75rem' }}>
                <div>
                  <h2 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--df-text-main)', margin: 0 }}>
                    Référentiel des Programmes d&apos;Entretien Constructeur (OEM RMI)
                  </h2>
                  <p style={{ fontSize: '0.78rem', color: 'var(--df-text-muted)', margin: '0.2rem 0 0 0' }}>
                    Spécifications techniques des fluides, viscosités et préconisations de filtration locale.
                  </p>
                </div>

                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.45rem',
                      background: 'var(--df-bg-surface-1)',
                      border: '1px solid var(--df-border-subtle)',
                      borderRadius: 'var(--df-radius-md)',
                      padding: '0.35rem 0.65rem',
                      fontSize: '0.78rem',
                    }}
                  >
                    <IconSearch size={14} style={{ color: 'var(--df-text-muted)' }} />
                    <input
                      type="text"
                      placeholder="Rechercher marque ou modèle..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      style={{
                        border: 'none',
                        background: 'transparent',
                        color: 'var(--df-text-main)',
                        outline: 'none',
                        fontSize: '0.78rem',
                        width: '180px',
                      }}
                    />
                  </div>
                  <Button variant="primary" size="sm" onClick={() => handleOpenTemplateModal()} style={{ gap: '0.35rem' }}>
                    <IconPlus size={13} />
                    <span>Nouveau Plan OEM</span>
                  </Button>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '1.25rem' }}>
                {filteredTemplates.map((tpl) => (
                  <Card key={tpl.id}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                      <div>
                        <span style={{ fontSize: '1.10rem', fontWeight: 800, color: 'var(--df-text-main)' }}>
                          {tpl.make}
                        </span>
                        <div style={{ fontSize: '0.78rem', color: 'var(--df-text-secondary)', fontWeight: 600 }}>
                          {tpl.model}
                        </div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                        <Badge variant="neutral">{tpl.category.replace('_', ' ')}</Badge>
                        <button
                          onClick={() => handleOpenTemplateModal(tpl)}
                          title="Modifier ce plan"
                          style={{
                            background: 'transparent',
                            border: 'none',
                            color: 'var(--df-text-muted)',
                            cursor: 'pointer',
                            padding: '0.2rem',
                            display: 'flex',
                            alignItems: 'center',
                          }}
                        >
                          <IconEdit size={14} />
                        </button>
                        <button
                          onClick={() => setDeleteConfirm({ type: 'TEMPLATE', id: tpl.id, label: `${tpl.make} ${tpl.model}` })}
                          title="Supprimer ce plan"
                          style={{
                            background: 'transparent',
                            border: 'none',
                            color: 'var(--df-status-danger)',
                            cursor: 'pointer',
                            padding: '0.2rem',
                            display: 'flex',
                            alignItems: 'center',
                          }}
                        >
                          <IconTrash size={14} />
                        </button>
                      </div>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.80rem', padding: '0.35rem 0', borderBottom: '1px solid var(--df-border-subtle)' }}>
                        <span style={{ color: 'var(--df-text-secondary)' }}>Intervalle Standard Constructeur :</span>
                        <strong className="df-mono" style={{ color: 'var(--df-text-main)' }}>{tpl.standardIntervalText}</strong>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.80rem', padding: '0.35rem 0', borderBottom: '1px solid var(--df-border-subtle)' }}>
                        <span style={{ color: 'var(--df-text-secondary)' }}>Intervalle Sévère (Sahara / Poussière) :</span>
                        <strong className="df-mono" style={{ color: 'var(--df-accent-blue)' }}>{tpl.saharaIntervalText}</strong>
                      </div>
                    </div>

                    <div style={{ padding: '0.75rem', background: 'var(--df-bg-surface-2)', borderRadius: 'var(--df-radius-md)', marginBottom: '1rem', fontSize: '0.76rem' }}>
                      <div style={{ fontWeight: 700, color: 'var(--df-text-main)', marginBottom: '0.35rem' }}>
                        Spécifications Fluides Homologués :
                      </div>
                      <div style={{ color: 'var(--df-text-secondary)', marginBottom: '0.2rem' }}>
                        • Huile Moteur : <span className="df-mono" style={{ color: 'var(--df-text-main)' }}>{tpl.engineOilSpec}</span>
                      </div>
                      <div style={{ color: 'var(--df-text-secondary)', marginBottom: '0.2rem' }}>
                        • Transmission : <span className="df-mono" style={{ color: 'var(--df-text-main)' }}>{tpl.transmissionSpec}</span>
                      </div>
                      <div style={{ color: 'var(--df-text-secondary)' }}>
                        • Refroidissement : <span className="df-mono" style={{ color: 'var(--df-text-main)' }}>{tpl.coolantSpec}</span>
                      </div>
                    </div>

                    <div style={{ fontSize: '0.74rem', marginBottom: '1rem' }}>
                      <div style={{ fontWeight: 700, color: 'var(--df-text-muted)', textTransform: 'uppercase', marginBottom: '0.35rem', letterSpacing: '0.03em' }}>
                        Points de Contrôle Prioritaires :
                      </div>
                      <ul style={{ margin: 0, paddingLeft: '1.1rem', color: 'var(--df-text-secondary)', lineHeight: 1.45 }}>
                        {tpl.criticalPoints.map((pt, idx) => (
                          <li key={idx}>{pt}</li>
                        ))}
                      </ul>
                    </div>

                    <Button variant="secondary" size="sm" style={{ width: '100%' }} onClick={() => handleOpenTemplateModal(tpl)}>
                      Consulter / Modifier Fiche Technique RMI
                    </Button>
                  </Card>
                ))}
              </div>
            </section>
          </main>
        </div>
      </div>

      {/* MODAL 1 : CRÉATION / MODIFICATION PLAN OEM */}
      {isTemplateModalOpen && (
        <div
          role="dialog"
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.7)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: '1rem',
          }}
        >
          <div
            style={{
              background: 'var(--df-bg-surface-1)',
              border: '1px solid var(--df-border-medium)',
              borderRadius: 'var(--df-radius-lg)',
              maxWidth: '620px',
              width: '100%',
              maxHeight: '90vh',
              overflowY: 'auto',
              padding: '1.75rem',
              boxShadow: 'var(--df-shadow-lg)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--df-text-main)', margin: 0 }}>
                {editingTemplate ? `Modifier Programme OEM : ${editingTemplate.make} ${editingTemplate.model}` : 'Nouveau Programme d’Entretien Constructeur (OEM)'}
              </h3>
              <button
                onClick={() => setIsTemplateModalOpen(false)}
                style={{ background: 'transparent', border: 'none', color: 'var(--df-text-muted)', cursor: 'pointer' }}
              >
                <IconX size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveTemplate} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--df-text-muted)', marginBottom: '0.25rem' }}>
                    Constructeur / Marque *
                  </label>
                  <input
                    type="text"
                    required
                    value={templateForm.make}
                    onChange={(e) => setTemplateForm({ ...templateForm, make: e.target.value })}
                    placeholder="Ex: Renault Trucks, Scania, CAT"
                    style={{
                      width: '100%',
                      padding: '0.5rem',
                      borderRadius: 'var(--df-radius-sm)',
                      background: 'var(--df-bg-surface-2)',
                      border: '1px solid var(--df-border-subtle)',
                      color: 'var(--df-text-main)',
                      fontSize: '0.82rem',
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--df-text-muted)', marginBottom: '0.25rem' }}>
                    Modèle / Motorisation *
                  </label>
                  <input
                    type="text"
                    required
                    value={templateForm.model}
                    onChange={(e) => setTemplateForm({ ...templateForm, model: e.target.value })}
                    placeholder="Ex: K 480 DTi 13 / 320D"
                    style={{
                      width: '100%',
                      padding: '0.5rem',
                      borderRadius: 'var(--df-radius-sm)',
                      background: 'var(--df-bg-surface-2)',
                      border: '1px solid var(--df-border-subtle)',
                      color: 'var(--df-text-main)',
                      fontSize: '0.82rem',
                    }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--df-text-muted)', marginBottom: '0.25rem' }}>
                  Catégorie d’Actif
                </label>
                <select
                  value={templateForm.category}
                  onChange={(e) => setTemplateForm({ ...templateForm, category: e.target.value as any })}
                  style={{
                    width: '100%',
                    padding: '0.5rem',
                    borderRadius: 'var(--df-radius-sm)',
                    background: 'var(--df-bg-surface-2)',
                    border: '1px solid var(--df-border-subtle)',
                    color: 'var(--df-text-main)',
                    fontSize: '0.82rem',
                  }}
                >
                  <option value="POIDS_LOURDS">Poids Lourds (Tracteur / Porteur)</option>
                  <option value="ENGINS_BTP">Engins BTP &amp; Carrières</option>
                  <option value="UTILITAIRES">Utilitaires Légers &amp; 4x4</option>
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--df-text-muted)', marginBottom: '0.25rem' }}>
                    Intervalle Standard *
                  </label>
                  <input
                    type="text"
                    required
                    value={templateForm.standardIntervalText}
                    onChange={(e) => setTemplateForm({ ...templateForm, standardIntervalText: e.target.value })}
                    placeholder="Ex: 40 000 km / 800 h"
                    style={{
                      width: '100%',
                      padding: '0.5rem',
                      borderRadius: 'var(--df-radius-sm)',
                      background: 'var(--df-bg-surface-2)',
                      border: '1px solid var(--df-border-subtle)',
                      color: 'var(--df-text-main)',
                      fontSize: '0.82rem',
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--df-text-muted)', marginBottom: '0.25rem' }}>
                    Intervalle Sahara Sévère *
                  </label>
                  <input
                    type="text"
                    required
                    value={templateForm.saharaIntervalText}
                    onChange={(e) => setTemplateForm({ ...templateForm, saharaIntervalText: e.target.value })}
                    placeholder="Ex: 26 000 km / 550 h"
                    style={{
                      width: '100%',
                      padding: '0.5rem',
                      borderRadius: 'var(--df-radius-sm)',
                      background: 'var(--df-bg-surface-2)',
                      border: '1px solid var(--df-border-subtle)',
                      color: 'var(--df-text-main)',
                      fontSize: '0.82rem',
                    }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.75rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--df-text-muted)', marginBottom: '0.25rem' }}>
                    Huile Moteur
                  </label>
                  <input
                    type="text"
                    value={templateForm.engineOilSpec}
                    onChange={(e) => setTemplateForm({ ...templateForm, engineOilSpec: e.target.value })}
                    placeholder="15W-40 VDS-4.5"
                    style={{
                      width: '100%',
                      padding: '0.5rem',
                      borderRadius: 'var(--df-radius-sm)',
                      background: 'var(--df-bg-surface-2)',
                      border: '1px solid var(--df-border-subtle)',
                      color: 'var(--df-text-main)',
                      fontSize: '0.82rem',
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--df-text-muted)', marginBottom: '0.25rem' }}>
                    Transmission
                  </label>
                  <input
                    type="text"
                    value={templateForm.transmissionSpec}
                    onChange={(e) => setTemplateForm({ ...templateForm, transmissionSpec: e.target.value })}
                    placeholder="75W-80 ZF"
                    style={{
                      width: '100%',
                      padding: '0.5rem',
                      borderRadius: 'var(--df-radius-sm)',
                      background: 'var(--df-bg-surface-2)',
                      border: '1px solid var(--df-border-subtle)',
                      color: 'var(--df-text-main)',
                      fontSize: '0.82rem',
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--df-text-muted)', marginBottom: '0.25rem' }}>
                    Refroidissement
                  </label>
                  <input
                    type="text"
                    value={templateForm.coolantSpec}
                    onChange={(e) => setTemplateForm({ ...templateForm, coolantSpec: e.target.value })}
                    placeholder="OAT 50%"
                    style={{
                      width: '100%',
                      padding: '0.5rem',
                      borderRadius: 'var(--df-radius-sm)',
                      background: 'var(--df-bg-surface-2)',
                      border: '1px solid var(--df-border-subtle)',
                      color: 'var(--df-text-main)',
                      fontSize: '0.82rem',
                    }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--df-text-muted)', marginBottom: '0.25rem' }}>
                  Points de Contrôle Critiques (1 par ligne)
                </label>
                <textarea
                  rows={3}
                  value={templateForm.criticalPointsText}
                  onChange={(e) => setTemplateForm({ ...templateForm, criticalPointsText: e.target.value })}
                  placeholder="Double filtration gasoil Naftal&#10;Contrôle soufflage préfiltre à bain d’huile"
                  style={{
                    width: '100%',
                    padding: '0.5rem',
                    borderRadius: 'var(--df-radius-sm)',
                    background: 'var(--df-bg-surface-2)',
                    border: '1px solid var(--df-border-subtle)',
                    color: 'var(--df-text-main)',
                    fontSize: '0.82rem',
                    resize: 'vertical',
                  }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.65rem', marginTop: '0.75rem' }}>
                <Button variant="outline" size="sm" type="button" onClick={() => setIsTemplateModalOpen(false)}>
                  Annuler
                </Button>
                <Button variant="primary" size="sm" type="submit">
                  {editingTemplate ? 'Enregistrer Modifications' : 'Créer Plan OEM'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2 : CRÉATION / MODIFICATION ÉCHÉANCE PRÉVENTIVE */}
      {isDueModalOpen && (
        <div
          role="dialog"
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.7)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: '1rem',
          }}
        >
          <div
            style={{
              background: 'var(--df-bg-surface-1)',
              border: '1px solid var(--df-border-medium)',
              borderRadius: 'var(--df-radius-lg)',
              maxWidth: '540px',
              width: '100%',
              padding: '1.75rem',
              boxShadow: 'var(--df-shadow-lg)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--df-text-main)', margin: 0 }}>
                {editingDue ? `Modifier Échéance : ${editingDue.registrationNumber}` : 'Nouvelle Échéance Préventive Flotte'}
              </h3>
              <button
                onClick={() => setIsDueModalOpen(false)}
                style={{ background: 'transparent', border: 'none', color: 'var(--df-text-muted)', cursor: 'pointer' }}
              >
                <IconX size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveDue} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--df-text-muted)', marginBottom: '0.25rem' }}>
                    Immatriculation / Matricule *
                  </label>
                  <input
                    type="text"
                    required
                    value={dueForm.registrationNumber}
                    onChange={(e) => setDueForm({ ...dueForm, registrationNumber: e.target.value })}
                    placeholder="01892-116-16"
                    style={{
                      width: '100%',
                      padding: '0.5rem',
                      borderRadius: 'var(--df-radius-sm)',
                      background: 'var(--df-bg-surface-2)',
                      border: '1px solid var(--df-border-subtle)',
                      color: 'var(--df-text-main)',
                      fontSize: '0.82rem',
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--df-text-muted)', marginBottom: '0.25rem' }}>
                    Modèle Véhicule *
                  </label>
                  <input
                    type="text"
                    required
                    value={dueForm.makeModel}
                    onChange={(e) => setDueForm({ ...dueForm, makeModel: e.target.value })}
                    placeholder="Actros 3340 / K 480"
                    style={{
                      width: '100%',
                      padding: '0.5rem',
                      borderRadius: 'var(--df-radius-sm)',
                      background: 'var(--df-bg-surface-2)',
                      border: '1px solid var(--df-border-subtle)',
                      color: 'var(--df-text-main)',
                      fontSize: '0.82rem',
                    }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--df-text-muted)', marginBottom: '0.25rem' }}>
                  Nom du Programme Préventif *
                </label>
                <input
                  type="text"
                  required
                  value={dueForm.templateName}
                  onChange={(e) => setDueForm({ ...dueForm, templateName: e.target.value })}
                  placeholder="Plan Poids Lourds Sévère (25 000 km)"
                  style={{
                    width: '100%',
                    padding: '0.5rem',
                    borderRadius: 'var(--df-radius-sm)',
                    background: 'var(--df-bg-surface-2)',
                    border: '1px solid var(--df-border-subtle)',
                    color: 'var(--df-text-main)',
                    fontSize: '0.82rem',
                  }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.75rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--df-text-muted)', marginBottom: '0.25rem' }}>
                    Compteur Actuel *
                  </label>
                  <input
                    type="number"
                    required
                    value={dueForm.currentCounter}
                    onChange={(e) => setDueForm({ ...dueForm, currentCounter: Number(e.target.value) })}
                    style={{
                      width: '100%',
                      padding: '0.5rem',
                      borderRadius: 'var(--df-radius-sm)',
                      background: 'var(--df-bg-surface-2)',
                      border: '1px solid var(--df-border-subtle)',
                      color: 'var(--df-text-main)',
                      fontSize: '0.82rem',
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--df-text-muted)', marginBottom: '0.25rem' }}>
                    Échéance Cible *
                  </label>
                  <input
                    type="number"
                    required
                    value={dueForm.dueCounter}
                    onChange={(e) => setDueForm({ ...dueForm, dueCounter: Number(e.target.value) })}
                    style={{
                      width: '100%',
                      padding: '0.5rem',
                      borderRadius: 'var(--df-radius-sm)',
                      background: 'var(--df-bg-surface-2)',
                      border: '1px solid var(--df-border-subtle)',
                      color: 'var(--df-text-main)',
                      fontSize: '0.82rem',
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--df-text-muted)', marginBottom: '0.25rem' }}>
                    Unité
                  </label>
                  <select
                    value={dueForm.unit}
                    onChange={(e) => setDueForm({ ...dueForm, unit: e.target.value as any })}
                    style={{
                      width: '100%',
                      padding: '0.5rem',
                      borderRadius: 'var(--df-radius-sm)',
                      background: 'var(--df-bg-surface-2)',
                      border: '1px solid var(--df-border-subtle)',
                      color: 'var(--df-text-main)',
                      fontSize: '0.82rem',
                    }}
                  >
                    <option value="km">Kilomètres (km)</option>
                    <option value="h">Heures moteur (h)</option>
                  </select>
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--df-text-muted)', marginBottom: '0.25rem' }}>
                  Site / Base Opérationnelle
                </label>
                <input
                  type="text"
                  value={dueForm.assignedSite}
                  onChange={(e) => setDueForm({ ...dueForm, assignedSite: e.target.value })}
                  placeholder="Rouiba (16), Hassi Messaoud (30)"
                  style={{
                    width: '100%',
                    padding: '0.5rem',
                    borderRadius: 'var(--df-radius-sm)',
                    background: 'var(--df-bg-surface-2)',
                    border: '1px solid var(--df-border-subtle)',
                    color: 'var(--df-text-main)',
                    fontSize: '0.82rem',
                  }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.65rem', marginTop: '0.75rem' }}>
                <Button variant="outline" size="sm" type="button" onClick={() => setIsDueModalOpen(false)}>
                  Annuler
                </Button>
                <Button variant="primary" size="sm" type="submit">
                  {editingDue ? 'Enregistrer Modifications' : 'Créer Échéance'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3 : CONFIRMATION DE SUPPRESSION */}
      {deleteConfirm && (
        <div
          role="dialog"
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.7)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: '1rem',
          }}
        >
          <div
            style={{
              background: 'var(--df-bg-surface-1)',
              border: '1px solid var(--df-status-danger)',
              borderRadius: 'var(--df-radius-lg)',
              maxWidth: '440px',
              width: '100%',
              padding: '1.5rem',
              boxShadow: 'var(--df-shadow-lg)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '0.75rem', color: 'var(--df-status-danger)' }}>
              <IconAlertTriangle size={22} />
              <h3 style={{ fontSize: '1.15rem', fontWeight: 800, margin: 0 }}>
                Confirmer la suppression
              </h3>
            </div>
            <p style={{ fontSize: '0.85rem', color: 'var(--df-text-secondary)', lineHeight: 1.5, marginBottom: '1.25rem' }}>
              Êtes-vous certain de vouloir supprimer <strong>« {deleteConfirm.label} »</strong> ? Cette opération est immédiate.
            </p>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.65rem' }}>
              <Button variant="outline" size="sm" onClick={() => setDeleteConfirm(null)}>
                Annuler
              </Button>
              <button
                onClick={handleConfirmDelete}
                style={{
                  padding: '0.45rem 1rem',
                  borderRadius: 'var(--df-radius-sm)',
                  background: 'var(--df-status-danger)',
                  color: '#FFFFFF',
                  border: 'none',
                  fontWeight: 700,
                  fontSize: '0.82rem',
                  cursor: 'pointer',
                }}
              >
                Supprimer Définitivement
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
