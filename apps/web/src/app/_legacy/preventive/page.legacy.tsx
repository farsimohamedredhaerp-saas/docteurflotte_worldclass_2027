'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useDemoMode } from '@/context/DemoModeContext';
import { Navbar } from '@/components/navigation/Navbar';
import { Badge } from '@/components/Badge';
import { Button } from '@/components/Button';
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
  IconHardHat,
  IconLayers,
  IconCpu,
} from '@/components/navigation/TechIcons';
import { BreakthroughInnovationsPanel } from '@/components/preventive/BreakthroughInnovationsPanel';

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
    engineOilSpec: 'Cat DEO 15W-40 (30 Litres)',
    transmissionSpec: 'Cat HYDO Advanced 10 (Hydraulique 260L)',
    coolantSpec: 'Cat ELC (Extended Life Coolant 50/50)',
    criticalPoints: [
      'Contrôle échantillon SOS huile hydraulique et réducteurs',
      'Soufflage quotidien cartouches filtrantes primaires à air',
      'Tension chenilles et usure barbotins / galets',
    ],
  },
  {
    id: 'TPL-TY-HILUX',
    make: 'Toyota',
    model: 'Hilux 2.8 D-4D 4x4 (Pick-up Sahara)',
    category: 'UTILITAIRES',
    standardIntervalText: '10 000 km / 6 mois',
    saharaIntervalText: '6 500 km (Arrhenius Poussière & Piste)',
    severityFactor: 0.65,
    engineOilSpec: '5W-30 C2 / 15W-40 D-4D (7.5 Litres)',
    transmissionSpec: '75W-90 GL-5 Différentiel LSD (Pont AR)',
    coolantSpec: 'Toyota Super Long Life Coolant Pink',
    criticalPoints: [
      'Remplacement filtre à gasoil tous les 10 000 km (protection Common Rail)',
      'Contrôle amortisseurs renforcés grand débattement',
      'Graissage arbres de transmission et croisillons',
    ],
  },
  {
    id: 'TPL-SH-F3000',
    make: 'Shacman',
    model: 'F3000 6x4 Benne Weichai WP12.430',
    category: 'POIDS_LOURDS',
    standardIntervalText: '30 000 km / 600 h',
    saharaIntervalText: '18 000 km / 380 h (Facteur 0.60 Chaleur)',
    severityFactor: 0.60,
    engineOilSpec: '15W-40 API CI-4 Weichai Genuine (34 Litres)',
    transmissionSpec: 'Fast Fuller 12JSD200T 85W-90 (13 Litres)',
    coolantSpec: 'Liquide vert éthylène-glycol 50%',
    criticalPoints: [
      'Serrage brides de pont et ressorts de suspension à lames',
      'Vérification jeu de boîte Fast Gear et tringlerie',
      'Remplacement filtre décanteur Fleetguard FS19732',
    ],
  },
];

