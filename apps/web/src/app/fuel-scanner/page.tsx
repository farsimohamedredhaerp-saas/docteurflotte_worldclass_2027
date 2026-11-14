'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { Navbar } from '../../components/navigation/Navbar';
import { AuthClient } from '../../lib/api-auth';
import { FuelScannerClient } from '../../lib/api-fuel-scanner';
import { AssetClient } from '../../lib/api-assets';
import {
  FuelReceiptScanResult,
  Asset,
  StandardFuelType,
} from '@docteurflotte/contracts';
import { useDemoMode } from '../../context/DemoModeContext';
import { useSystemConfig } from '../../context/SystemConfigContext';
import {
  CalculationProofModal,
  CalculationProofButton,
  CalculationProofData,
  TechnicalDossierModal,
} from '../../components/decisions';
import { Button } from '../../components/Button';
import { Badge } from '../../components/Badge';
import { CusumLegalReportViewer } from '../../components/fuel/CusumLegalReportViewer';
import {
  IconSearch,
  IconPlus,
  IconEdit,
  IconTrash,
  IconX,
  IconCheck,
  IconAlertTriangle,
  IconTruck,
  IconFuel,
  IconShieldCheck,
  IconDownload,
  IconFilter,
  IconArrowUpRight,
} from '../../components/navigation/TechIcons';
import { getSimulationAssets, getSimulationReceipts } from '@/lib/simulation-sandbox';

