'use client';

import React, { useState, useEffect } from 'react';
import { useDemoMode } from '../../context/DemoModeContext';
import { Navbar } from '../../components/navigation/Navbar';
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
import {
  ALGERIA_FISCAL_RATES,
  ALGERIA_TRANSBORDER_FUEL_TAX_DZD,
  ENACTA_OFFICIAL_FEES_DZD,
  ENACTA_INTERNAL_TCO_PROVISIONS_DZD,
} from '@docteurflotte/contracts';

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
    bypassRoute: 'Contournement Autoroute A1 (El Khroub - Didouche)',
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
  const [activeTab, setActiveTab] = useState<ComplianceTab>('ENACTA');
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
      alert("Veuillez renseigner l'immatriculation et la date d'échéance.");
      return;
    }

    if (editingEnacta) {
      setEnactaList((prev) =>
        prev.map((item) =>
          item.id === editingEnacta.id ? ({ ...item, ...enactaForm } as EnactaRecord) : item,
        ),
      );
      setNotification(`Contrôle ENACTA mis à jour pour ${enactaForm.registrationNumber}`);
    } else {
      const newRec: EnactaRecord = {
        id: `EN-${Date.now().toString().slice(-4)}`,
        registrationNumber: enactaForm.registrationNumber || '',
        makeModel: enactaForm.makeModel || 'Véhicule Flotte',
        category: (enactaForm.category as EnactaRecord['category']) || 'PL',
        lastInspectionDate: enactaForm.lastInspectionDate || '',
        expiryDate: enactaForm.expiryDate || '',
        daysRemaining: 180,
        centerName: enactaForm.centerName || 'Centre Agréé ENACTA',
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
      alert("Veuillez renseigner l'immatriculation et le numéro de police.");
      return;
    }

    if (editingInsurance) {
      setInsuranceList((prev) =>
        prev.map((item) =>
          item.id === editingInsurance.id ? ({ ...item, ...insuranceForm } as InsuranceRecord) : item,
        ),
      );
      setNotification(`Police d'assurance mise à jour pour ${insuranceForm.registrationNumber}`);
    } else {
      const newIns: InsuranceRecord = {
        id: `INS-${Date.now().toString().slice(-4)}`,
        registrationNumber: insuranceForm.registrationNumber || '',
        makeModel: insuranceForm.makeModel || 'Véhicule Flotte',
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
      setNotification(`Police d'assurance supprimée pour ${plate}`);
      setTimeout(() => setNotification(null), 4000);
    }
  };

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

        {/* HEADER COCKPIT HAUTE DENSITÉ */}
        <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-[#0c1220] p-6 shadow-sm">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2.5">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200/60 dark:border-blue-800/60">
                  <IconShieldCheck size={13} />
                  Algérie-First • ENACTA &amp; Fiscalité
                </span>
                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-mono bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                  58 Wilayas
                </span>
              </div>
              <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">
                Cockpit Conformité &amp; Réglementation Flotte
              </h1>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Passeport réglementaire opposable, préavis ENACTA, polices d&apos;assurance et fiscalité DGI en Dinars Algériens.
              </p>
            </div>

            <div className="flex items-center gap-2.5">
              {activeTab === 'ENACTA' && (
                <Button variant="primary" size="sm" onClick={handleOpenAddEnacta} className="shadow-sm">
                  <IconPlus size={14} />
                  <span>+ Visite ENACTA</span>
                </Button>
              )}
              {activeTab === 'INSURANCE' && (
                <Button variant="primary" size="sm" onClick={handleOpenAddInsurance} className="shadow-sm">
                  <IconPlus size={14} />
                  <span>+ Police Assurance</span>
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* LAYOUT PRINCIPAL : SIDEBAR BENTO + CONTENU */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* SIDEBAR PILIERS RÉGLEMENTAIRES */}
          <aside className="lg:col-span-3 space-y-4">
            <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-[#0c1220] p-4 shadow-sm">
              <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-3 px-1">
                Piliers Réglementaires DZ
              </div>

              <nav className="flex flex-col gap-1.5">
                {[
                  {
                    id: 'ENACTA',
                    label: 'Contrôles ENACTA',
                    count: enactaList.length,
                    icon: <IconShieldCheck size={16} />,
                    desc: 'Périodicité 6m / 12m / 24m',
                  },
                  {
                    id: 'INSURANCE',
                    label: 'Assurances & Cartes',
                    count: insuranceList.length,
                    icon: <IconFileText size={16} />,
                    desc: 'CAAT, SAA, CASH, Alliance',
                  },
                  {
                    id: 'WILAYAS',
                    label: 'Restrictions Wilayas',
                    count: WILAYA_RESTRICTIONS.length,
                    icon: <IconCompass size={16} />,
                    desc: 'Arrêtés préfectoraux & rocad.',
                  },
                  {
                    id: 'TAXES',
                    label: 'Fiscalité & Vignettes',
                    icon: <IconCreditCard size={16} />,
                    desc: 'TVA 19%/9%, Timbre, LF 2026',
                  },
                ].map((item) => {
                  const isActive = activeTab === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => setActiveTab(item.id as ComplianceTab)}
                      className={`w-full flex items-center justify-between p-3 rounded-xl text-left transition-all ${
                        isActive
                          ? 'bg-blue-50/80 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border border-blue-200/80 dark:border-blue-800/60 shadow-xs font-semibold'
                          : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-900/60 border border-transparent font-medium'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <span className={isActive ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400 dark:text-slate-500'}>
                          {item.icon}
                        </span>
                        <div className="min-w-0">
                          <div className="text-sm truncate">{item.label}</div>
                          <div className="text-[11px] text-slate-400 dark:text-slate-500 truncate">{item.desc}</div>
                        </div>
                      </div>
                      {item.count !== undefined && (
                        <span
                          className={`font-mono text-xs px-2 py-0.5 rounded-full shrink-0 ${
                            isActive
                              ? 'bg-blue-600 text-white dark:bg-blue-500'
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
                          }`}
                        >
                          {item.count}
                        </span>
                      )}
                    </button>
                  );
                })}
              </nav>

              <div className="my-4 border-t border-slate-100 dark:border-slate-800/80" />

              <div className="space-y-2">
                <Button
                  variant="primary"
                  size="sm"
                  onClick={handleOpenAddEnacta}
                  className="w-full justify-center text-xs py-2 shadow-xs"
                >
                  <IconPlus size={13} />
                  <span>+ Visite ENACTA</span>
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={handleOpenAddInsurance}
                  className="w-full justify-center text-xs py-2"
                >
                  <IconPlus size={13} />
                  <span>+ Police Assurance</span>
                </Button>
              </div>
            </div>

            {/* BADGE SOUVERAINETÉ LOI 18-07 */}
            <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800/80 bg-slate-50/50 dark:bg-[#0c1220]/50 p-4 text-xs text-slate-500 dark:text-slate-400 space-y-1.5 shadow-xs">
              <div className="flex items-center gap-1.5 font-bold text-slate-800 dark:text-slate-200">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                Souveraineté Loi 18-07 (ANPDP)
              </div>
              <p className="leading-relaxed text-[11px]">
                Hébergement certifié sur le territoire national. Zéro fuite PII vers des plateformes télématiques tierces.
              </p>
            </div>
          </aside>

          {/* CONTENU CENTRAL PRINCIPAL */}
          <section className="lg:col-span-9 space-y-6">
            {/* VUE 1 : CONTRÔLES TECHNIQUES ENACTA */}
            {activeTab === 'ENACTA' && (
              <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-[#0c1220] overflow-hidden shadow-sm">
                <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800/80 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-slate-50/40 dark:bg-slate-900/20">
                  <div>
                    <h2 className="text-base font-bold text-slate-900 dark:text-white">
                      Registres de Contrôle Technique ENACTA
                    </h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Décret exécutif n° 03-223 &amp; Décret 17-255 • Poids Lourds (6m), VUL (&lt;4 ans: 24m / ≥4 ans: 12m), VL (24m).
                    </p>
                  </div>
                  <span className="font-mono text-xs px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 self-start sm:self-auto">
                    {enactaList.length} certificat(s)
                  </span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="bg-slate-50 dark:bg-slate-900/60 border-b border-slate-200/80 dark:border-slate-800 text-slate-500 dark:text-slate-400 uppercase tracking-wider text-[11px] font-semibold">
                        <th className="py-3.5 px-4">Véhicule / Immatriculation</th>
                        <th className="py-3.5 px-4">Catégorie</th>
                        <th className="py-3.5 px-4">Dernière Visite</th>
                        <th className="py-3.5 px-4">Échéance Légale</th>
                        <th className="py-3.5 px-4">Centre ENACTA</th>
                        <th className="py-3.5 px-4">Statut</th>
                        <th className="py-3.5 px-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                      {enactaList.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="py-12 px-4 text-center">
                            <div className="inline-flex items-center justify-center h-12 w-12 rounded-2xl bg-blue-50 dark:bg-blue-950/50 border border-blue-200/80 dark:border-blue-800 text-blue-600 dark:text-blue-400 mb-3">
                              <IconShieldCheck size={24} />
                            </div>
                            <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-1">
                              Aucun contrôle technique ENACTA enregistré
                            </h3>
                            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto mb-4">
                              Consignez une première visite de conformité ou activez le mode démo pour explorer les alertes d&apos;échéance.
                            </p>
                            <Button variant="primary" size="sm" onClick={handleOpenAddEnacta}>
                              <IconPlus size={14} />
                              <span>Ajouter un contrôle ENACTA</span>
                            </Button>
                          </td>
                        </tr>
                      ) : (
                        enactaList.map((item) => {
                          const isExpired = item.daysRemaining < 0;
                          const isUrgent = item.daysRemaining >= 0 && item.daysRemaining <= 30;

                          return (
                            <tr
                              key={item.id}
                              className="hover:bg-slate-50/80 dark:hover:bg-slate-900/40 transition-colors"
                            >
                              <td className="py-3.5 px-4">
                                <div className="font-mono font-bold text-slate-900 dark:text-white text-xs">
                                  {item.registrationNumber}
                                </div>
                                <div className="text-[11px] text-slate-400 dark:text-slate-500">
                                  {item.makeModel}
                                </div>
                              </td>
                              <td className="py-3.5 px-4">
                                <span className="inline-flex px-2 py-0.5 rounded-md text-[11px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                                  {item.category}
                                </span>
                              </td>
                              <td className="py-3.5 px-4 font-mono text-slate-600 dark:text-slate-300">
                                {item.lastInspectionDate}
                              </td>
                              <td className="py-3.5 px-4">
                                <div className="font-mono font-medium text-slate-800 dark:text-slate-200">
                                  {item.expiryDate}
                                </div>
                                <span
                                  className={`inline-block text-[10px] font-bold uppercase tracking-wider ${
                                    isExpired
                                      ? 'text-rose-600 dark:text-rose-400'
                                      : isUrgent
                                        ? 'text-amber-600 dark:text-amber-400'
                                        : 'text-emerald-600 dark:text-emerald-400'
                                  }`}
                                >
                                  {isExpired
                                    ? `ÉCHU (${Math.abs(item.daysRemaining)}j)`
                                    : `${item.daysRemaining}j restants`}
                                </span>
                              </td>
                              <td className="py-3.5 px-4">
                                <div className="text-slate-800 dark:text-slate-200">{item.centerName}</div>
                                <div className="text-[10px] text-slate-400 dark:text-slate-500">{item.wilaya}</div>
                              </td>
                              <td className="py-3.5 px-4">
                                {item.status === 'VALID' && (
                                  <Badge variant="ok" pulse>
                                    CONFORME
                                  </Badge>
                                )}
                                {item.status === 'WARNING' && (
                                  <Badge variant="warning" pulse>
                                    PRÉAVIS
                                  </Badge>
                                )}
                                {item.status === 'EXPIRED' && (
                                  <Badge variant="danger" pulse>
                                    FOURRIÈRE
                                  </Badge>
                                )}
                              </td>
                              <td className="py-3.5 px-4 text-right">
                                <div className="inline-flex items-center gap-1.5">
                                  <button
                                    onClick={() => handleOpenEditEnacta(item)}
                                    title="Modifier ce contrôle"
                                    className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                                  >
                                    <IconEdit size={13} />
                                  </button>
                                  <button
                                    onClick={() => handleDeleteEnacta(item.id, item.registrationNumber)}
                                    title="Supprimer ce contrôle"
                                    className="p-1.5 rounded-lg border border-rose-200 dark:border-rose-900/60 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/50 transition-colors"
                                  >
                                    <IconTrash size={13} />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* VUE 2 : PORTEFEUILLE ASSURANCES & CARTES GRISES */}
            {activeTab === 'INSURANCE' && (
              <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-[#0c1220] overflow-hidden shadow-sm">
                <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800/80 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-slate-50/40 dark:bg-slate-900/20">
                  <div>
                    <h2 className="text-base font-bold text-slate-900 dark:text-white">
                      Polices d&apos;Assurance Flotte &amp; RC Automobile
                    </h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Ordonnance n° 03-12 • Assurance obligatoire CatNat, Tous Risques &amp; Tiers Transport.
                    </p>
                  </div>
                  <span className="font-mono text-xs px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 self-start sm:self-auto">
                    {insuranceList.length} police(s)
                  </span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="bg-slate-50 dark:bg-slate-900/60 border-b border-slate-200/80 dark:border-slate-800 text-slate-500 dark:text-slate-400 uppercase tracking-wider text-[11px] font-semibold">
                        <th className="py-3.5 px-4">Immatriculation</th>
                        <th className="py-3.5 px-4">Compagnie</th>
                        <th className="py-3.5 px-4">N° de Police</th>
                        <th className="py-3.5 px-4">Formule</th>
                        <th className="py-3.5 px-4">Échéance</th>
                        <th className="py-3.5 px-4">Statut</th>
                        <th className="py-3.5 px-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                      {insuranceList.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="py-12 px-4 text-center">
                            <div className="inline-flex items-center justify-center h-12 w-12 rounded-2xl bg-blue-50 dark:bg-blue-950/50 border border-blue-200/80 dark:border-blue-800 text-blue-600 dark:text-blue-400 mb-3">
                              <IconFileText size={24} />
                            </div>
                            <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-1">
                              Aucune police d&apos;assurance enregistrée
                            </h3>
                            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto mb-4">
                              Enregistrez vos polices CAAT, SAA, CASH ou Alliance pour verrouiller les départs en mission.
                            </p>
                            <Button variant="primary" size="sm" onClick={handleOpenAddInsurance}>
                              <IconPlus size={14} />
                              <span>Ajouter une police d&apos;assurance</span>
                            </Button>
                          </td>
                        </tr>
                      ) : (
                        insuranceList.map((ins) => (
                          <tr
                            key={ins.id}
                            className="hover:bg-slate-50/80 dark:hover:bg-slate-900/40 transition-colors"
                          >
                            <td className="py-3.5 px-4">
                              <div className="font-mono font-bold text-slate-900 dark:text-white text-xs">
                                {ins.registrationNumber}
                              </div>
                              <div className="text-[11px] text-slate-400 dark:text-slate-500">
                                {ins.makeModel}
                              </div>
                            </td>
                            <td className="py-3.5 px-4">
                              <span className="font-bold text-blue-600 dark:text-blue-400">
                                {ins.insurer}
                              </span>
                            </td>
                            <td className="py-3.5 px-4 font-mono text-slate-700 dark:text-slate-300">
                              {ins.policyNumber}
                            </td>
                            <td className="py-3.5 px-4">
                              <Badge variant="neutral">
                                {ins.coverageType.replace('_', ' ')}
                              </Badge>
                            </td>
                            <td className="py-3.5 px-4 font-mono text-slate-700 dark:text-slate-300">
                              {ins.expiryDate}
                            </td>
                            <td className="py-3.5 px-4">
                              {ins.status === 'VALID' ? (
                                <Badge variant="ok" pulse>
                                  EN COURS
                                </Badge>
                              ) : (
                                <Badge variant="warning" pulse>
                                  RENOUVELLEMENT
                                </Badge>
                              )}
                            </td>
                            <td className="py-3.5 px-4 text-right">
                              <div className="inline-flex items-center gap-1.5">
                                <button
                                  onClick={() => handleOpenEditInsurance(ins)}
                                  title="Modifier"
                                  className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                                >
                                  <IconEdit size={13} />
                                </button>
                                <button
                                  onClick={() => handleDeleteInsurance(ins.id, ins.registrationNumber)}
                                  title="Supprimer"
                                  className="p-1.5 rounded-lg border border-rose-200 dark:border-rose-900/60 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/50 transition-colors"
                                >
                                  <IconTrash size={13} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* VUE 3 : RESTRICTIONS DE CIRCULATION PAR WILAYA */}
            {activeTab === 'WILAYAS' && (
              <div className="space-y-4">
                <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-[#0c1220] p-5 shadow-sm">
                  <h2 className="text-base font-bold text-slate-900 dark:text-white mb-1">
                    Arrêtés Préfectoraux de Circulation Poids Lourds
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Dérogations et fenêtres horaires d&apos;interdiction de traversée urbaine pour les 58 Wilayas d&apos;Algérie.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {WILAYA_RESTRICTIONS.map((wil) => (
                    <div
                      key={wil.wilayaCode}
                      className="rounded-2xl border border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-[#0c1220] p-5 shadow-sm space-y-3"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="text-base font-black text-slate-900 dark:text-white">
                            Wilaya de {wil.wilayaName} ({wil.wilayaCode})
                          </div>
                          <div className="font-mono text-[11px] text-slate-400 dark:text-slate-500">
                            {wil.legalReference}
                          </div>
                        </div>
                        <Badge
                          variant={wil.activeStatus === 'STRICT_PEAK' ? 'warning' : 'ok'}
                          pulse
                        >
                          {wil.activeStatus === 'STRICT_PEAK' ? 'HEURES DE POINTE' : 'DÉROGATION 24/7'}
                        </Badge>
                      </div>

                      <div className="flex items-center gap-2 p-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200/80 dark:border-rose-900/50 text-rose-700 dark:text-rose-300 text-xs font-semibold">
                        <IconAlertTriangle size={15} className="shrink-0 text-rose-600 dark:text-rose-400" />
                        <span>
                          Interdiction : &gt; {wil.tonnageLimit}T de {wil.restrictedHours}
                        </span>
                      </div>

                      <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200/60 dark:border-slate-800/60 text-xs">
                        <span className="text-slate-500 dark:text-slate-400">Déviation obligatoire : </span>
                        <strong className="text-blue-600 dark:text-blue-400 font-semibold">
                          {wil.bypassRoute}
                        </strong>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* VUE 4 : BARÈMES FISCAUX DGI & TARIFS ENACTA (DÉTERMINISTES) */}
            {activeTab === 'TAXES' && (
              <div className="space-y-6">
                {/* BLOC 1 : TVA & DROIT DE TIMBRE FISCAL */}
                <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-[#0c1220] p-6 shadow-sm space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-base font-bold text-slate-900 dark:text-white">
                        Barème Fiscal DGI Algérie (Loi de Finances en vigueur)
                      </h2>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        Code des Taxes sur le Chiffre d&apos;Affaires &amp; Code du Timbre (Art. 252).
                      </p>
                    </div>
                    <span className="text-xs font-mono px-2.5 py-1 rounded-md bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300">
                      Réf: {ALGERIA_FISCAL_RATES.legalReference}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800">
                      <div className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold">
                        TVA Taux Normal
                      </div>
                      <div className="text-2xl font-black font-mono text-slate-900 dark:text-white mt-1">
                        {(ALGERIA_FISCAL_RATES.STANDARD_VAT_RATE * 100).toFixed(0)} %
                      </div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                        Transport, pièces atelier &amp; télématique
                      </div>
                    </div>

                    <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800">
                      <div className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold">
                        TVA Taux Réduit
                      </div>
                      <div className="text-2xl font-black font-mono text-slate-900 dark:text-white mt-1">
                        {(ALGERIA_FISCAL_RATES.REDUCED_VAT_RATE * 100).toFixed(0)} %
                      </div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                        Transport frigorifique agricole &amp; intrants
                      </div>
                    </div>

                    <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800">
                      <div className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold">
                        Droit de Timbre Espèces
                      </div>
                      <div className="text-2xl font-black font-mono text-slate-900 dark:text-white mt-1">
                        {(ALGERIA_FISCAL_RATES.CASH_STAMP_DUTY_RATE * 100).toFixed(0)} %
                      </div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                        Min: {ALGERIA_FISCAL_RATES.CASH_STAMP_DUTY_MIN_DZD} DA • Max: {ALGERIA_FISCAL_RATES.CASH_STAMP_DUTY_MAX_DZD} DA
                      </div>
                    </div>

                    <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800">
                      <div className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold">
                        Plafond Amortissement VL
                      </div>
                      <div className="text-xl font-black font-mono text-slate-900 dark:text-white mt-1">
                        {(ALGERIA_FISCAL_RATES.PASSENGER_VEHICLE_AMORTIZATION_CEILING_DZD / 1_000_000).toFixed(1)} M DA
                      </div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                        Art. 141 CIDTA (3 000 000 DZD)
                      </div>
                    </div>
                  </div>
                </div>

                {/* BLOC 2 : TAXE CARBURANT TRANSFRONTALIÈRE (LF 2020 ART. 81) */}
                <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-[#0c1220] p-6 shadow-sm space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-base font-bold text-slate-900 dark:text-white">
                        Taxe Carburant Transfrontalière (Sortie des Frontières Terrestres)
                      </h2>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        {ALGERIA_TRANSBORDER_FUEL_TAX_DZD.legalReference}
                      </p>
                    </div>
                    <span className="text-xs font-mono px-2.5 py-1 rounded-md bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                      Douanes Algériennes (DGD)
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800">
                      <div className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                        Véhicules de Tourisme (VP)
                      </div>
                      <div className="text-xl font-black font-mono text-slate-900 dark:text-white mt-1">
                        {ALGERIA_TRANSBORDER_FUEL_TAX_DZD.PASSENGER_CAR.toLocaleString('fr-DZ')} DZD
                      </div>
                      <div className="text-[11px] text-slate-400 mt-1">Par passage frontalier terrestre</div>
                    </div>

                    <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800">
                      <div className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                        Utilitaires VUL &amp; Camions &lt; 10T
                      </div>
                      <div className="text-xl font-black font-mono text-slate-900 dark:text-white mt-1">
                        {ALGERIA_TRANSBORDER_FUEL_TAX_DZD.LCV_AND_TRUCKS_UNDER_10T.toLocaleString('fr-DZ')} DZD
                      </div>
                      <div className="text-[11px] text-slate-400 mt-1">Fret commercial régional</div>
                    </div>

                    <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800">
                      <div className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                        Poids Lourds ≥ 10T &amp; Autocars
                      </div>
                      <div className="text-xl font-black font-mono text-slate-900 dark:text-white mt-1">
                        {ALGERIA_TRANSBORDER_FUEL_TAX_DZD.HEAVY_TRUCKS_10T_PLUS_AND_BUS.toLocaleString('fr-DZ')} DZD
                      </div>
                      <div className="text-[11px] text-slate-400 mt-1">Semi-remorques &amp; convois</div>
                    </div>
                  </div>
                </div>

                {/* BLOC 3 : GRILLE TARIFAIRE OFFICIELLE ENACTA */}
                <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-[#0c1220] p-6 shadow-sm space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-base font-bold text-slate-900 dark:text-white">
                        Tarifs Réglementaires Officiels du Contrôle Technique (Arrêté du 6 mai 2004)
                      </h2>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        Tarifs légaux constatés auprès des centres agréés ENACTA vs Provisions TCO DocteurFlotte.
                      </p>
                    </div>
                    <span className="text-xs font-mono px-2.5 py-1 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                      Ministère des Transports
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800">
                      <div className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                        Voiture Particulière (VP)
                      </div>
                      <div className="text-xl font-black font-mono text-slate-900 dark:text-white mt-1">
                        {ENACTA_OFFICIAL_FEES_DZD.LIGHT_PASSENGER_TTC.toFixed(0)} DZD
                      </div>
                      <div className="text-[11px] text-slate-400 mt-1">
                        Provision TCO: {ENACTA_INTERNAL_TCO_PROVISIONS_DZD.LIGHT_PASSENGER} DZD
                      </div>
                    </div>

                    <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800">
                      <div className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                        Utilitaire Léger (VUL)
                      </div>
                      <div className="text-xl font-black font-mono text-slate-900 dark:text-white mt-1">
                        {ENACTA_OFFICIAL_FEES_DZD.COMMERCIAL_VAN_VUL_TTC.toFixed(0)} DZD
                      </div>
                      <div className="text-[11px] text-slate-400 mt-1">
                        Provision TCO: {ENACTA_INTERNAL_TCO_PROVISIONS_DZD.COMMERCIAL_VAN_VUL} DZD
                      </div>
                    </div>

                    <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800">
                      <div className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                        Poids Lourd Porteur (&gt; 3.5T)
                      </div>
                      <div className="text-xl font-black font-mono text-slate-900 dark:text-white mt-1">
                        {ENACTA_OFFICIAL_FEES_DZD.HEAVY_TRUCK_RIGID_TTC.toFixed(0)} DZD
                      </div>
                      <div className="text-[11px] text-slate-400 mt-1">
                        Provision TCO: {ENACTA_INTERNAL_TCO_PROVISIONS_DZD.HEAVY_TRUCK_RIGID} DZD
                      </div>
                    </div>

                    <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800">
                      <div className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                        Tracteur &amp; Semi-Remorque
                      </div>
                      <div className="text-xl font-black font-mono text-slate-900 dark:text-white mt-1">
                        {ENACTA_OFFICIAL_FEES_DZD.TRACTOR_TRAILER_TTC.toFixed(0)} DZD
                      </div>
                      <div className="text-[11px] text-slate-400 mt-1">
                        Provision TCO: {ENACTA_INTERNAL_TCO_PROVISIONS_DZD.TRACTOR_TRAILER} DZD
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </section>
        </div>
      </main>

      {/* MODAL CRUD ENACTA */}
      {isEnactaModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-lg rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0c1220] p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                {editingEnacta ? 'Modifier Contrôle ENACTA' : 'Nouveau Contrôle Technique ENACTA'}
              </h3>
              <button
                onClick={() => setIsEnactaModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
              >
                <IconX size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveEnacta} className="space-y-4 text-xs">
              <div>
                <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Immatriculation Véhicule (Format Algérien : 02410-117-22) *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: 00421-116-16"
                  value={enactaForm.registrationNumber || ''}
                  onChange={(e) => setEnactaForm({ ...enactaForm, registrationNumber: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white font-mono focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                />
              </div>

              <div>
                <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Marque &amp; Modèle
                </label>
                <input
                  type="text"
                  placeholder="Ex: Renault Trucks K 480"
                  value={enactaForm.makeModel || ''}
                  onChange={(e) => setEnactaForm({ ...enactaForm, makeModel: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Catégorie
                  </label>
                  <select
                    value={enactaForm.category || 'PL'}
                    onChange={(e) =>
                      setEnactaForm({ ...enactaForm, category: e.target.value as EnactaRecord['category'] })
                    }
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                  >
                    <option value="PL">Poids Lourds (PL)</option>
                    <option value="BTP">Engins BTP</option>
                    <option value="VL">Véhicule Léger (VL)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Date Limite Échéance *
                  </label>
                  <input
                    type="date"
                    required
                    value={enactaForm.expiryDate || ''}
                    onChange={(e) => setEnactaForm({ ...enactaForm, expiryDate: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Centre Agréé ENACTA
                </label>
                <input
                  type="text"
                  placeholder="Ex: Centre ENACTA Rouiba (16)"
                  value={enactaForm.centerName || ''}
                  onChange={(e) => setEnactaForm({ ...enactaForm, centerName: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100 dark:border-slate-800">
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

      {/* MODAL CRUD ASSURANCE */}
      {isInsuranceModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-lg rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0c1220] p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                {editingInsurance ? "Modifier Police d'Assurance" : "Nouvelle Police d'Assurance"}
              </h3>
              <button
                onClick={() => setIsInsuranceModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
              >
                <IconX size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveInsurance} className="space-y-4 text-xs">
              <div>
                <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Immatriculation Véhicule *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: 01892-116-16"
                  value={insuranceForm.registrationNumber || ''}
                  onChange={(e) => setInsuranceForm({ ...insuranceForm, registrationNumber: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white font-mono focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Compagnie d&apos;Assurance
                  </label>
                  <select
                    value={insuranceForm.insurer || 'CAAT'}
                    onChange={(e) =>
                      setInsuranceForm({
                        ...insuranceForm,
                        insurer: e.target.value as InsuranceRecord['insurer'],
                      })
                    }
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                  >
                    <option value="CAAT">CAAT</option>
                    <option value="SAA">SAA</option>
                    <option value="CASH">CASH Assurances</option>
                    <option value="MACIR_VIE">Macir Vie</option>
                    <option value="ALLIANCE">Alliance Assurances</option>
                  </select>
                </div>

                <div>
                  <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                    N° de Police *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: CAAT-FLT-2026-00481"
                    value={insuranceForm.policyNumber || ''}
                    onChange={(e) => setInsuranceForm({ ...insuranceForm, policyNumber: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white font-mono focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Formule de Couverture
                  </label>
                  <select
                    value={insuranceForm.coverageType || 'TOUS_RISQUES'}
                    onChange={(e) =>
                      setInsuranceForm({
                        ...insuranceForm,
                        coverageType: e.target.value as InsuranceRecord['coverageType'],
                      })
                    }
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                  >
                    <option value="TOUS_RISQUES">Tous Risques</option>
                    <option value="TIERS_COLLISION">Tiers &amp; Collision</option>
                    <option value="RESPONSABILITE_CIVILE">Responsabilité Civile</option>
                  </select>
                </div>

                <div>
                  <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Date d&apos;Échéance *
                  </label>
                  <input
                    type="date"
                    required
                    value={insuranceForm.expiryDate || ''}
                    onChange={(e) => setInsuranceForm({ ...insuranceForm, expiryDate: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100 dark:border-slate-800">
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
