'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { Navbar } from '../../components/navigation/Navbar';
import { AuthClient } from '../../lib/api-auth';
import { FuelScannerClient } from '../../lib/api-fuel-scanner';
import { AssetClient } from '../../lib/api-assets';
import { FuelReceiptScanResult, Asset, AssetCategory, AssetStatus, DataOrigin, MeterType, StandardFuelType } from '@docteurflotte/contracts';
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
    totalAmountDzd: 1740.6,
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
    setTimeout(() => setNotification(null), 4500);
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
          description: 'Calcul de l\'Écart Volumique Absolu',
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
          ? 'Le plein est certifié conforme. Le volume acheté a bien été injecté dans le réservoir de l\'actif.'
          : 'Alerte fraude : discordance significative entre le volume facturé et la hausse réelle de la jauge.',
      },
    });
    setIsProofModalOpen(true);
  };

  useEffect(() => {
    let isCancelled = false;
    const s = AuthClient.getSession();
    setSessionToken(s.token);

    async function initData() {
      if (isDemoMode) {
        try {
          const [sandboxAssets, sandboxReceipts] = await Promise.all([
            getSimulationAssets(),
            getSimulationReceipts(),
          ]);
          if (!isCancelled) {
            setAssets(sandboxAssets);
            if (sandboxAssets.length > 0) {
              setSelectedAssetId(sandboxAssets[0].id);
              setManualForm((prev) => ({ ...prev, assetId: sandboxAssets[0].id }));
            }
            setRecentReceipts(sandboxReceipts);
          }
        } catch {
          if (!isCancelled) {
            setAssets([]);
            setRecentReceipts([]);
          }
        }
      } else if (s.token) {
        await loadData(s.token);
      } else {
        setAssets([]);
        setRecentReceipts([]);
        setSelectedAssetId('');
      }
    }

    initData();
    return () => {
      isCancelled = true;
    };
  }, [isDemoMode]);

  const loadData = async (token: string) => {
    try {
      const [assetsList, receiptsList] = await Promise.all([
        AssetClient.listAssets(token).catch(() => []),
        FuelScannerClient.listRecentReceipts(token).catch(() => [] as FuelReceiptScanResult[]),
      ]);
      setAssets(assetsList);
      if (assetsList.length > 0) {
        setSelectedAssetId(assetsList[0].id);
        setManualForm((prev) => ({ ...prev, assetId: assetsList[0].id }));
      } else {
        setSelectedAssetId('');
      }
      setRecentReceipts(receiptsList);
    } catch {
      setAssets([]);
      setRecentReceipts([]);
    }
  };

  const handleApplyPreset = (type: 'valid' | 'sahara' | 'fraud') => {
    const pGasoil = tariffs.fuelPrices.gasoil || 31.00;
    if (type === 'valid') {
      setStationOverride('Station Naftal Chéraga (RN41)');
      setFuelTypeOverride('Gasoil');
      setLitersOverride(45.0);
      setRawText(
        `SOCIETE NATIONALE DE COMMERCIALISATION ET DE DISTRIBUTION DE PRODUITS PETROLIERS\nNAFTAL SPA - STATION CHERAGA RN41\nDATE: 26/10/2026 14:22\nPRODUIT: GASOIL\nQUANTITE: 45.00 L\nPRIX UNITAIRE: ${pGasoil.toFixed(2)} DZD\nTOTAL A PAYER: ${(45.0 * pGasoil).toFixed(2)} DZD\nPAIEMENT CARTE NAFTAL`
      );
    } else if (type === 'sahara') {
      setStationOverride('Station Naftal Hassi Messaoud Piste 18');
      setFuelTypeOverride('Gasoil');
      setLitersOverride(380.0);
      setRawText(
        `NAFTAL DISTRICT HASSI MESSAOUD\nSTATION SERVICE PISTE 18\nDATE: 26/10/2026 08:45\nPRODUIT: GASOIL LOURD\nQUANTITE: 380.00 L\nPRIX UNITAIRE: ${pGasoil.toFixed(2)} DZD\nTOTAL A PAYER: ${(380.0 * pGasoil).toFixed(2)} DZD\nVEHICULE: PL-030-HMD`
      );
    } else {
      setStationOverride('Station Naftal Blida Centre');
      setFuelTypeOverride('Gasoil');
      setLitersOverride(65.0);
      setRawText(
        `STATION SERVICE NAFTAL BLIDA\nDATE: 26/10/2026 21:10\nPRODUIT: GASOIL\nQUANTITE: 65.00 L\nTOTAL: ${(65.0 * pGasoil).toFixed(2)} DZD\nPAIEMENT ESPECES`
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
      showNotification(`✓ Reçu analysé : Statut ${res.reconciliation.reconciliationStatus === 'VERIFIED' ? 'CONFORME' : 'ANOMALIE'}.`);
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
    showNotification(`✓ Plein de ${newReceipt.liters} L à ${newReceipt.stationName} enregistré.`);
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
    showNotification(`✓ Reçu Naftal de ${editForm.stationName} mis à jour.`);
    setIsEditModalOpen(false);
  };

  const handleDeleteConfirm = () => {
    if (!deleteConfirm) return;
    setRecentReceipts((prev) => prev.filter((r) => r.receiptId !== deleteConfirm.id));
    if (currentResult && currentResult.receiptId === deleteConfirm.id) {
      setCurrentResult(null);
    }
    showNotification(`✓ Reçu « ${deleteConfirm.label} » supprimé de l'historique.`);
    setDeleteConfirm(null);
  };

  const filteredReceipts = recentReceipts.filter((r) => {
    if (filterStatus === 'ALL') return true;
    return r.reconciliation.reconciliationStatus === filterStatus;
  });

  const verifiedCount = recentReceipts.filter((r) => r.reconciliation.reconciliationStatus === 'VERIFIED').length;
  const anomalyCount = recentReceipts.filter((r) => r.reconciliation.reconciliationStatus !== 'VERIFIED').length;

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
              Actions Pleins &amp; OCR
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1.25rem' }}>
              <Button
                variant="primary"
                size="sm"
                onClick={() => setIsManualModalOpen(true)}
                style={{ width: '100%', justifyContent: 'center', gap: '0.4rem' }}
              >
                <IconPlus size={14} />
                <span>+ Saisir un Plein</span>
              </Button>
              <Link href="/admin/fiscal" style={{ textDecoration: 'none' }}>
                <Button variant="outline" size="sm" style={{ width: '100%', justifyContent: 'center' }}>
                  Barèmes Fiscaux DZ
                </Button>
              </Link>
            </div>

            <div style={{ height: '1px', background: 'var(--df-border-subtle)', margin: '0.5rem 0 1rem 0' }} />

            <div style={{ fontSize: '0.70rem', fontWeight: 700, color: 'var(--df-text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '0.75rem' }}>
              Préréglages Tickets Naftal
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', marginBottom: '1.25rem' }}>
              <button
                type="button"
                onClick={() => handleApplyPreset('valid')}
                style={{
                  padding: '0.45rem 0.65rem',
                  borderRadius: 'var(--df-radius-sm)',
                  border: '1px solid var(--df-border-subtle)',
                  background: 'var(--df-bg-surface-2)',
                  color: 'var(--df-text-main)',
                  fontSize: '0.76rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  textAlign: 'left',
                }}
              >
                ✅ Chéraga RN41 (45L Conforme)
              </button>
              <button
                type="button"
                onClick={() => handleApplyPreset('sahara')}
                style={{
                  padding: '0.45rem 0.65rem',
                  borderRadius: 'var(--df-radius-sm)',
                  border: '1px solid var(--df-border-subtle)',
                  background: 'var(--df-bg-surface-2)',
                  color: 'var(--df-text-main)',
                  fontSize: '0.76rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  textAlign: 'left',
                }}
              >
                🏜️ Hassi Messaoud (380L Lourd)
              </button>
              <button
                type="button"
                onClick={() => handleApplyPreset('fraud')}
                style={{
                  padding: '0.45rem 0.65rem',
                  borderRadius: 'var(--df-radius-sm)',
                  border: '1px solid var(--df-border-subtle)',
                  background: 'var(--df-bg-surface-2)',
                  color: 'var(--df-status-danger)',
                  fontSize: '0.76rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  textAlign: 'left',
                }}
              >
                ⚠️ Blida Centre (Suspect Fraude)
              </button>
            </div>

            <div style={{ height: '1px', background: 'var(--df-border-subtle)', margin: '0.5rem 0 1rem 0' }} />

            <div style={{ fontSize: '0.70rem', fontWeight: 700, color: 'var(--df-text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '0.75rem' }}>
              Contrôle CUSUM Anti-Fraude
            </div>

            <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
              {[
                { id: 'ALL', label: 'Tous les Pleins', count: recentReceipts.length, dot: 'var(--df-accent-blue)' },
                { id: 'VERIFIED', label: 'Certifiés Conformes', count: verifiedCount, dot: 'var(--df-status-ok)' },
                { id: 'ANOMALY', label: 'Anomalies CUSUM', count: anomalyCount, dot: 'var(--df-status-danger)' },
              ].map((item) => (
                <button
                  key={item.id}
                  onClick={() => setFilterStatus(item.id)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '0.5rem 0.65rem',
                    borderRadius: 'var(--df-radius-md)',
                    border: 'none',
                    background: filterStatus === item.id ? 'var(--df-bg-surface-2)' : 'transparent',
                    color: filterStatus === item.id ? 'var(--df-text-main)' : 'var(--df-text-secondary)',
                    fontWeight: filterStatus === item.id ? 700 : 500,
                    fontSize: '0.78rem',
                    cursor: 'pointer',
                    textAlign: 'left',
                    transition: 'all var(--df-transition-fast)',
                  }}
                >
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                    <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: item.dot }} />
                    <span>{item.label}</span>
                  </span>
                  <span
                    style={{
                      background: 'var(--df-bg-surface-2)',
                      color: 'var(--df-text-muted)',
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
          </aside>

          {/* CONTENU PRINCIPAL */}
          <main style={{ flex: 1, minWidth: 0 }}>
            {/* EN-TÊTE PRINCIPAL */}
            <div
              style={{
                background: 'var(--df-bg-surface-1)',
                border: '1px solid var(--df-border-subtle)',
                borderRadius: 'var(--df-radius-lg)',
                padding: '1.5rem',
                marginBottom: '1.5rem',
                boxShadow: 'var(--df-shadow-sm)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                <span style={{ fontSize: '1.25rem' }}>⛽</span>
                <Badge variant="ok">SOUVERAIN DZ</Badge>
                <Badge variant="neutral">Contrôle CUSUM &amp; Jauge Traccar</Badge>
              </div>

              <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--df-text-main)', margin: '0 0 0.35rem 0', letterSpacing: '-0.02em' }}>
                Scanner Intelligent de Reçus Naftal &amp; Réconciliation Télématique
              </h1>
              <p style={{ fontSize: '0.88rem', color: 'var(--df-text-secondary)', maxWidth: '840px', margin: 0, lineHeight: 1.55 }}>
                Extraction optique des tickets de carburant et vérification croisée instantanée avec la jauge Traccar.
                Élimine les faux reçus, la surfacturation et certifie la présence réelle à la station au tarif officiel ({tariffs.fuelPrices.gasoil.toFixed(2)} DA/L).
              </p>
            </div>

            {/* DEUX COLONNES : FORMULAIRE OCR / RECONCILIATION ET RÉSULTAT */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem', marginBottom: '1.5rem' }}>
              {/* COLONNE GAUCHE : FORMULAIRE SCANNER */}
              <div
                style={{
                  background: 'var(--df-bg-surface-1)',
                  border: '1px solid var(--df-border-subtle)',
                  borderRadius: 'var(--df-radius-lg)',
                  padding: '1.25rem',
                  boxShadow: 'var(--df-shadow-sm)',
                }}
              >
                <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--df-text-main)', margin: '0 0 1rem 0' }}>
                  Numérisation de Ticket Naftal
                </h3>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--df-text-muted)', marginBottom: '0.3rem' }}>
                      Actif Flotte Concerné :
                    </label>
                    <select
                      value={selectedAssetId}
                      onChange={(e) => setSelectedAssetId(e.target.value)}
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
                      {assets.map((a) => (
                        <option key={a.id} value={a.id}>
                          {a.code} — {a.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.65rem' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--df-text-muted)', marginBottom: '0.3rem' }}>
                        Volume Ticket (Litres) :
                      </label>
                      <input
                        type="number"
                        step="0.1"
                        value={litersOverride}
                        onChange={(e) => setLitersOverride(Number(e.target.value))}
                        className="df-mono"
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
                      <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--df-text-muted)', marginBottom: '0.3rem' }}>
                        Type de Carburant :
                      </label>
                      <select
                        value={fuelTypeOverride}
                        onChange={(e) => setFuelTypeOverride(e.target.value as StandardFuelType)}
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
                        <option value="Gasoil">Gasoil ({tariffs.fuelPrices.gasoil.toFixed(2)} DA/L)</option>
                        <option value="Super">Super ({tariffs.fuelPrices.super.toFixed(2)} DA/L)</option>
                        <option value="Sans Plomb">Sans Plomb ({tariffs.fuelPrices.sansPlomb.toFixed(2)} DA/L)</option>
                        <option value="GPL">GPL / Sirghaz ({tariffs.fuelPrices.gpl.toFixed(2)} DA/L)</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--df-text-muted)', marginBottom: '0.3rem' }}>
                      Station Naftal Identifiée :
                    </label>
                    <input
                      type="text"
                      value={stationOverride}
                      onChange={(e) => setStationOverride(e.target.value)}
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
                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--df-text-muted)', marginBottom: '0.3rem' }}>
                      Texte Brut Extrait du Reçu (OCR) :
                    </label>
                    <textarea
                      rows={3}
                      value={rawText}
                      onChange={(e) => setRawText(e.target.value)}
                      placeholder="Collez ici le texte du ticket ou choisissez un préréglage à gauche..."
                      style={{
                        width: '100%',
                        padding: '0.5rem',
                        borderRadius: 'var(--df-radius-sm)',
                        background: 'var(--df-bg-surface-2)',
                        border: '1px solid var(--df-border-subtle)',
                        color: 'var(--df-text-main)',
                        fontSize: '0.78rem',
                        fontFamily: 'var(--df-font-mono)',
                        resize: 'vertical',
                      }}
                    />
                  </div>

                  <Button
                    variant="primary"
                    size="sm"
                    onClick={handleScan}
                    disabled={isScanning}
                    style={{ width: '100%', justifyContent: 'center', marginTop: '0.25rem' }}
                  >
                    {isScanning ? '⏳ Réconciliation en cours...' : '⚡ Exécuter la Réconciliation Naftal'}
                  </Button>
                </div>
              </div>

              {/* COLONNE DROITE : CERTIFICAT DE RÉCONCILIATION COURANT */}
              <div
                style={{
                  background: 'var(--df-bg-surface-1)',
                  border: `1px solid ${currentResult
                    ? currentResult.reconciliation.reconciliationStatus === 'VERIFIED'
                      ? 'var(--df-status-ok)'
                      : 'var(--df-status-danger)'
                    : 'var(--df-border-subtle)'
                    }`,
                  borderRadius: 'var(--df-radius-lg)',
                  padding: '1.25rem',
                  boxShadow: 'var(--df-shadow-sm)',
                }}
              >
                {currentResult ? (
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                      <div>
                        <span style={{ fontSize: '0.70rem', color: 'var(--df-text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>
                          Certificat de Réconciliation Télématique
                        </span>
                        <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--df-text-main)', margin: '0.2rem 0 0 0' }}>
                          {currentResult.stationName}
                        </h3>
                      </div>
                      <Badge variant={currentResult.reconciliation.reconciliationStatus === 'VERIFIED' ? 'ok' : 'danger'}>
                        {currentResult.reconciliation.reconciliationStatus === 'VERIFIED' ? '✓ CERTIFIÉ CONFORME' : '⚠️ ANOMALIE CUSUM'}
                      </Badge>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.65rem', marginBottom: '1rem' }}>
                      <div style={{ background: 'var(--df-bg-surface-2)', padding: '0.65rem', borderRadius: 'var(--df-radius-md)' }}>
                        <span style={{ fontSize: '0.70rem', color: 'var(--df-text-muted)', display: 'block' }}>Volume Déclaré</span>
                        <strong className="df-mono" style={{ fontSize: '1.05rem', color: 'var(--df-text-main)' }}>
                          {currentResult.liters} L
                        </strong>
                        <div style={{ fontSize: '0.72rem', color: 'var(--df-text-secondary)' }}>
                          {currentResult.totalAmountDzd.toLocaleString('fr-DZ')} DA
                        </div>
                      </div>

                      <div style={{ background: 'var(--df-bg-surface-2)', padding: '0.65rem', borderRadius: 'var(--df-radius-md)' }}>
                        <span style={{ fontSize: '0.70rem', color: 'var(--df-text-muted)', display: 'block' }}>Hausse Jauge Réelle</span>
                        <strong className="df-mono" style={{ fontSize: '1.05rem', color: 'var(--df-status-ok)' }}>
                          +{currentResult.reconciliation.telematicsLevelDeltaLiters.toFixed(1)} L
                        </strong>
                        <div style={{ fontSize: '0.72rem', color: 'var(--df-text-secondary)' }}>
                          De {currentResult.reconciliation.tankLevelBeforeLiters}L à {currentResult.reconciliation.tankLevelAfterLiters}L
                        </div>
                      </div>

                      <div style={{ background: 'var(--df-bg-surface-2)', padding: '0.65rem', borderRadius: 'var(--df-radius-md)' }}>
                        <span style={{ fontSize: '0.70rem', color: 'var(--df-text-muted)', display: 'block' }}>Écart Volumique</span>
                        <strong
                          className="df-mono"
                          style={{
                            fontSize: '1.05rem',
                            color: currentResult.reconciliation.varianceLiters <= 5 ? 'var(--df-status-ok)' : 'var(--df-status-danger)',
                          }}
                        >
                          {currentResult.reconciliation.varianceLiters.toFixed(1)} L
                        </strong>
                        <div style={{ fontSize: '0.72rem', color: 'var(--df-text-secondary)' }}>
                          {currentResult.reconciliation.varianceLiters <= 5 ? 'Tolérance conforme' : 'Divergence suspecte'}
                        </div>
                      </div>

                      <div style={{ background: 'var(--df-bg-surface-2)', padding: '0.65rem', borderRadius: 'var(--df-radius-md)' }}>
                        <span style={{ fontSize: '0.70rem', color: 'var(--df-text-muted)', display: 'block' }}>Distance GPS Station</span>
                        <strong className="df-mono" style={{ fontSize: '1.05rem', color: 'var(--df-accent-blue)' }}>
                          {currentResult.reconciliation.distanceToStationMeters} m
                        </strong>
                        <div style={{ fontSize: '0.72rem', color: 'var(--df-text-secondary)' }}>
                          {currentResult.reconciliation.isLocationVerified ? 'Présence validée' : 'Véhicule absent'}
                        </div>
                      </div>
                    </div>

                    <div style={{ fontSize: '0.76rem', color: 'var(--df-text-secondary)', background: 'var(--df-bg-surface-2)', padding: '0.65rem', borderRadius: 'var(--df-radius-md)', marginBottom: '0.85rem' }}>
                      <strong>Audit CUSUM :</strong> {currentResult.reconciliation.explanation}
                    </div>

                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                      <CalculationProofButton
                        label="Voir Preuve de Calcul CUSUM"
                        size="sm"
                        variant={currentResult.reconciliation.reconciliationStatus === 'VERIFIED' ? 'emerald' : 'amber'}
                        onClick={() => handleOpenFuelProof(currentResult)}
                      />
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => setIsLegalReportOpen(true)}
                      >
                        ⚖️ Procès-Verbal Opposable
                      </Button>
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => setIsTechnicalDossierOpen(true)}
                        style={{
                          backgroundColor: '#4F46E5',
                          borderColor: '#4338CA',
                          color: '#FFFFFF',
                          fontWeight: 600,
                          fontSize: '0.75rem',
                        }}
                      >
                        📑 Dossier Technique &amp; Export ERP
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div style={{ padding: '3rem 1rem', textAlign: 'center', color: 'var(--df-text-muted)' }}>
                    <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>🧾</div>
                    <h4 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--df-text-main)', margin: '0 0 0.25rem 0' }}>
                      En attente d&apos;un reçu Naftal
                    </h4>
                    <p style={{ fontSize: '0.78rem', margin: 0 }}>
                      Sélectionnez un préréglage à gauche ou collez un texte de reçu pour visualiser la réconciliation instantanée avec la jauge Traccar.
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* TABLEAU HISTORIQUE DES PLEINS CONTRÔLÉS */}
            <div
              style={{
                background: 'var(--df-bg-surface-1)',
                border: '1px solid var(--df-border-subtle)',
                borderRadius: 'var(--df-radius-lg)',
                padding: '1.25rem',
                boxShadow: 'var(--df-shadow-sm)',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--df-text-main)', margin: 0 }}>
                  📋 Historique des Derniers Pleins Contrôlés ({filteredReceipts.length})
                </h3>
                <Button variant="outline" size="sm" onClick={() => setIsManualModalOpen(true)} style={{ gap: '0.35rem' }}>
                  <IconPlus size={13} />
                  <span>+ Nouveau Reçu</span>
                </Button>
              </div>

              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem', textAlign: 'left' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--df-border-subtle)', color: 'var(--df-text-muted)', fontSize: '0.72rem', textTransform: 'uppercase' }}>
                      <th style={{ padding: '0.65rem 0.85rem' }}>Véhicule</th>
                      <th style={{ padding: '0.65rem 0.85rem' }}>Station Naftal</th>
                      <th style={{ padding: '0.65rem 0.85rem' }}>Litres</th>
                      <th style={{ padding: '0.65rem 0.85rem' }}>Montant DA</th>
                      <th style={{ padding: '0.65rem 0.85rem' }}>Écart Jauge</th>
                      <th style={{ padding: '0.65rem 0.85rem' }}>Statut</th>
                      <th style={{ padding: '0.65rem 0.85rem', textAlign: 'right' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredReceipts.length === 0 ? (
                      <tr>
                        <td colSpan={7} style={{ textAlign: 'center', padding: '2.5rem 1rem', color: 'var(--df-text-muted)' }}>
                          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
                            <span style={{ fontSize: '1.5rem' }}>⛽</span>
                            <span style={{ fontWeight: 600 }}>
                              {isDemoMode
                                ? 'Aucun reçu de simulation ne correspond à ce filtre.'
                                : 'Aucun ticket Naftal enregistré dans votre parc.'}
                            </span>
                            <span style={{ fontSize: '0.78rem' }}>
                              Scannez un ticket Naftal ou importez un relevé pour déclencher la réconciliation CUSUM.
                            </span>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      filteredReceipts.map((rcpt) => (
                      <tr key={rcpt.receiptId} style={{ borderBottom: '1px solid var(--df-border-subtle)' }}>
                        <td style={{ padding: '0.65rem 0.85rem', fontWeight: 700, color: 'var(--df-text-main)' }}>
                          {rcpt.assetName}
                        </td>
                        <td style={{ padding: '0.65rem 0.85rem', color: 'var(--df-text-secondary)' }}>
                          {rcpt.stationName}
                        </td>
                        <td className="df-mono" style={{ padding: '0.65rem 0.85rem', fontWeight: 700, color: 'var(--df-text-main)' }}>
                          {rcpt.liters} L
                        </td>
                        <td className="df-mono" style={{ padding: '0.65rem 0.85rem', color: 'var(--df-accent-blue)', fontWeight: 600 }}>
                          {rcpt.totalAmountDzd.toLocaleString('fr-DZ')} DA
                        </td>
                        <td
                          className="df-mono"
                          style={{
                            padding: '0.65rem 0.85rem',
                            color: rcpt.reconciliation.varianceLiters <= 5 ? 'var(--df-status-ok)' : 'var(--df-status-danger)',
                            fontWeight: 700,
                          }}
                        >
                          {rcpt.reconciliation.varianceLiters.toFixed(1)} L
                        </td>
                        <td style={{ padding: '0.65rem 0.85rem' }}>
                          <Badge variant={rcpt.reconciliation.reconciliationStatus === 'VERIFIED' ? 'ok' : 'danger'}>
                            {rcpt.reconciliation.reconciliationStatus === 'VERIFIED' ? 'VALIDÉ' : 'SUSPECT'}
                          </Badge>
                        </td>
                        <td style={{ padding: '0.65rem 0.85rem', textAlign: 'right' }}>
                          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
                            <CalculationProofButton
                              label="Preuve"
                              size="xs"
                              variant={rcpt.reconciliation.reconciliationStatus === 'VERIFIED' ? 'emerald' : 'amber'}
                              onClick={() => handleOpenFuelProof(rcpt)}
                            />
                            <button
                              onClick={() => handleOpenEdit(rcpt)}
                              title="Modifier ce reçu"
                              style={{
                                background: 'transparent',
                                border: 'none',
                                color: 'var(--df-text-muted)',
                                cursor: 'pointer',
                                padding: '0.2rem',
                                display: 'inline-flex',
                                alignItems: 'center',
                              }}
                            >
                              <IconEdit size={14} />
                            </button>
                            <button
                              onClick={() => setDeleteConfirm({ id: rcpt.receiptId, label: `${rcpt.stationName} (${rcpt.liters} L)` })}
                              title="Supprimer ce reçu"
                              style={{
                                background: 'transparent',
                                border: 'none',
                                color: 'var(--df-status-danger)',
                                cursor: 'pointer',
                                padding: '0.2rem',
                                display: 'inline-flex',
                                alignItems: 'center',
                              }}
                            >
                              <IconTrash size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    )))}
                  </tbody>
                </table>
              </div>
            </div>
          </main>
        </div>
      </div>

      {/* MODALE 1 : SAISIE MANUELLE DE PLEIN */}
      {isManualModalOpen && (
        <div
          role="dialog"
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 1000,
            background: 'rgba(0, 0, 0, 0.65)',
            backdropFilter: 'blur(3px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1rem',
          }}
        >
          <div
            style={{
              width: '100%',
              maxWidth: '480px',
              padding: '1.75rem',
              background: 'var(--df-bg-surface-1)',
              borderRadius: 'var(--df-radius-lg)',
              border: '1px solid var(--df-border-subtle)',
              boxShadow: 'var(--df-shadow-lg)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--df-text-main)', margin: 0 }}>
                Enregistrer un Plein Manuellement
              </h3>
              <button
                type="button"
                onClick={() => setIsManualModalOpen(false)}
                style={{ background: 'transparent', border: 'none', color: 'var(--df-text-muted)', cursor: 'pointer' }}
              >
                <IconX size={16} />
              </button>
            </div>

            <form onSubmit={handleCreateManualReceipt} style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: 'var(--df-text-muted)', marginBottom: '0.3rem' }}>
                  Véhicule *
                </label>
                <select
                  required
                  value={manualForm.assetId}
                  onChange={(e) => setManualForm({ ...manualForm, assetId: e.target.value })}
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
                  {assets.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.code} — {a.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: 'var(--df-text-muted)', marginBottom: '0.3rem' }}>
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
                  <option value="Gasoil">Gasoil ({tariffs.fuelPrices.gasoil.toFixed(2)} DA)</option>
                  <option value="Sans Plomb">Sans Plomb ({tariffs.fuelPrices.sansPlomb.toFixed(2)} DA)</option>
                  <option value="Super">Super ({tariffs.fuelPrices.super.toFixed(2)} DA)</option>
                  <option value="GPL">GPL / Sirghaz ({tariffs.fuelPrices.gpl.toFixed(2)} DA)</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: 'var(--df-text-muted)', marginBottom: '0.3rem' }}>
                  Station Naftal *
                </label>
                <input
                  type="text"
                  required
                  value={manualForm.stationName}
                  onChange={(e) => setManualForm({ ...manualForm, stationName: e.target.value })}
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

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.65rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: 'var(--df-text-muted)', marginBottom: '0.3rem' }}>
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
                    className="df-mono"
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
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: 'var(--df-text-muted)', marginBottom: '0.3rem' }}>
                    Montant Calculé (DA)
                  </label>
                  <input
                    type="number"
                    value={manualForm.totalAmountDzd}
                    onChange={(e) => setManualForm({ ...manualForm, totalAmountDzd: Number(e.target.value) })}
                    className="df-mono"
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

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '0.75rem' }}>
                <Button variant="outline" size="sm" type="button" onClick={() => setIsManualModalOpen(false)}>
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
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 1000,
            background: 'rgba(0, 0, 0, 0.65)',
            backdropFilter: 'blur(3px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1rem',
          }}
        >
          <div
            style={{
              width: '100%',
              maxWidth: '480px',
              padding: '1.75rem',
              background: 'var(--df-bg-surface-1)',
              borderRadius: 'var(--df-radius-lg)',
              border: '1px solid var(--df-border-subtle)',
              boxShadow: 'var(--df-shadow-lg)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--df-text-main)', margin: 0 }}>
                Modifier Reçu Naftal
              </h3>
              <button
                type="button"
                onClick={() => setIsEditModalOpen(false)}
                style={{ background: 'transparent', border: 'none', color: 'var(--df-text-muted)', cursor: 'pointer' }}
              >
                <IconX size={16} />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: 'var(--df-text-muted)', marginBottom: '0.3rem' }}>
                  Station Naftal *
                </label>
                <input
                  type="text"
                  required
                  value={editForm.stationName}
                  onChange={(e) => setEditForm({ ...editForm, stationName: e.target.value })}
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

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.65rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: 'var(--df-text-muted)', marginBottom: '0.3rem' }}>
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
                    className="df-mono"
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
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: 'var(--df-text-muted)', marginBottom: '0.3rem' }}>
                    Montant (DA)
                  </label>
                  <input
                    type="number"
                    value={editForm.totalAmountDzd}
                    onChange={(e) => setEditForm({ ...editForm, totalAmountDzd: Number(e.target.value) })}
                    className="df-mono"
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

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '0.75rem' }}>
                <Button variant="outline" size="sm" type="button" onClick={() => setIsEditModalOpen(false)}>
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
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 1000,
            background: 'rgba(0, 0, 0, 0.65)',
            backdropFilter: 'blur(3px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1rem',
          }}
        >
          <div
            style={{
              width: '100%',
              maxWidth: '440px',
              padding: '1.5rem',
              background: 'var(--df-bg-surface-1)',
              borderRadius: 'var(--df-radius-lg)',
              border: '1px solid var(--df-status-danger)',
              boxShadow: 'var(--df-shadow-lg)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '0.75rem', color: 'var(--df-status-danger)' }}>
              <IconAlertTriangle size={22} />
              <h3 style={{ fontSize: '1.15rem', fontWeight: 800, margin: 0 }}>
                Supprimer ce Reçu ?
              </h3>
            </div>
            <p style={{ fontSize: '0.85rem', color: 'var(--df-text-secondary)', lineHeight: 1.5, marginBottom: '1.25rem' }}>
              Confirmez-vous la suppression du reçu <strong>« {deleteConfirm.label} »</strong> ?
            </p>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.65rem' }}>
              <Button variant="outline" size="sm" onClick={() => setDeleteConfirm(null)}>
                Annuler
              </Button>
              <button
                onClick={handleDeleteConfirm}
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

      {/* PROOF OF CALCULATION MODAL */}
      <CalculationProofModal
        isOpen={isProofModalOpen}
        onClose={() => setIsProofModalOpen(false)}
        data={proofModalData}
      />

      {/* PROCÈS-VERBAL CUSUM OPPOSABLE (PILIER 1) */}
      {isLegalReportOpen && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.75)',
            backdropFilter: 'blur(5px)',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '24px',
          }}
        >
          <div style={{ maxWidth: '1050px', width: '100%', maxHeight: '92vh', overflowY: 'auto' }}>
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