export default function PreventiveMaintenancePage() {
  const { isDemoMode } = useDemoMode();
  const [climateZone, setClimateZone] = useState<'TELL' | 'PLATEAUS' | 'SAHARA'>('SAHARA');
  const [templates, setTemplates] = useState<OemMaintenanceTemplate[]>(INITIAL_OEM_TEMPLATES);
  const [upcoming, setUpcoming] = useState<UpcomingPreventiveDue[]>([]);
  const [isLoadingUpcoming, setIsLoadingUpcoming] = useState(true);

  // Filtres
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [selectedUrgency, setSelectedUrgency] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [notification, setNotification] = useState<string | null>(null);

  useEffect(() => {
    if (isDemoMode) {
      import('@/lib/simulation-sandbox').then((sandbox) => {
        setUpcoming(sandbox.MOCK_SANDBOX_PREVENTIVE_DUES);
        setIsLoadingUpcoming(false);
      });
    } else {
      setUpcoming([]);
      setIsLoadingUpcoming(false);
    }
  }, [isDemoMode]);

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
    showNotification(`Ordre de Travail Préventif déclenché pour l'actif ${plate} (${template}). Transmis à l'atelier.`);
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
      showNotification(`Programme d'entretien ${templateForm.make} ${templateForm.model} mis à jour avec succès.`);
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
      showNotification(`Nouveau gabarit OEM ${templateForm.make} ${templateForm.model} ajouté au catalogue.`);
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
      showNotification(`Échéance préventive de l'actif ${dueForm.registrationNumber} mise à jour.`);
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
      showNotification(`Nouvelle alerte d'échéance ajoutée pour l'actif ${dueForm.registrationNumber}.`);
    }
    setIsDueModalOpen(false);
  };

  // Suppression
  const handleConfirmDelete = () => {
    if (!deleteConfirm) return;
    if (deleteConfirm.type === 'TEMPLATE') {
      setTemplates((prev) => prev.filter((t) => t.id !== deleteConfirm.id));
      showNotification(`Programme OEM « ${deleteConfirm.label} » supprimé du référentiel.`);
    } else {
      setUpcoming((prev) => prev.filter((d) => d.id !== deleteConfirm.id));
      showNotification(`Alerte d'échéance pour « ${deleteConfirm.label} » supprimée.`);
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
    <div className="min-h-screen bg-slate-50 text-slate-900 dark:bg-[#090D16] dark:text-slate-100 transition-colors duration-150">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* BANNIÈRE DE NOTIFICATION */}
        {notification && (
          <div
            role="status"
            className="flex items-center gap-3 px-4 py-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 text-sm font-medium shadow-sm transition-all"
          >
            <div className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
            </div>
            <IconCheck size={16} className="text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span>{notification}</span>
          </div>
        )}

        {/* EN-TÊTE PRINCIPAL COCKPIT */}
        <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-[#0c1220] p-6 shadow-sm">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-5">
            <div className="space-y-2">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200/80 dark:border-emerald-800/60">
                  <IconCpu size={13} />
                  MAINTENANCE 5.0 PRESCRIPTIVE &amp; COGNITIVE
                </span>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200/80 dark:border-blue-800/60">
                  SOUVERAIN ALGÉRIE (LOI 18-07)
                </span>
                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-mono bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                  Physique Déterministe 0 DA • DZD
                </span>
              </div>
              <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">
                Cockpit de Maintenance 5.0 &amp; Plans Constructeur OEM
              </h1>
              <p className="text-sm text-slate-500 dark:text-slate-400 max-w-3xl">
                Le décisionnel prescriptif de classe mondiale : 5 algorithmes physiques déterministes à 0 DA de coût matériel, arbitrage financier direct en Dinars Algériens (SAD $\rightarrow$ ADS), et bibliothèque de programmes d&apos;entretien constructeur calibrés pour le stress saharien.
              </p>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              <div className="px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800 text-right">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                  Zone Climatique Active
                </span>
                <strong className="text-xs font-bold text-blue-600 dark:text-blue-400">
                  {climateZone === 'SAHARA'
                    ? 'Grand Sud (Sahara > 45°C)'
                    : climateZone === 'PLATEAUS'
                      ? 'Hauts-Plateaux'
                      : 'Tell / Littoral'}
                </strong>
              </div>
            </div>
          </div>
        </div>

        {/* SECTION MONOPOLE : 5 INNOVATIONS TECHNOLOGIQUES DE RUPTURE (0 DA) */}
        <section>
          <BreakthroughInnovationsPanel />
        </section>

        {/* LAYOUT DUAL-COLUMN : SIDEBAR FILTRES + CONTENU ÉCHÉANCES & CATALOGUE */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* SIDEBAR CONTEXTUELLE VERTICALE */}
          <aside className="lg:col-span-3 space-y-4">
            <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-[#0c1220] p-4 shadow-sm space-y-4">
              <div>
                <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2 px-1">
                  Actions Rapides
                </div>
                <div className="space-y-2">
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => handleOpenTemplateModal()}
                    className="w-full justify-center text-xs py-2 shadow-xs"
                  >
                    <IconPlus size={13} />
                    <span>Nouveau Plan OEM</span>
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => handleOpenDueModal()}
                    className="w-full justify-center text-xs py-2"
                  >
                    <IconPlus size={13} />
                    <span>Ajouter Échéance</span>
                  </Button>
                </div>
              </div>

              <div className="border-t border-slate-100 dark:border-slate-800" />

              <div>
                <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2 px-1">
                  Filtre par Catégorie
                </div>
                <nav className="flex flex-col gap-1">
                  {[
                    { id: 'ALL', label: 'Tous les Plans', count: templates.length, icon: <IconLayers size={14} /> },
                    {
                      id: 'POIDS_LOURDS',
                      label: 'Poids Lourds',
                      count: templates.filter((t) => t.category === 'POIDS_LOURDS').length,
                      icon: <IconTruck size={14} />,
                    },
                    {
                      id: 'ENGINS_BTP',
                      label: 'Engins BTP',
                      count: templates.filter((t) => t.category === 'ENGINS_BTP').length,
                      icon: <IconHardHat size={14} />,
                    },
                    {
                      id: 'UTILITAIRES',
                      label: 'Utilitaires & 4x4',
                      count: templates.filter((t) => t.category === 'UTILITAIRES').length,
                      icon: <IconTruck size={14} />,
                    },
                  ].map((item) => {
                    const isSel = selectedCategory === item.id;
                    return (
                      <button
                        key={item.id}
                        onClick={() => setSelectedCategory(item.id)}
                        className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs transition-all ${
                          isSel
                            ? 'bg-blue-50/80 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 font-bold border border-blue-200/80 dark:border-blue-800/60 shadow-xs'
                            : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-900/60 font-medium'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          {item.icon}
                          <span>{item.label}</span>
                        </div>
                        <span
                          className={`font-mono text-[10px] px-1.5 py-0.5 rounded-full ${
                            isSel
                              ? 'bg-blue-600 text-white dark:bg-blue-500'
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                          }`}
                        >
                          {item.count}
                        </span>
                      </button>
                    );
                  })}
                </nav>
              </div>

              <div className="border-t border-slate-100 dark:border-slate-800" />

              <div>
                <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2 px-1">
                  État des Échéances
                </div>
                <nav className="flex flex-col gap-1">
                  {[
                    { id: 'ALL', label: 'Toutes les Échéances', count: upcoming.length, color: 'text-slate-600 dark:text-slate-400' },
                    {
                      id: 'URGENT',
                      label: 'Dépassées (DANGER)',
                      count: upcoming.filter((u) => u.urgency === 'URGENT').length,
                      color: 'text-rose-600 dark:text-rose-400',
                    },
                    {
                      id: 'WARNING',
                      label: 'Imminentes (< 2 000)',
                      count: upcoming.filter((u) => u.urgency === 'WARNING').length,
                      color: 'text-amber-600 dark:text-amber-400',
                    },
                    {
                      id: 'NOMINAL',
                      label: 'Nominales',
                      count: upcoming.filter((u) => u.urgency === 'NOMINAL').length,
                      color: 'text-emerald-600 dark:text-emerald-400',
                    },
                  ].map((item) => {
                    const isSel = selectedUrgency === item.id;
                    return (
                      <button
                        key={item.id}
                        onClick={() => setSelectedUrgency(item.id)}
                        className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs transition-all ${
                          isSel
                            ? 'bg-slate-100 dark:bg-slate-800 font-bold'
                            : 'hover:bg-slate-50 dark:hover:bg-slate-900/60 font-medium'
                        } ${item.color}`}
                      >
                        <span>{item.label}</span>
                        <span className="font-mono text-[10px] px-1.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800">
                          {item.count}
                        </span>
                      </button>
                    );
                  })}
                </nav>
              </div>

              <div className="border-t border-slate-100 dark:border-slate-800" />

              <div>
                <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2 px-1">
                  Sévérité Thermique (Wilayas)
                </div>
                <select
                  value={climateZone}
                  onChange={(e) => setClimateZone(e.target.value as 'TELL' | 'PLATEAUS' | 'SAHARA')}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-xs font-semibold text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                >
                  <option value="SAHARA">Grand Sud (&gt; 45°C) • Arrhenius x0.65</option>
                  <option value="PLATEAUS">Hauts-Plateaux • Arrhenius x0.85</option>
                  <option value="TELL">Tell / Nord • Arrhenius x1.00</option>
                </select>
              </div>
            </div>
          </aside>

          {/* CONTENU CENTRAL : ÉCHÉANCES & CATALOGUE OEM */}
          <div className="lg:col-span-9 space-y-6">
            {/* SECTION 1 : ÉCHÉANCES PRÉVENTIVES DE LA FLOTTE */}
            <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-[#0c1220] p-6 shadow-sm space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
                <div>
                  <h2 className="text-base font-bold text-slate-900 dark:text-white">
                    Échéances Préventives de la Flotte ({filteredUpcoming.length})
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Suivi temps réel des compteurs certifiés km &amp; heures moteur selon les préconisations constructeurs.
                  </p>
                </div>
                <Button variant="secondary" size="sm" onClick={() => handleOpenDueModal()}>
                  <IconPlus size={13} />
                  <span>Ajouter Échéance</span>
                </Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredUpcoming.length === 0 ? (
                  <div className="col-span-full py-12 px-4 text-center">
                    <div className="inline-flex items-center justify-center h-12 w-12 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-500 mb-3">
                      <IconWrench size={24} />
                    </div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-1">
                      {upcoming.length === 0
                        ? 'Aucune échéance préventive enregistrée'
                        : 'Aucune échéance ne correspond à ce filtre'}
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto mb-4">
                      {upcoming.length === 0
                        ? 'Votre flotte est à jour ou activez le mode démo pour explorer la simulation d’échéances.'
                        : 'Sélectionnez un autre niveau d’urgence ou réinitialisez les filtres.'}
                    </p>
                    {upcoming.length === 0 && (
                      <Button variant="primary" size="sm" onClick={() => handleOpenDueModal()}>
                        + Planifier une première échéance
                      </Button>
                    )}
                  </div>
                ) : (
                  filteredUpcoming.map((item) => {
                    const isUrgent = item.urgency === 'URGENT';
                    const isWarning = item.urgency === 'WARNING';

                    return (
                      <div
                        key={item.id}
                        className="rounded-xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/40 dark:bg-slate-900/30 p-4 space-y-3 shadow-xs hover:border-slate-300 dark:hover:border-slate-700 transition-all"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <div className="font-mono font-bold text-sm text-slate-900 dark:text-white">
                              {item.registrationNumber}
                            </div>
                            <div className="text-xs text-slate-400 dark:text-slate-500">
                              {item.makeModel}
                            </div>
                          </div>
                          <Badge
                            variant={isUrgent ? 'danger' : isWarning ? 'warning' : 'ok'}
                            pulse
                          >
                            {isUrgent ? 'DÉPASSÉ' : isWarning ? 'IMMINENT' : 'NOMINAL'}
                          </Badge>
                        </div>

                        <div className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                          {item.templateName}
                        </div>

                        {/* Barre de progression d'échéance */}
                        <div className="space-y-1">
                          <div className="flex justify-between text-xs">
                            <span className="text-slate-500 font-mono">
                              Compteur : {item.currentCounter.toLocaleString('fr-DZ')} {item.unit}
                            </span>
                            <span
                              className={`font-mono font-bold ${
                                item.remainingCounter < 0
                                  ? 'text-rose-600 dark:text-rose-400'
                                  : 'text-emerald-600 dark:text-emerald-400'
                              }`}
                            >
                              {item.remainingCounter < 0
                                ? `Dépassement de ${Math.abs(item.remainingCounter)} ${item.unit}`
                                : `Reste ${item.remainingCounter} ${item.unit}`}
                            </span>
                          </div>
                          <div className="h-2 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
                            <div
                              className={`h-full transition-all duration-500 ${
                                item.remainingCounter < 0
                                  ? 'bg-rose-500'
                                  : item.progressPercent > 85
                                    ? 'bg-amber-500'
                                    : 'bg-emerald-500'
                              }`}
                              style={{ width: `${Math.min(100, item.progressPercent)}%` }}
                            />
                          </div>
                        </div>

                        <div className="flex items-center justify-between pt-2 border-t border-slate-200/60 dark:border-slate-800 text-xs">
                          <span className="text-[11px] text-slate-400">Site : {item.assignedSite}</span>
                          <div className="flex items-center gap-2">
                            <Button
                              variant={isUrgent ? 'primary' : 'secondary'}
                              size="sm"
                              onClick={() => handleCreateWorkOrder(item.registrationNumber, item.templateName)}
                              className="text-xs py-1"
                            >
                              Déclencher OT
                            </Button>
                            <button
                              onClick={() => handleOpenDueModal(item)}
                              title="Modifier l'échéance"
                              className="p-1 rounded text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                            >
                              <IconEdit size={13} />
                            </button>
                            <button
                              onClick={() =>
                                setDeleteConfirm({
                                  type: 'DUE',
                                  id: item.id,
                                  label: `${item.registrationNumber} (${item.templateName})`,
                                })
                              }
                              title="Supprimer l'alerte d'échéance"
                              className="p-1 rounded text-rose-500 hover:text-rose-700"
                            >
                              <IconTrash size={13} />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* SECTION 2 : CATALOGUE DES PLANS CONSTRUCTEUR OEM */}
            <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-[#0c1220] p-6 shadow-sm space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
                <div>
                  <h2 className="text-base font-bold text-slate-900 dark:text-white">
                    Programmes d&apos;Entretien Constructeur (OEM RMI)
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Spécifications techniques des fluides, viscosités et préconisations de filtration locale (Algérie-calibré).
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-xs">
                    <IconSearch size={13} className="text-slate-400" />
                    <input
                      type="text"
                      placeholder="Filtrer marque ou modèle..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="bg-transparent border-none outline-none text-xs text-slate-900 dark:text-white w-40 placeholder:text-slate-400"
                    />
                  </div>
                  <Button variant="primary" size="sm" onClick={() => handleOpenTemplateModal()}>
                    <IconPlus size={13} />
                    <span>Nouveau Plan OEM</span>
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredTemplates.map((tpl) => (
                  <div
                    key={tpl.id}
                    className="rounded-xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/40 dark:bg-slate-900/30 p-5 space-y-3.5 shadow-xs"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="text-base font-bold text-slate-900 dark:text-white">
                          {tpl.make}
                        </div>
                        <div className="text-xs font-medium text-slate-500 dark:text-slate-400">
                          {tpl.model}
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Badge variant="neutral">{tpl.category.replace('_', ' ')}</Badge>
                        <button
                          onClick={() => handleOpenTemplateModal(tpl)}
                          title="Modifier ce plan"
                          className="p-1 rounded text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                        >
                          <IconEdit size={13} />
                        </button>
                        <button
                          onClick={() =>
                            setDeleteConfirm({
                              type: 'TEMPLATE',
                              id: tpl.id,
                              label: `${tpl.make} ${tpl.model}`,
                            })
                          }
                          title="Supprimer ce plan"
                          className="p-1 rounded text-rose-500 hover:text-rose-700"
                        >
                          <IconTrash size={13} />
                        </button>
                      </div>
                    </div>

                    <div className="space-y-1.5 text-xs">
                      <div className="flex justify-between py-1 border-b border-slate-200/60 dark:border-slate-800">
                        <span className="text-slate-500">Intervalle Standard :</span>
                        <span className="font-mono font-bold text-slate-900 dark:text-white">
                          {tpl.standardIntervalText}
                        </span>
                      </div>
                      <div className="flex justify-between py-1 border-b border-slate-200/60 dark:border-slate-800">
                        <span className="text-slate-500">Intervalle Sévère Sahara :</span>
                        <span className="font-mono font-bold text-blue-600 dark:text-blue-400">
                          {tpl.saharaIntervalText}
                        </span>
                      </div>
                    </div>

                    <div className="p-3 rounded-xl bg-slate-100/70 dark:bg-slate-800/60 space-y-1 text-xs">
                      <div className="font-bold text-[11px] text-slate-700 dark:text-slate-300">
                        Fluides Homologués Naftal / Constructeur :
                      </div>
                      <div className="text-slate-600 dark:text-slate-400">
                        • Huile : <span className="font-mono text-slate-900 dark:text-white">{tpl.engineOilSpec}</span>
                      </div>
                      <div className="text-slate-600 dark:text-slate-400">
                        • Boîte/Pont : <span className="font-mono text-slate-900 dark:text-white">{tpl.transmissionSpec}</span>
                      </div>
                      <div className="text-slate-600 dark:text-slate-400">
                        • Refroidissement : <span className="font-mono text-slate-900 dark:text-white">{tpl.coolantSpec}</span>
                      </div>
                    </div>

                    <div className="space-y-1 text-xs">
                      <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                        Points de Contrôle Prioritaires :
                      </div>
                      <ul className="list-disc list-inside text-slate-600 dark:text-slate-400 space-y-0.5 text-[11px]">
                        {tpl.criticalPoints.map((pt, idx) => (
                          <li key={idx} className="truncate">
                            {pt}
                          </li>
                        ))}
                      </ul>
                    </div>

                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => handleOpenTemplateModal(tpl)}
                      className="w-full justify-center text-xs"
                    >
                      Consulter / Modifier Fiche Technique RMI
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* MODAL 1 : CRÉATION / MODIFICATION PLAN OEM */}
      {isTemplateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-xl rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0c1220] p-6 shadow-2xl max-h-[90vh] overflow-y-auto space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                {editingTemplate
                  ? `Modifier Programme OEM : ${editingTemplate.make} ${editingTemplate.model}`
                  : 'Nouveau Programme d’Entretien Constructeur (OEM)'}
              </h3>
              <button
                onClick={() => setIsTemplateModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
              >
                <IconX size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveTemplate} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Constructeur / Marque *
                  </label>
                  <input
                    type="text"
                    required
                    value={templateForm.make}
                    onChange={(e) => setTemplateForm({ ...templateForm, make: e.target.value })}
                    placeholder="Ex: Renault Trucks, Scania, CAT"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                  />
                </div>
                <div>
                  <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Modèle / Motorisation *
                  </label>
                  <input
                    type="text"
                    required
                    value={templateForm.model}
                    onChange={(e) => setTemplateForm({ ...templateForm, model: e.target.value })}
                    placeholder="Ex: K 480 DTi 13 / 320D"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Catégorie d’Actif
                </label>
                <select
                  value={templateForm.category}
                  onChange={(e) =>
                    setTemplateForm({
                      ...templateForm,
                      category: e.target.value as 'POIDS_LOURDS' | 'ENGINS_BTP' | 'UTILITAIRES',
                    })
                  }
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                >
                  <option value="POIDS_LOURDS">Poids Lourds (Tracteur / Porteur)</option>
                  <option value="ENGINS_BTP">Engins BTP &amp; Carrières</option>
                  <option value="UTILITAIRES">Utilitaires Légers &amp; 4x4</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Intervalle Standard *
                  </label>
                  <input
                    type="text"
                    required
                    value={templateForm.standardIntervalText}
                    onChange={(e) => setTemplateForm({ ...templateForm, standardIntervalText: e.target.value })}
                    placeholder="Ex: 40 000 km / 800 h"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                  />
                </div>
                <div>
                  <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Intervalle Sahara Sévère *
                  </label>
                  <input
                    type="text"
                    required
                    value={templateForm.saharaIntervalText}
                    onChange={(e) => setTemplateForm({ ...templateForm, saharaIntervalText: e.target.value })}
                    placeholder="Ex: 26 000 km / 550 h"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Huile Moteur
                  </label>
                  <input
                    type="text"
                    value={templateForm.engineOilSpec}
                    onChange={(e) => setTemplateForm({ ...templateForm, engineOilSpec: e.target.value })}
                    placeholder="15W-40 VDS-4.5"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                  />
                </div>
                <div>
                  <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Transmission
                  </label>
                  <input
                    type="text"
                    value={templateForm.transmissionSpec}
                    onChange={(e) => setTemplateForm({ ...templateForm, transmissionSpec: e.target.value })}
                    placeholder="75W-80 ZF"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                  />
                </div>
                <div>
                  <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Refroidissement
                  </label>
                  <input
                    type="text"
                    value={templateForm.coolantSpec}
                    onChange={(e) => setTemplateForm({ ...templateForm, coolantSpec: e.target.value })}
                    placeholder="OAT 50%"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Points de Contrôle Critiques (1 par ligne)
                </label>
                <textarea
                  rows={3}
                  value={templateForm.criticalPointsText}
                  onChange={(e) => setTemplateForm({ ...templateForm, criticalPointsText: e.target.value })}
                  placeholder="Double filtration gasoil Naftal&#10;Contrôle soufflage préfiltre à bain d’huile"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100 dark:border-slate-800">
                <Button variant="secondary" size="sm" type="button" onClick={() => setIsTemplateModalOpen(false)}>
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-lg rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0c1220] p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                {editingDue ? `Modifier Échéance : ${editingDue.registrationNumber}` : 'Nouvelle Échéance Préventive Flotte'}
              </h3>
              <button
                onClick={() => setIsDueModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
              >
                <IconX size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveDue} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Immatriculation / Matricule *
                  </label>
                  <input
                    type="text"
                    required
                    value={dueForm.registrationNumber}
                    onChange={(e) => setDueForm({ ...dueForm, registrationNumber: e.target.value })}
                    placeholder="01892-116-16"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white font-mono focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                  />
                </div>
                <div>
                  <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Modèle Véhicule *
                  </label>
                  <input
                    type="text"
                    required
                    value={dueForm.makeModel}
                    onChange={(e) => setDueForm({ ...dueForm, makeModel: e.target.value })}
                    placeholder="Actros 3340 / K 480"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Nom du Programme Préventif *
                </label>
                <input
                  type="text"
                  required
                  value={dueForm.templateName}
                  onChange={(e) => setDueForm({ ...dueForm, templateName: e.target.value })}
                  placeholder="Plan Poids Lourds Sévère (25 000 km)"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Compteur Actuel *
                  </label>
                  <input
                    type="number"
                    required
                    value={dueForm.currentCounter}
                    onChange={(e) => setDueForm({ ...dueForm, currentCounter: Number(e.target.value) })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                  />
                </div>
                <div>
                  <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Échéance Cible *
                  </label>
                  <input
                    type="number"
                    required
                    value={dueForm.dueCounter}
                    onChange={(e) => setDueForm({ ...dueForm, dueCounter: Number(e.target.value) })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                  />
                </div>
                <div>
                  <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Unité
                  </label>
                  <select
                    value={dueForm.unit}
                    onChange={(e) => setDueForm({ ...dueForm, unit: e.target.value as 'km' | 'h' })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                  >
                    <option value="km">Kilomètres (km)</option>
                    <option value="h">Heures moteur (h)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Site / Base Opérationnelle
                </label>
                <input
                  type="text"
                  value={dueForm.assignedSite}
                  onChange={(e) => setDueForm({ ...dueForm, assignedSite: e.target.value })}
                  placeholder="Rouiba (16), Hassi Messaoud (30)"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100 dark:border-slate-800">
                <Button variant="secondary" size="sm" type="button" onClick={() => setIsDueModalOpen(false)}>
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-md rounded-2xl border border-rose-300 dark:border-rose-900/80 bg-white dark:bg-[#0c1220] p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-rose-600 dark:text-rose-400">
              <IconAlertTriangle size={22} />
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Confirmer la suppression
              </h3>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Êtes-vous certain de vouloir supprimer <strong className="text-slate-900 dark:text-white">« {deleteConfirm.label} »</strong> ? Cette opération est immédiate.
            </p>
            <div className="flex items-center justify-end gap-2.5 pt-2">
              <Button variant="secondary" size="sm" onClick={() => setDeleteConfirm(null)}>
                Annuler
              </Button>
              <button
                onClick={handleConfirmDelete}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition-all shadow-sm"
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