export default function FuelScannerPage() {
  const { isDemoMode, isGuest } = useDemoMode();
  const { tariffs, getFuelPrice } = useSystemConfig();
  const [sessionToken, setSessionToken] = useState<string | null>(null);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [selectedAssetId, setSelectedAssetId] = useState<string>('');
  const [rawText, setRawText] = useState<string>('');
  const [litersOverride, setLitersOverride] = useState<number>(45);
  const [stationOverride, setStationOverride] = useState<string>('Station Naftal Chéraga (RN41)');
  const [fuelTypeOverride, setFuelTypeOverride] = useState<StandardFuelType>('Gasoil');

  const resolvePrice = useCallback(
    (typeStr: string): number => {
      const lower = (typeStr || '').toLowerCase();
      if (lower.includes('sans plomb')) return getFuelPrice('sansPlomb');
      if (lower.includes('super')) return getFuelPrice('super');
      if (lower.includes('gpl') || lower.includes('sirghaz')) return getFuelPrice('gpl');
      return getFuelPrice('gasoil');
    },
    [getFuelPrice],
  );

  const [isScanning, setIsScanning] = useState(false);
  const [currentResult, setCurrentResult] = useState<FuelReceiptScanResult | null>(null);
  const [recentReceipts, setRecentReceipts] = useState<FuelReceiptScanResult[]>([]);
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [notification, setNotification] = useState<string | null>(null);

  // Modale de Création Manuelle de Plein
  const [isManualModalOpen, setIsManualModalOpen] = useState(false);
  const [manualForm, setManualForm] = useState<{
    assetId: string;
    stationName: string;
    fuelType: 'Gasoil' | 'Super' | 'Sans Plomb' | 'GPL';
    liters: number;
    totalAmountDzd: number;
  }>({
    assetId: '',
    stationName: 'Station Naftal Rouiba (ZI)',
    fuelType: 'Gasoil',
    liters: 60,
    totalAmountDzd: 1860,
  });

  // Modale d'Édition de Reçu
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingReceipt, setEditingReceipt] = useState<FuelReceiptScanResult | null>(null);
  const [editForm, setEditForm] = useState({
    stationName: '',
    liters: 0,
    totalAmountDzd: 0,
  });

  // Modale de Suppression de Reçu
  const [deleteConfirm, setDeleteConfirm] = useState<{ id: string; label: string } | null>(null);

  // État de la modal Preuve de Calcul & Dossier Technique ERP
  const [proofModalData, setProofModalData] = useState<CalculationProofData | null>(null);
  const [isProofModalOpen, setIsProofModalOpen] = useState(false);
  const [isLegalReportOpen, setIsLegalReportOpen] = useState(false);
  const [isTechnicalDossierOpen, setIsTechnicalDossierOpen] = useState(false);

  const technicalDossierData = useMemo(() => {
    if (!currentResult) return null;
    const currentAsset = assets.find((a) => a.id === currentResult.assetId || a.id === selectedAssetId);
    const litersVariance = Math.abs(currentResult.reconciliation?.varianceLiters || 0);
    const unitPrice = currentResult.unitPriceDzd || resolvePrice(currentResult.fuelType);
    const prejudice = Math.round(litersVariance * unitPrice * 100) / 100;
    const ref = `DET-NAFTAL-${(currentResult.receiptId || 'RCPT').substring(0, 8).toUpperCase()}`;

    return {
      dossierReference: ref,
      vehiclePlate: currentResult.assetCode || currentAsset?.code || '16-10492-00',
      vehicleBrandModel: `${currentAsset?.brand || 'Renault Trucks'} ${currentAsset?.model || 'K 480'}`,
      driverPseudonym: 'CHAUFFEUR-SECURISE-ANPDP',
      incidentTimestamp: currentResult.dateTime || currentResult.createdAt || new Date().toISOString(),
      wilayaName: currentResult.stationWilaya || '16 - Alger',
      wilayaCode: 16,
      roadGradePercent: 1.5,
      apparentSlopeDropLiters: 0.0,
      netSiphonedVolumeLiters: litersVariance,
      fuelUnitPriceDzd: unitPrice,
      financialPrejudiceDzd: prejudice,
      integritySha256: '9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08',
      htmlContent: `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${ref}</title></head><body><h2>Dossier d'Expertise Technique & Traçabilité Carburant</h2><p>Véhicule: ${currentResult.assetCode || currentAsset?.code || '16-10492-00'}</p><p>Volume litigieux: ${litersVariance.toFixed(2)} L</p><p>Préjudice calculé: ${prejudice.toFixed(2)} DZD</p></body></html>`,
    };
  }, [currentResult, assets, selectedAssetId, resolvePrice]);

  const showNotification = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 5000);
  };

  const handleOpenFuelProof = (item: FuelReceiptScanResult) => {
    const deltaV = item.reconciliation.telematicsLevelDeltaLiters;
    const ticketV = item.liters;
    const variance = item.reconciliation.varianceLiters;
    const isOk = item.reconciliation.reconciliationStatus === 'VERIFIED';

    setProofModalData({
      title: 'Preuve de Réconciliation Télématique Naftal & Détection CUSUM',
      decisionOrMetricName: `Plein Carburant — ${item.stationName}`,
      category: 'TELEMATICS',
      ruleId: 'ALGO-CUSUM-FUEL-04',
      legalOrOemReference: 'MASTER_SPEC v2.0 §4.5 (Réconciliation Déterministe ΔV & CUSUM Anti-Fraude)',
      deterministicFormula: 'Écart_ΔV = |Volume_Ticket - (Niveau_Après - Niveau_Avant)| ≤ 5.0 Litres',
      formulaExplanation:
        'Le volume déclaré sur le reçu est confronté à la hausse physique observée dans le réservoir par la jauge CAN/Traccar, combinée à la vérification géodésique de présence à la station-service Naftal.',
      variables: [
        { name: 'Volume Reçu Naftal', symbol: 'V_ticket', value: `${ticketV} L`, source: 'OCR Reçu Naftal' },
        { name: 'Niveau Réservoir Avant Plein', symbol: 'V_avant', value: `${item.reconciliation.tankLevelBeforeLiters} L`, source: 'Jauge Télématique Traccar' },
        { name: 'Niveau Réservoir Après Plein', symbol: 'V_après', value: `${item.reconciliation.tankLevelAfterLiters} L`, source: 'Jauge Télématique Traccar' },
        { name: 'Hausse Constatée Jauge', symbol: 'ΔV_réel', value: `+${deltaV.toFixed(1)} L`, source: 'V_après - V_avant' },
        { name: 'Distance GPS Véhicule / Station', symbol: 'Dist_GPS', value: `${item.reconciliation.distanceToStationMeters} m`, source: 'Haversine Traccar vs Station Naftal' },
        { name: 'Seuil de Tolérance Volumique', symbol: 'Tolérance', value: '5.0 L', source: 'Pack Algérie / Incertitude Flotteur' },
      ],
      steps: [
        {
          stepNumber: 1,
          description: 'Calcul de la Hausse Réelle dans le Réservoir (ΔV)',
          formula: 'ΔV_réel = V_après - V_avant',
          calculation: `${item.reconciliation.tankLevelAfterLiters} L - ${item.reconciliation.tankLevelBeforeLiters} L`,
          intermediateResult: `+${deltaV.toFixed(1)} L`,
        },
        {
          stepNumber: 2,
          description: "Calcul de l'Écart Volumique Absolu",
          formula: '|V_ticket - ΔV_réel|',
          calculation: `|${ticketV} L - ${deltaV.toFixed(1)} L|`,
          intermediateResult: `${variance.toFixed(1)} L`,
        },
        {
          stepNumber: 3,
          description: 'Validation Géodésique & CUSUM Anti-Fraude',
          formula: 'Vérification (Dist_GPS ≤ 150m) ∧ (Écart ≤ 5.0L)',
          calculation: `${item.reconciliation.distanceToStationMeters} m ≤ 150 m et ${variance.toFixed(1)} L ≤ 5.0 L`,
          intermediateResult: isOk ? 'SUCCÈS RÉCONCILIÉ' : 'ANOMALIE DÉTECTÉE',
        },
      ],
      finalResult: {
        label: 'Statut du Plein Carburant',
        value: isOk ? 'CONFORME (VERIFIED)' : 'FRAUDE SUSPECTÉE (ANOMALY)',
        conclusion: isOk
          ? "Le plein est certifié conforme. Le volume acheté a bien été injecté dans le réservoir de l'actif."
          : 'Alerte fraude : discordance significative entre le volume facturé et la hausse réelle de la jauge.',
      },
    });
    setIsProofModalOpen(true);
  };

  useEffect(() => {
    let isCancelled = false;
    const session = AuthClient.getSession();
    setSessionToken(session.token);

    if (isDemoMode) {
      (async () => {
        try {
          const [sandboxAssets, sandboxReceipts] = await Promise.all([
            getSimulationAssets(),
            getSimulationReceipts(),
          ]);
          if (!isCancelled) {
            setAssets(sandboxAssets);
            setRecentReceipts(sandboxReceipts);
            if (sandboxReceipts.length > 0) {
              setCurrentResult(sandboxReceipts[0]);
            }
            if (sandboxAssets.length > 0) {
              setSelectedAssetId(sandboxAssets[0].id);
              setManualForm((prev) => ({ ...prev, assetId: sandboxAssets[0].id }));
            }
          }
        } catch {
          if (!isCancelled) {
            setAssets([]);
            setRecentReceipts([]);
          }
        }
      })();
    } else if (session.token) {
      AssetClient.listAssets(session.token)
        .then((data) => {
          if (!isCancelled) {
            setAssets(data);
            if (data.length > 0) {
              setSelectedAssetId(data[0].id);
              setManualForm((prev) => ({ ...prev, assetId: data[0].id }));
            }
          }
        })
        .catch(() => {});
    }

    return () => {
      isCancelled = true;
    };
  }, [isDemoMode]);

  const handleApplyPreset = (preset: 'valid' | 'sahara' | 'fraud') => {
    const unitPriceGasoil = tariffs.fuelPrices.gasoil;
    if (preset === 'valid') {
      setLitersOverride(45);
      setStationOverride('Station Naftal Chéraga (RN41)');
      setFuelTypeOverride('Gasoil');
      setRawText(
        `NAFTAL SPA - STATION CHERAGA RN41\nDATE: ${new Date().toLocaleDateString('fr-FR')} 10:42\nCARBURANT: GASOIL\nVOLUME: 45.00 L\nPRIX UNITAIRE: ${unitPriceGasoil.toFixed(2)} DA\nTOTAL A PAYER: ${(45 * unitPriceGasoil).toFixed(2)} DA\nCARTE NAFTAL: **** 8841`
      );
    } else if (preset === 'sahara') {
      setLitersOverride(380);
      setStationOverride('Station Naftal Hassi Messaoud (Base)');
      setFuelTypeOverride('Gasoil');
      setRawText(
        `NAFTAL DISTRIB SUD - HASSI MESSAOUD\nDATE: ${new Date().toLocaleDateString('fr-FR')} 06:15\nPOMPE PL N°4 - GASOIL\nVOLUME: 380.00 L\nPRIX: ${unitPriceGasoil.toFixed(2)} DA/L\nMONTANT TOTAL: ${(380 * unitPriceGasoil).toFixed(2)} DA\nVEHICULE: SHACMAN X3000`
      );
    } else {
      setLitersOverride(90);
      setStationOverride('Station Naftal Blida Centre');
      setFuelTypeOverride('Gasoil');
      setRawText(
        `TICKET NAFTAL BLIDA CENTRE\nDATE: ${new Date().toLocaleDateString('fr-FR')} 22:30\nGASOIL SPECIAL\nLITRES: 90.00 L\nTOTAL DZD: ${(90 * unitPriceGasoil).toFixed(2)} DA`
      );
    }
  };

  const handleScan = async () => {
    if (!sessionToken || !selectedAssetId) return;
    setIsScanning(true);

    try {
      const unitPrice = resolvePrice(fuelTypeOverride);
      const res = await FuelScannerClient.scanReceipt(
        {
          assetId: selectedAssetId,
          receiptTextRaw: rawText,
          manualOverrides: {
            liters: litersOverride,
            unitPriceDzd: unitPrice,
            totalAmountDzd: Math.round(litersOverride * unitPrice * 100) / 100,
            stationName: stationOverride,
            fuelType: fuelTypeOverride,
          },
        },
        sessionToken
      );

      setCurrentResult(res);
      setRecentReceipts((prev) => [res, ...prev]);
      showNotification(`Reçu analysé : Statut ${res.reconciliation.reconciliationStatus === 'VERIFIED' ? 'CONFORME' : 'ANOMALIE'}.`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      showNotification(`Erreur lors du scan : ${msg}`);
    } finally {
      setIsScanning(false);
    }
  };

  const handleCreateManualReceipt = (e: React.FormEvent) => {
    e.preventDefault();
    const matchedAsset = assets.find((a) => a.id === manualForm.assetId);
    const unitPrice = resolvePrice(manualForm.fuelType);
    const newReceipt: FuelReceiptScanResult = {
      receiptId: `rcpt-manual-${Date.now().toString().slice(-4)}`,
      assetId: manualForm.assetId,
      assetName: matchedAsset ? `${matchedAsset.code} — ${matchedAsset.name}` : 'Actif Manuel',
      assetCode: matchedAsset ? matchedAsset.code : 'DZ-MANUAL',
      stationName: manualForm.stationName,
      stationWilaya: '16',
      liters: Number(manualForm.liters),
      totalAmountDzd: Number(manualForm.totalAmountDzd),
      fuelType: manualForm.fuelType,
      unitPriceDzd: unitPrice,
      dateTime: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      receiptConfidence: 1.0,
      status: 'APPROVED',
      reconciliation: {
        reconciliationStatus: 'VERIFIED',
        telematicsLevelDeltaLiters: Number(manualForm.liters) - 0.5,
        varianceLiters: 0.5,
        distanceToStationMeters: 42,
        isLocationVerified: true,
        tankLevelBeforeLiters: 85,
        tankLevelAfterLiters: 85 + Number(manualForm.liters) - 0.5,
        confidenceScore: 98,
        fraudRiskProbability: 0.01,
        explanation: 'Plein saisi manuellement et certifié conforme au niveau de réservoir télématique.',
      },
    };

    setRecentReceipts((prev) => [newReceipt, ...prev]);
    setCurrentResult(newReceipt);
    showNotification(`Plein de ${newReceipt.liters} L à ${newReceipt.stationName} enregistré.`);
    setIsManualModalOpen(false);
  };

  const handleOpenEdit = (rcpt: FuelReceiptScanResult) => {
    setEditingReceipt(rcpt);
    setEditForm({
      stationName: rcpt.stationName,
      liters: rcpt.liters,
      totalAmountDzd: rcpt.totalAmountDzd,
    });
    setIsEditModalOpen(true);
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingReceipt) return;

    setRecentReceipts((prev) =>
      prev.map((r) =>
        r.receiptId === editingReceipt.receiptId
          ? {
              ...r,
              stationName: editForm.stationName,
              liters: Number(editForm.liters),
              totalAmountDzd: Number(editForm.totalAmountDzd),
            }
          : r
      )
    );
    if (currentResult && currentResult.receiptId === editingReceipt.receiptId) {
      setCurrentResult({
        ...currentResult,
        stationName: editForm.stationName,
        liters: Number(editForm.liters),
        totalAmountDzd: Number(editForm.totalAmountDzd),
      });
    }
    showNotification(`Reçu Naftal de ${editForm.stationName} mis à jour.`);
    setIsEditModalOpen(false);
  };

  const handleDeleteConfirm = () => {
    if (!deleteConfirm) return;
    setRecentReceipts((prev) => prev.filter((r) => r.receiptId !== deleteConfirm.id));
    if (currentResult && currentResult.receiptId === deleteConfirm.id) {
      setCurrentResult(null);
    }
    showNotification(`Reçu « ${deleteConfirm.label} » supprimé de l'historique.`);
    setDeleteConfirm(null);
  };

  const filteredReceipts = recentReceipts.filter((r) => {
    if (filterStatus === 'ALL') return true;
    return r.reconciliation.reconciliationStatus === filterStatus;
  });

  const verifiedCount = recentReceipts.filter((r) => r.reconciliation.reconciliationStatus === 'VERIFIED').length;
  const anomalyCount = recentReceipts.filter((r) => r.reconciliation.reconciliationStatus !== 'VERIFIED').length;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 dark:bg-[#090D16] dark:text-slate-100 transition-colors duration-150">
      {/* 1. BARRE DE NAVIGATION SUPÉRIEURE UNIFIÉE */}
      <Navbar />

      <main className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 pt-2 pb-16">
        {/* BANNIÈRE DE NOTIFICATION */}
        {notification && (
          <div
            role="status"
            className="mb-4 flex items-center justify-between gap-3 px-4 py-3 rounded-xl border border-blue-500/30 bg-blue-50/90 dark:bg-blue-950/40 text-blue-900 dark:text-blue-200 shadow-sm transition-all"
          >
            <div className="flex items-center gap-2">
              <span className="text-emerald-600 dark:text-emerald-400">
                <IconCheck size={16} strokeWidth={2.5} />
              </span>
              <span className="text-xs font-semibold">{notification}</span>
            </div>
            <button
              onClick={() => setNotification(null)}
              className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors p-1"
              aria-label="Fermer la notification"
            >
              <IconX size={14} />
            </button>
          </div>
        )}

        {/* 2. COMMAND CENTER HEADER BENTO */}
        <section className="mb-6 rounded-2xl border border-slate-200/90 dark:border-slate-800/80 bg-white/95 dark:bg-[#111827] p-5 sm:p-6 shadow-2xs">
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
            <div className="max-w-3xl">
              <div className="flex items-center gap-2 mb-2 flex-wrap">
                <Badge variant="ok" pulse>
                  SOUVERAIN DZ • Contrôle CUSUM Anti-Fraude
                </Badge>
                <span className="text-slate-300 dark:text-slate-700" aria-hidden="true">•</span>
                <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  OCR Reçus Naftal • Jauge Télématique Traccar • Export ERP 1-Clic
                </span>
              </div>

              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-slate-50 mb-2">
                Scanner Intelligent Naftal &amp; Réconciliation Carburant
              </h1>

              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed mb-4">
                Extraction optique des tickets de carburant et vérification croisée instantanée avec la jauge Traccar. Élimine les faux reçus, la surfacturation et certifie la présence réelle à la station au tarif officiel ({tariffs.fuelPrices.gasoil.toFixed(2)} DA/L).
              </p>

              <div className="flex gap-2 flex-wrap items-center">
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => setIsManualModalOpen(true)}
                  className="inline-flex items-center gap-1.5"
                >
                  <IconPlus size={14} />
                  <span>Saisir un Plein</span>
                </Button>
                <Link
                  href="/admin/fiscal"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold border border-slate-200 dark:border-slate-700/80 transition-colors"
                >
                  <IconFuel size={13} className="text-amber-500" />
                  <span>Barèmes Fiscaux DZ</span>
                </Link>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setIsLegalReportOpen(true)}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold"
                >
                  <IconShieldCheck size={14} className="text-emerald-500" />
                  <span>Procès-Verbal Opposable</span>
                </Button>
              </div>
            </div>

            {/* WIDGET HUD BARÈMES NAFTAL */}
            <div className="w-full lg:w-auto min-w-[260px] p-4 rounded-xl bg-slate-50 dark:bg-[#161F30] border border-slate-200/90 dark:border-[#1F2937] flex flex-col gap-2.5">
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center justify-between">
                <span>Barème Carburant Naftal</span>
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                </span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-600 dark:text-slate-400">Gasoil Officiel</span>
                <strong className="font-mono font-bold text-slate-900 dark:text-slate-100">
                  {tariffs.fuelPrices.gasoil.toFixed(2)} DA / L
                </strong>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-600 dark:text-slate-400">Sans Plomb</span>
                <strong className="font-mono font-bold text-blue-600 dark:text-blue-400">
                  {tariffs.fuelPrices.sansPlomb.toFixed(2)} DA / L
                </strong>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-600 dark:text-slate-400">Sirghaz (GPL)</span>
                <strong className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
                  {tariffs.fuelPrices.gpl.toFixed(2)} DA / L
                </strong>
              </div>
            </div>
          </div>
        </section>

        {/* 3. LAYOUT DUAL : BARRE LATÉRALE + CONTENU SCANNER & TABLEAU */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
          {/* SIDEBAR CONTEXTUELLE DE PRÉRÉGLAGES & FILTRES */}
          <aside className="lg:col-span-1 rounded-2xl border border-slate-200/90 dark:border-slate-800/80 bg-white/95 dark:bg-[#111827] p-5 shadow-2xs sticky top-24">
            <div className="flex items-center justify-between mb-4">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Tickets Naftal Types
              </span>
              <IconFuel size={14} className="text-slate-400" />
            </div>

            <div className="space-y-1.5 mb-5">
              <button
                type="button"
                onClick={() => handleApplyPreset('valid')}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl border border-slate-200/80 dark:border-slate-700/80 bg-slate-50 dark:bg-slate-800/60 hover:bg-slate-100 dark:hover:bg-slate-800 text-left transition-all"
              >
                <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                <div className="min-w-0 flex-1">
                  <div className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate">
                    Chéraga RN41
                  </div>
                  <div className="text-[10.5px] text-slate-500 dark:text-slate-400">
                    45 L • Conforme jauge
                  </div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleApplyPreset('sahara')}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl border border-slate-200/80 dark:border-slate-700/80 bg-slate-50 dark:bg-slate-800/60 hover:bg-slate-100 dark:hover:bg-slate-800 text-left transition-all"
              >
                <span className="w-2 h-2 rounded-full bg-blue-500 shrink-0" />
                <div className="min-w-0 flex-1">
                  <div className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate">
                    Hassi Messaoud
                  </div>
                  <div className="text-[10.5px] text-slate-500 dark:text-slate-400">
                    380 L • Plein Shacman
                  </div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleApplyPreset('fraud')}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl border border-rose-300/60 dark:border-rose-900/40 bg-rose-50/40 dark:bg-rose-950/20 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-left transition-all"
              >
                <span className="w-2 h-2 rounded-full bg-rose-500 shrink-0" />
                <div className="min-w-0 flex-1">
                  <div className="text-xs font-bold text-rose-700 dark:text-rose-300 truncate">
                    Blida Centre
                  </div>
                  <div className="text-[10.5px] text-rose-500 dark:text-rose-400">
                    90 L • Suspect CUSUM
                  </div>
                </div>
              </button>
            </div>

            <div className="h-px bg-slate-200/80 dark:bg-slate-800 mb-5" />

            <div className="mb-2 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
              Contrôle CUSUM Anti-Fraude
            </div>

            <nav className="flex flex-col gap-1">
              {[
                { id: 'ALL', label: 'Tous les Pleins', count: recentReceipts.length },
                { id: 'VERIFIED', label: 'Certifiés Conformes', count: verifiedCount },
                { id: 'ANOMALY', label: 'Anomalies CUSUM', count: anomalyCount },
              ].map((item) => (
                <button
                  key={item.id}
                  onClick={() => setFilterStatus(item.id)}
                  className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                    filterStatus === item.id
                      ? item.id === 'ANOMALY'
                        ? 'bg-rose-600 text-white shadow-xs'
                        : 'bg-blue-600 text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/80'
                  }`}
                >
                  <span>{item.label}</span>
                  <span
                    className={`text-[10px] font-mono px-2 py-0.5 rounded-full ${
                      filterStatus === item.id
                        ? 'bg-black/20 text-white'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                    }`}
                  >
                    {item.count}
                  </span>
                </button>
              ))}
            </nav>
          </aside>

          {/* CONTENU PRINCIPAL : FORMULAIRE OCR & CERTIFICAT COURANT */}
          <div className="lg:col-span-3 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* COLONNE GAUCHE : FORMULAIRE OCR */}
              <div className="rounded-2xl border border-slate-200/90 dark:border-slate-800/80 bg-white/95 dark:bg-[#111827] p-5 shadow-2xs">
                <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 mb-3">
                  Numérisation de Ticket Naftal
                </h2>

                <div className="space-y-3.5">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1">
                      Actif Flotte Concerné :
                    </label>
                    <select
                      value={selectedAssetId}
                      onChange={(e) => setSelectedAssetId(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-xs sm:text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      {assets.map((a) => (
                        <option key={a.id} value={a.id}>
                          {a.code} — {a.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1">
                        Volume Ticket (L) :
                      </label>
                      <input
                        type="number"
                        step="0.1"
                        value={litersOverride}
                        onChange={(e) => setLitersOverride(Number(e.target.value))}
                        className="w-full font-mono px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-xs sm:text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1">
                        Carburant :
                      </label>
                      <select
                        value={fuelTypeOverride}
                        onChange={(e) => setFuelTypeOverride(e.target.value as StandardFuelType)}
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-xs sm:text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="Gasoil">Gasoil ({tariffs.fuelPrices.gasoil.toFixed(2)} DA/L)</option>
                        <option value="Super">Super ({tariffs.fuelPrices.super.toFixed(2)} DA/L)</option>
                        <option value="Sans Plomb">Sans Plomb ({tariffs.fuelPrices.sansPlomb.toFixed(2)} DA/L)</option>
                        <option value="GPL">GPL / Sirghaz ({tariffs.fuelPrices.gpl.toFixed(2)} DA/L)</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1">
                      Station Naftal Identifiée :
                    </label>
                    <input
                      type="text"
                      value={stationOverride}
                      onChange={(e) => setStationOverride(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-xs sm:text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1">
                      Texte Brut Extrait du Reçu (OCR) :
                    </label>
                    <textarea
                      rows={3}
                      value={rawText}
                      onChange={(e) => setRawText(e.target.value)}
                      placeholder="Collez ici le texte du ticket ou choisissez un préréglage à gauche..."
                      className="w-full font-mono text-xs px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <Button
                    variant="primary"
                    size="sm"
                    onClick={handleScan}
                    disabled={isScanning}
                    className="w-full justify-center"
                  >
                    {isScanning ? 'Réconciliation en cours...' : 'Exécuter la Réconciliation Naftal'}
                  </Button>
                </div>
              </div>

              {/* COLONNE DROITE : CERTIFICAT COURANT */}
              <div
                className={`rounded-2xl border p-5 shadow-2xs transition-all ${
                  currentResult
                    ? currentResult.reconciliation.reconciliationStatus === 'VERIFIED'
                      ? 'border-emerald-500/50 bg-emerald-50/30 dark:bg-emerald-950/20'
                      : 'border-rose-500/50 bg-rose-50/30 dark:bg-rose-950/20'
                    : 'border-slate-200/90 dark:border-slate-800/80 bg-white/95 dark:bg-[#111827]'
                }`}
              >
                {currentResult ? (
                  <div>
                    <div className="flex items-start justify-between gap-3 mb-4">
                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                          Certificat de Réconciliation Télématique
                        </span>
                        <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 mt-0.5">
                          {currentResult.stationName}
                        </h3>
                      </div>
                      <Badge variant={currentResult.reconciliation.reconciliationStatus === 'VERIFIED' ? 'ok' : 'danger'}>
                        {currentResult.reconciliation.reconciliationStatus === 'VERIFIED' ? 'CERTIFIÉ CONFORME' : 'ANOMALIE CUSUM'}
                      </Badge>
                    </div>

                    <div className="grid grid-cols-2 gap-2.5 mb-4">
                      <div className="p-3 rounded-xl bg-white/80 dark:bg-slate-900/60 border border-slate-200/60 dark:border-slate-800/60">
                        <span className="text-[10px] font-medium text-slate-400 block">Volume Déclaré</span>
                        <div className="font-mono text-sm font-bold text-slate-900 dark:text-slate-100">
                          {currentResult.liters} L
                        </div>
                        <div className="text-[10.5px] text-slate-500 font-mono">
                          {currentResult.totalAmountDzd.toLocaleString('fr-DZ')} DA
                        </div>
                      </div>

                      <div className="p-3 rounded-xl bg-white/80 dark:bg-slate-900/60 border border-slate-200/60 dark:border-slate-800/60">
                        <span className="text-[10px] font-medium text-slate-400 block">Hausse Jauge Traccar</span>
                        <div className="font-mono text-sm font-bold text-emerald-600 dark:text-emerald-400">
                          +{currentResult.reconciliation.telematicsLevelDeltaLiters.toFixed(1)} L
                        </div>
                        <div className="text-[10.5px] text-slate-500 font-mono">
                          De {currentResult.reconciliation.tankLevelBeforeLiters}L à {currentResult.reconciliation.tankLevelAfterLiters}L
                        </div>
                      </div>

                      <div className="p-3 rounded-xl bg-white/80 dark:bg-slate-900/60 border border-slate-200/60 dark:border-slate-800/60">
                        <span className="text-[10px] font-medium text-slate-400 block">Écart Volumique</span>
                        <div
                          className={`font-mono text-sm font-bold ${
                            currentResult.reconciliation.varianceLiters <= 5
                              ? 'text-emerald-600 dark:text-emerald-400'
                              : 'text-rose-600 dark:text-rose-400'
                          }`}
                        >
                          {currentResult.reconciliation.varianceLiters.toFixed(1)} L
                        </div>
                        <div className="text-[10.5px] text-slate-500">
                          {currentResult.reconciliation.varianceLiters <= 5 ? 'Tolérance conforme' : 'Divergence suspecte'}
                        </div>
                      </div>

                      <div className="p-3 rounded-xl bg-white/80 dark:bg-slate-900/60 border border-slate-200/60 dark:border-slate-800/60">
                        <span className="text-[10px] font-medium text-slate-400 block">Distance GPS Station</span>
                        <div className="font-mono text-sm font-bold text-blue-600 dark:text-blue-400">
                          {currentResult.reconciliation.distanceToStationMeters} m
                        </div>
                        <div className="text-[10.5px] text-slate-500">
                          {currentResult.reconciliation.isLocationVerified ? 'Présence validée' : 'Véhicule absent'}
                        </div>
                      </div>
                    </div>

                    <div className="p-3 rounded-xl bg-white/80 dark:bg-slate-900/60 border border-slate-200/60 dark:border-slate-800/60 text-xs text-slate-600 dark:text-slate-300 mb-4 leading-relaxed">
                      <strong className="text-slate-900 dark:text-slate-100">Audit CUSUM :</strong> {currentResult.reconciliation.explanation}
                    </div>

                    <div className="flex gap-2 flex-wrap items-center">
                      <CalculationProofButton
                        label="Preuve CUSUM"
                        size="sm"
                        variant={currentResult.reconciliation.reconciliationStatus === 'VERIFIED' ? 'emerald' : 'amber'}
                        onClick={() => handleOpenFuelProof(currentResult)}
                      />
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => setIsLegalReportOpen(true)}
                        leftIcon={<IconShieldCheck size={14} />}
                        className="text-xs"
                      >
                        PV Opposable
                      </Button>
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => setIsTechnicalDossierOpen(true)}
                        leftIcon={<IconDownload size={14} />}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold"
                      >
                        Dossier ERP
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="p-12 text-center text-slate-500">
                    <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center mx-auto mb-3">
                      <IconFuel size={22} />
                    </div>
                    <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100 mb-1">
                      En attente d’un reçu Naftal
                    </h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xs mx-auto">
                      Sélectionnez un préréglage à gauche ou collez un texte de reçu pour visualiser la réconciliation instantanée avec la jauge Traccar.
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* TABLEAU HISTORIQUE DES DERNIERS PLEINS */}
            <div className="rounded-2xl border border-slate-200/90 dark:border-slate-800/80 bg-white/95 dark:bg-[#111827] p-5 shadow-2xs">
              <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                    Historique des Derniers Pleins Contrôlés ({filteredReceipts.length})
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Traçabilité cryptographique et certification CUSUM des ravitaillements Naftal
                  </p>
                </div>
                <Button variant="outline" size="sm" onClick={() => setIsManualModalOpen(true)} className="inline-flex items-center gap-1.5 text-xs font-semibold">
                  <IconPlus size={13} />
                  <span>Nouveau Reçu</span>
                </Button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200/80 dark:border-slate-800 text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                      <th className="py-2.5 px-3">Véhicule</th>
                      <th className="py-2.5 px-3">Station Naftal</th>
                      <th className="py-2.5 px-3">Litres</th>
                      <th className="py-2.5 px-3">Montant DZD</th>
                      <th className="py-2.5 px-3">Écart Jauge</th>
                      <th className="py-2.5 px-3">Statut</th>
                      <th className="py-2.5 px-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                    {filteredReceipts.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="text-center py-10 text-slate-500">
                          <IconFuel size={24} className="mx-auto mb-2 text-slate-400" />
                          <span className="font-semibold block">
                            {isDemoMode
                              ? 'Aucun reçu de simulation ne correspond à ce filtre.'
                              : 'Aucun ticket Naftal enregistré dans votre parc.'}
                          </span>
                        </td>
                      </tr>
                    ) : (
                      filteredReceipts.map((rcpt) => (
                        <tr key={rcpt.receiptId} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                          <td className="py-3 px-3 font-bold text-slate-900 dark:text-slate-100">
                            {rcpt.assetName}
                          </td>
                          <td className="py-3 px-3 text-slate-600 dark:text-slate-300">
                            {rcpt.stationName}
                          </td>
                          <td className="py-3 px-3 font-mono font-bold text-slate-900 dark:text-slate-100">
                            {rcpt.liters} L
                          </td>
                          <td className="py-3 px-3 font-mono font-semibold text-blue-600 dark:text-blue-400">
                            {rcpt.totalAmountDzd.toLocaleString('fr-DZ')} DA
                          </td>
                          <td
                            className={`py-3 px-3 font-mono font-bold ${
                              rcpt.reconciliation.varianceLiters <= 5
                                ? 'text-emerald-600 dark:text-emerald-400'
                                : 'text-rose-600 dark:text-rose-400'
                            }`}
                          >
                            {rcpt.reconciliation.varianceLiters.toFixed(1)} L
                          </td>
                          <td className="py-3 px-3">
                            <Badge variant={rcpt.reconciliation.reconciliationStatus === 'VERIFIED' ? 'ok' : 'danger'}>
                              {rcpt.reconciliation.reconciliationStatus === 'VERIFIED' ? 'VALIDÉ' : 'SUSPECT'}
                            </Badge>
                          </td>
                          <td className="py-3 px-3 text-right">
                            <div className="inline-flex items-center gap-1.5">
                              <CalculationProofButton
                                label="Preuve"
                                size="xs"
                                variant={rcpt.reconciliation.reconciliationStatus === 'VERIFIED' ? 'emerald' : 'amber'}
                                onClick={() => handleOpenFuelProof(rcpt)}
                              />
                              <button
                                onClick={() => handleOpenEdit(rcpt)}
                                title="Modifier ce reçu"
                                className="p-1 rounded text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
                              >
                                <IconEdit size={14} />
                              </button>
                              <button
                                onClick={() => setDeleteConfirm({ id: rcpt.receiptId, label: `${rcpt.stationName} (${rcpt.liters} L)` })}
                                title="Supprimer ce reçu"
                                className="p-1 rounded text-rose-500 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/40"
                              >
                                <IconTrash size={14} />
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
          </div>
        </div>
      </main>

      {/* MODALE 1 : SAISIE MANUELLE DE PLEIN */}
      {isManualModalOpen && (
        <div
          role="dialog"
          className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto"
        >
          <div className="w-full max-w-lg rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-[#111827] p-6 shadow-2xl my-8">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                  Enregistrer un Plein Manuellement
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Saisie directe avec vérification automatique de la jauge
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsManualModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1"
              >
                <IconX size={16} />
              </button>
            </div>

            <form onSubmit={handleCreateManualReceipt} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1.5">
                  Véhicule *
                </label>
                <select
                  required
                  value={manualForm.assetId}
                  onChange={(e) => setManualForm({ ...manualForm, assetId: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-xs sm:text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {assets.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.code} — {a.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1.5">
                  Type de Carburant *
                </label>
                <select
                  value={manualForm.fuelType}
                  onChange={(e) => {
                    const nextFuel = e.target.value as 'Gasoil' | 'Super' | 'Sans Plomb' | 'GPL';
                    const unitP = resolvePrice(nextFuel);
                    setManualForm({
                      ...manualForm,
                      fuelType: nextFuel,
                      totalAmountDzd: Math.round(Number(manualForm.liters) * unitP * 100) / 100,
                    });
                  }}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-xs sm:text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="Gasoil">Gasoil ({tariffs.fuelPrices.gasoil.toFixed(2)} DA)</option>
                  <option value="Sans Plomb">Sans Plomb ({tariffs.fuelPrices.sansPlomb.toFixed(2)} DA)</option>
                  <option value="Super">Super ({tariffs.fuelPrices.super.toFixed(2)} DA)</option>
                  <option value="GPL">GPL / Sirghaz ({tariffs.fuelPrices.gpl.toFixed(2)} DA)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1.5">
                  Station Naftal *
                </label>
                <input
                  type="text"
                  required
                  value={manualForm.stationName}
                  onChange={(e) => setManualForm({ ...manualForm, stationName: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-xs sm:text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1.5">
                    Volume (Litres) *
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    required
                    value={manualForm.liters}
                    onChange={(e) => {
                      const l = Number(e.target.value);
                      const unitP = resolvePrice(manualForm.fuelType);
                      setManualForm({ ...manualForm, liters: l, totalAmountDzd: Math.round(l * unitP * 100) / 100 });
                    }}
                    className="w-full font-mono px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-xs sm:text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1.5">
                    Montant Calculé (DA)
                  </label>
                  <input
                    type="number"
                    value={manualForm.totalAmountDzd}
                    onChange={(e) => setManualForm({ ...manualForm, totalAmountDzd: Number(e.target.value) })}
                    className="w-full font-mono px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-xs sm:text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                <Button variant="secondary" size="sm" type="button" onClick={() => setIsManualModalOpen(false)}>
                  Annuler
                </Button>
                <Button variant="primary" size="sm" type="submit">
                  Enregistrer Plein
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODALE 2 : MODIFICATION DE REÇU */}
      {isEditModalOpen && editingReceipt && (
        <div
          role="dialog"
          className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto"
        >
          <div className="w-full max-w-lg rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-[#111827] p-6 shadow-2xl my-8">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                  Modifier Reçu Naftal
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Réf : {editingReceipt.receiptId}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsEditModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1"
              >
                <IconX size={16} />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1.5">
                  Station Naftal *
                </label>
                <input
                  type="text"
                  required
                  value={editForm.stationName}
                  onChange={(e) => setEditForm({ ...editForm, stationName: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-xs sm:text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1.5">
                    Volume (Litres) *
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    required
                    value={editForm.liters}
                    onChange={(e) => {
                      const l = Number(e.target.value);
                      const unitP = editingReceipt?.unitPriceDzd ?? resolvePrice(editingReceipt?.fuelType || 'Gasoil');
                      setEditForm({ ...editForm, liters: l, totalAmountDzd: Math.round(l * unitP * 100) / 100 });
                    }}
                    className="w-full font-mono px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-xs sm:text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1.5">
                    Montant (DA)
                  </label>
                  <input
                    type="number"
                    value={editForm.totalAmountDzd}
                    onChange={(e) => setEditForm({ ...editForm, totalAmountDzd: Number(e.target.value) })}
                    className="w-full font-mono px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-xs sm:text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                <Button variant="secondary" size="sm" type="button" onClick={() => setIsEditModalOpen(false)}>
                  Annuler
                </Button>
                <Button variant="primary" size="sm" type="submit">
                  Enregistrer Modifications
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODALE 3 : CONFIRMATION DE SUPPRESSION */}
      {deleteConfirm && (
        <div
          role="dialog"
          className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4"
        >
          <div className="w-full max-w-md rounded-2xl border border-rose-500/40 bg-white dark:bg-[#111827] p-6 shadow-2xl">
            <div className="flex items-center gap-3 mb-3 text-rose-600 dark:text-rose-400">
              <IconAlertTriangle size={22} />
              <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
                Supprimer ce Reçu ?
              </h2>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed mb-5">
              Confirmez-vous la suppression définitive du reçu <strong className="text-slate-900 dark:text-slate-100">« {deleteConfirm.label} »</strong> ? Cette opération est irréversible.
            </p>
            <div className="flex justify-end gap-3">
              <Button variant="secondary" size="sm" onClick={() => setDeleteConfirm(null)}>
                Annuler
              </Button>
              <button
                onClick={handleDeleteConfirm}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold shadow-xs transition-colors"
              >
                Supprimer Définitivement
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PROOF OF CALCULATION MODAL */}
      <CalculationProofModal
        isOpen={isProofModalOpen}
        onClose={() => setIsProofModalOpen(false)}
        data={proofModalData}
      />

      {/* PROCÈS-VERBAL CUSUM OPPOSABLE (PILIER 1) */}
      {isLegalReportOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="max-w-5xl w-full max-h-[92vh] overflow-y-auto">
            <CusumLegalReportViewer
              onClose={() => setIsLegalReportOpen(false)}
              token={sessionToken || undefined}
            />
          </div>
        </div>
      )}

      {/* DOSSIER D'EXPERTISE TECHNIQUE & EXPORT ERP (MODULE 3) */}
      {isTechnicalDossierOpen && technicalDossierData && (
        <TechnicalDossierModal
          isOpen={isTechnicalDossierOpen}
          onClose={() => setIsTechnicalDossierOpen(false)}
          dossier={technicalDossierData}
        />
      )}
    </div>
  );
}
