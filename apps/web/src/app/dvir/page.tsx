'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Navbar } from '../../components/navigation/Navbar';
import { Card } from '../../components/Card';
import { Badge } from '../../components/Badge';
import { Button } from '../../components/Button';
import { MetricCard } from '../../components/MetricCard';
import { AuthClient } from '../../lib/api-auth';
import { AssetClient } from '../../lib/api-assets';
import {
  FleetIntelligenceClient,
  DVIRInspectionReport,
  DVIRSubmissionDto,
  DVIRChecklistItem,
  DVIRInspectionType,
  DVIRItemStatus,
} from '../../lib/api-fleet-intelligence';
import { Asset } from '@docteurflotte/contracts';
import { useDemoMode } from '../../context/DemoModeContext';
import { SignaturePad, PhotoProofCapture } from '../../components/dvir';
import { saveDvirOffline, getPendingOfflineInspections, markDvirSynced } from '../../lib/offline-dvir-storage';
import { getSimulationDvirData } from '@/lib/simulation-sandbox';

interface VehicleProfile {
  id: string;
  name: string;
  plate: string;
  category: string;
  driverName: string;
  driverId: string;
  odometerKm: number;
  engineHours: number;
  wilaya: string;
  fuelType: string;
  lastInspectionDate: string;
  lastInspectionResult: 'PASS' | 'FAIL_MINOR' | 'FAIL_CRITICAL';
  lastInspectionNotes?: string;
  traccarDeviceId?: string;
}

const INITIAL_CHECKLIST: DVIRChecklistItem[] = [
  {
    code: 'TIRES',
    category: 'TIRES_BRAKES',
    label: 'Pneumatiques & Pression',
    description: 'Bandes de roulement, absence de hernies, coupures flanc, serrage goujons (>= 8.5 bars)',
    status: DVIRItemStatus.PASS,
  },
  {
    code: 'BRAKES',
    category: 'TIRES_BRAKES',
    label: 'Frein de Service & Frein de Parc',
    description: 'Pression circuit pneumatique >= 8 bars, étanchéité flexibles, course pédale',
    status: DVIRItemStatus.PASS,
  },
  {
    code: 'OIL_LEVEL',
    category: 'MECHANICAL',
    label: 'Niveau Huile Moteur & Liquide Refroidissement',
    description: 'Jauge huile moteur entre repères, niveau bocal liquide conforme sans fuite apparente',
    status: DVIRItemStatus.PASS,
  },
  {
    code: 'STEERING_SUSPENSION',
    category: 'MECHANICAL',
    label: 'Direction & Suspensions',
    description: 'Jeu au volant, état des lames de ressort et coussins pneumatiques sans affaissement',
    status: DVIRItemStatus.PASS,
  },
  {
    code: 'FIRE_EXTINGUISHER',
    category: 'SAFETY_EQUIPMENT',
    label: 'Extincteur Réglementaire Vérifié',
    description: 'Obligation légale Algérie : extincteur 6kg poudre ABC plombé avec date de validité visible',
    status: DVIRItemStatus.PASS,
  },
  {
    code: 'ENACTA_DOCS',
    category: 'REGULATORY_DOCS',
    label: 'PV Contrôle Technique ENACTA & Assurance',
    description: 'Présence physique en cabine du PV ENACTA non échu et de l’attestation SAA/CAAT en cours',
    status: DVIRItemStatus.PASS,
  },
  {
    code: 'LIGHTING_SIGNALS',
    category: 'LIGHTING',
    label: 'Feux & Signalisation',
    description: 'Feux de croisement, stop, clignotants, feux de détresse et bandes rétroréfléchissantes',
    status: DVIRItemStatus.PASS,
  },
];

const CHECKLIST_AR: Record<string, { label: string; desc: string }> = {
  TIRES: {
    label: 'الإطارات والضغط الهوائي',
    desc: 'سلامة مداس العجلات، غياب التشققات أو الانتفاخات، إحكام براغي التثبيت (≥ 8.5 بار)',
  },
  BRAKES: {
    label: 'فرامل الخدمة والتوقف',
    desc: 'ضغط الهواء بالمكابح ≥ 8 بار، سلامة خراطيم الضغط، مسار دواسة الفرامل',
  },
  OIL_LEVEL: {
    label: 'مستوى زيت المحرك وسائل التبريد',
    desc: 'مستوى الزيت بين العلامتين، سائل التبريد كافٍ وبدون أي تسريب مرئي',
  },
  STEERING_SUSPENSION: {
    label: 'نظام التوجيه والتعليق',
    desc: 'حركة المقود العادية، سلامة صفائح النوابض والوسائد الهوائية',
  },
  FIRE_EXTINGUISHER: {
    label: 'مطفأة الحريق القانونية المصادق عليها',
    desc: 'إلزام قانوني بالجزائر: مطفأة 6 كغ مسحوق ABC مختومة وتاريخ صلاحيتها سارٍ',
  },
  ENACTA_DOCS: {
    label: 'شهادة المراقبة التقنية ENACTA والتأمين',
    desc: 'وجود الوثائق القانونية سارية المفعول داخل مقصورة القيادة',
  },
  LIGHTING_SIGNALS: {
    label: 'الإنارة والإشارات الضوئية',
    desc: 'أضواء التقاطع، التوقف، الإشارات الجانبية والشرائط العاكسة للضوء',
  },
};

const DVIR_I18N = {
  fr: {
    pageTitle: 'DVIR Numérique & Inspection Véhicule Algérien',
    badge: 'Code de la Route & ENACTA',
    subtitle: 'Digital Driver Vehicle Inspection Report avant départ et fin de tournée. Remplissage automatique des caractéristiques télématiques lors du changement d\'actif et blocage immédiat de départ en cas d\'anomalie critique.',
    refreshBtn: '🔄 Actualiser Télémétrie',
    workOrdersBtn: '🔧 Ordres de Travail Atelier →',
    statTotal: 'Inspections Enregistrées',
    statTotalDesc: 'Total des fiches DVIR soumises',
    statPass: 'Véhicules Conformes (Pass)',
    statPassDesc: 'Autorisés à circuler sans réserve',
    statCritical: 'Anomalies Critiques',
    statCriticalDesc: 'Véhicules immobilisés pour sécurité',
    driverLabel: 'Conducteur / Opérateur',
    timingLabel: 'Moment du Contrôle',
    preTripOption: 'Pre-Trip (Avant départ tournée)',
    postTripOption: 'Post-Trip (Retour de mission / Dépôt)',
    odometerLabel: 'Relevé Odomètre au Tableau de Bord (km) *',
    checklistTitle: 'Points de Contrôle Légaux & Organes Mécaniques',
    btnPass: '✓ Conforme',
    btnMinor: '⚠ Mineur',
    btnCritical: '🚨 Critique',
    btnSubmit: 'Certifier & Enregistrer l’Inspection DVIR',
    submitting: 'Certification et signature en cours...',
    notesLabel: 'Observations Générales du Conducteur / Atelier',
  },
  ar: {
    pageTitle: 'فحص المركبة الرقمي (DVIR) ومحضر المعاينة الميدانية',
    badge: 'مطابقة قانون المرور و ENACTA',
    subtitle: 'محضر فحص المركبة الرقمي قبل الانطلاق وعند العودة. ملء تلقائي للبيانات التلغرافية ومنع فوري للمهمة في حالة وجود عطب خطير يمس بالسلامة.',
    refreshBtn: '🔄 تحديث التليماتيكس',
    workOrdersBtn: '🔧 أوامر العمل بالورشة ←',
    statTotal: 'الفحوصات المسجلة',
    statTotalDesc: 'إجمالي تقارير DVIR المعتمدة',
    statPass: 'مركبات مطابقة وجاهزة',
    statPassDesc: 'مرخص لها بالسير دون تحفظ',
    statCritical: 'أعطاب خطيرة موجبة للتوقيف',
    statCriticalDesc: 'مركبات موقوفة لأسباب أمنية',
    driverLabel: 'السائق / المشغل',
    timingLabel: 'وقت الفحص',
    preTripOption: 'قبل الانطلاق (Pre-Trip)',
    postTripOption: 'عند العودة إلى الحظيرة (Post-Trip)',
    odometerLabel: 'قراءة عداد الكيلومترات باللوحة (كم) *',
    checklistTitle: 'نقاط المراقبة القانونية والأعضاء الميكانيكية',
    btnPass: '✓ سليم ومطابق',
    btnMinor: '⚠ عطب خفيف',
    btnCritical: '🚨 عطب خطير',
    btnSubmit: 'المصادقة وتوقيع محضر الفحص (DVIR)',
    submitting: 'جاري المصادقة والتوقيع الرقمي...',
    notesLabel: 'ملاحظات السائق أو فني الورشة',
  },
};

export default function DvirPage() {
  const { isDemoMode, isGuest, toggleDemoMode } = useDemoMode();
  const [language, setLanguage] = useState<'fr' | 'ar'>('fr');
  const [isOnline, setIsOnline] = useState<boolean>(true);
  const [offlineQueue, setOfflineQueue] = useState<DVIRSubmissionDto[]>([]);
  const [isSyncingOffline, setIsSyncingOffline] = useState<boolean>(false);
  const [vehicles, setVehicles] = useState<VehicleProfile[]>([]);
  const [reports, setReports] = useState<DVIRInspectionReport[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState<{ type: 'ok' | 'danger'; text: string } | null>(null);
  const [filterReportsByAsset, setFilterReportsByAsset] = useState<boolean>(false);

  // Formulaire d'inspection active lié au véhicule sélectionné (vide par défaut en production)
  const [selectedAssetId, setSelectedAssetId] = useState<string>('');
  const [driverName, setDriverName] = useState<string>('');
  const [inspectionType, setInspectionType] = useState<DVIRInspectionType>(DVIRInspectionType.PRE_TRIP);
  const [odometerKm, setOdometerKm] = useState<number>(0);
  const [checklist, setChecklist] = useState<DVIRChecklistItem[]>(INITIAL_CHECKLIST);
  const [generalNotes, setGeneralNotes] = useState<string>('');
  const [signatureDataUrl, setSignatureDataUrl] = useState<string | null>(null);

  // Initialisation de la file hors-ligne locale
  useEffect(() => {
    try {
      const savedQueue = localStorage.getItem('df_dvir_offline_queue');
      if (savedQueue) {
        const parsed = JSON.parse(savedQueue);
        if (Array.isArray(parsed)) {
          setOfflineQueue(parsed);
        }
      }
    } catch {
      // Ignoré
    }
  }, []);

  useEffect(() => {
    loadReportsAndAssets();
    const onlineStatus = typeof navigator !== 'undefined' ? navigator.onLine : true;
    setIsOnline(onlineStatus);

    const handleOnline = () => {
      setIsOnline(true);
      // Tentative de synchronisation différée automatique dès retour du réseau
      triggerOfflineSync();
    };

    const handleOffline = () => {
      setIsOnline(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [isDemoMode]);

  /**
   * Déclenche la synchronisation différée des fiches en attente (Store-and-Forward)
   */
  const triggerOfflineSync = async (forcedQueue?: DVIRSubmissionDto[]) => {
    const queueToProcess = forcedQueue || offlineQueue;
    if (queueToProcess.length === 0) return;

    setIsSyncingOffline(true);
    try {
      const session = AuthClient.getSession();
      const res = await FleetIntelligenceClient.syncDvirOfflineBatch(
        {
          reports: queueToProcess,
          syncDeviceId: 'PWA-DRIVER-OFFLINE-DZ',
        },
        session.token || undefined,
      );

      // Vidage de la file locale après confirmation du serveur
      setOfflineQueue([]);
      localStorage.removeItem('df_dvir_offline_queue');

      setFeedbackMessage({
        type: 'ok',
        text: `✓ Synchronisation différée réussie : ${res.syncedCount} fiche(s) transmise(s) à l'atelier (${res.criticalFailuresCount} anomalie(s) critique(s)).`,
      });

      setSignatureDataUrl(null);
      await loadReportsAndAssets();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setFeedbackMessage({
        type: 'danger',
        text: `Échec de synchronisation différée : ${msg || 'Serveur indisponible, nouvelle tentative ultérieure.'}`,
      });
    } finally {
      setIsSyncingOffline(false);
    }
  };

  const loadReportsAndAssets = useCallback(async () => {
    setIsLoading(true);
    try {
      const session = AuthClient.getSession();
      const token = session.token || undefined;
      const data = await FleetIntelligenceClient.getDvirReports(token, isDemoMode);
      setReports(data);

      if (isDemoMode) {
        const { vehicles: simVehicles } = await getSimulationDvirData();
        setVehicles(simVehicles as VehicleProfile[]);
        if (simVehicles.length > 0) {
          handleAssetChange(simVehicles[0].id, simVehicles as VehicleProfile[]);
        }
      } else {
        // Mode Réel Production : Strictement les données de l'organisation
        if (token) {
          try {
            const apiAssets: Asset[] = await AssetClient.listAssets(token);
            if (apiAssets && apiAssets.length > 0) {
              const mappedProfiles: VehicleProfile[] = apiAssets.map((a, idx) => ({
                id: a.id,
                name: a.name,
                plate: a.code || `DZ-${idx + 1}-16`,
                category: a.category,
                driverName: (a as any).assignedDriverName || 'Conducteur Non Assigné',
                driverId: (a as any).assignedDriverId || `drv-${a.id.substring(0, 8)}`,
                odometerKm: a.currentMeterValue || 0,
                engineHours: 0,
                wilaya: (a as any).assignedWilaya || '16 - Alger',
                fuelType: (a as any).fuelType || 'Gazole Naftal',
                lastInspectionDate: 'Aucune inspection',
                lastInspectionResult: 'PASS',
                traccarDeviceId: (a as any).traccarDeviceId || `TK-${a.id}`,
              }));
              setVehicles(mappedProfiles);
              handleAssetChange(mappedProfiles[0].id, mappedProfiles);
            } else {
              setVehicles([]);
              setSelectedAssetId('');
              setDriverName('');
              setOdometerKm(0);
            }
          } catch {
            setVehicles([]);
            setSelectedAssetId('');
            setDriverName('');
            setOdometerKm(0);
          }
        } else {
          // Aucun jeton en mode réel : parc vierge, ne pas injecter de fausses données !
          setVehicles([]);
          setSelectedAssetId('');
          setDriverName('');
          setOdometerKm(0);
        }
      }
    } catch (err) {
      console.error('Erreur chargement DVIR:', err);
    } finally {
      setIsLoading(false);
    }
  }, [isDemoMode]);

  /**
   * Action déclenchée dès que l'utilisateur change de véhicule dans le sélecteur.
   * Remplissage automatique et immédiat :
   * - Odomètre réel certifié par la télématique
   * - Conducteur / opérateur assigné
   * - Réinitialisation propre de la checklist
   */
  const handleAssetChange = (newAssetId: string, vehicleList: VehicleProfile[] = vehicles) => {
    setSelectedAssetId(newAssetId);
    const targetVehicle = vehicleList.find((v) => v.id === newAssetId);
    if (targetVehicle) {
      setOdometerKm(targetVehicle.odometerKm);
      setDriverName(targetVehicle.driverName);
      setGeneralNotes('');
      setChecklist(
        INITIAL_CHECKLIST.map((item) => ({
          ...item,
          status: DVIRItemStatus.PASS,
          comment: undefined,
        }))
      );
    } else {
      setOdometerKm(0);
      setDriverName('');
    }
  };

  const selectedVehicle = vehicles.find((v) => v.id === selectedAssetId) || (vehicles.length > 0 ? vehicles[0] : null);

  const handleStatusChange = (code: string, newStatus: DVIRItemStatus) => {
    setChecklist((prev) =>
      prev.map((item) => (item.code === code ? { ...item, status: newStatus } : item))
    );
  };

  const handleCommentChange = (code: string, comment: string) => {
    setChecklist((prev) =>
      prev.map((item) => (item.code === code ? { ...item, comment } : item))
    );
  };

  const handlePhotoChange = (code: string, photoUrl: string | undefined) => {
    setChecklist((prev) =>
      prev.map((item) => (item.code === code ? { ...item, photoUrl } : item))
    );
  };

  const handleMarkAllPass = () => {
    setChecklist((prev) =>
      prev.map((item) => ({ ...item, status: DVIRItemStatus.PASS, comment: undefined, photoUrl: undefined }))
    );
  };

  const handleResetChecklist = () => {
    setSignatureDataUrl(null);
    if (selectedVehicle) {
      handleAssetChange(selectedVehicle.id);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAssetId || !selectedVehicle) {
      setFeedbackMessage({
        type: 'danger',
        text: 'Veuillez sélectionner un véhicule de votre parc avant de soumettre l’inspection.',
      });
      return;
    }
    setIsSubmitting(true);
    setFeedbackMessage(null);

    const submissionDto: DVIRSubmissionDto = {
      assetId: selectedAssetId,
      driverId: selectedVehicle?.driverId || 'drv-01',
      driverName,
      inspectionType,
      odometerKm,
      items: checklist,
      generalNotes,
      signatureDataUrl: signatureDataUrl || undefined,
      submittedAt: new Date().toISOString(),
    };

    // Cas 1 : Mode hors-ligne détecté ou forcé (Zone blanche saharienne)
    if (!isOnline) {
      const updatedQueue = [...offlineQueue, submissionDto];
      setOfflineQueue(updatedQueue);
      try {
        localStorage.setItem('df_dvir_offline_queue', JSON.stringify(updatedQueue));
        // Persistance native IndexedDB pour gestion des photos et signatures volumineuses
        await saveDvirOffline({
          assetId: selectedAssetId,
          assetPlate: selectedVehicle?.plate || '',
          driverId: selectedVehicle?.driverId || 'drv-01',
          driverName,
          inspectionType: inspectionType === DVIRInspectionType.POST_TRIP ? 'POST_TRIP' : 'PRE_TRIP',
          odometerKm,
          items: checklist.map((i) => ({
            code: i.code,
            label: i.label,
            category: String(i.category || 'SECURITY'),
            status:
              i.status === DVIRItemStatus.FAIL_CRITICAL
                ? 'DEFECT_CRITICAL'
                : i.status === DVIRItemStatus.FAIL_MINOR
                  ? 'DEFECT_MINOR'
                  : 'PASS',
            comment: i.comment,
            photoUrl: i.photoUrl,
          })),
          signatureBase64: signatureDataUrl || undefined,
          deviceTimestamp: new Date().toISOString(),
        });
      } catch {
        // Fallback localStorage actif
      }

      const hasCritical = checklist.some((i) => i.status === DVIRItemStatus.FAIL_CRITICAL);
      setFeedbackMessage({
        type: hasCritical ? 'danger' : 'ok',
        text: hasCritical
          ? `🚨 Mode Hors-Ligne (Zone Blanche) : Anomalie critique enregistrée localement pour ${selectedVehicle?.name}. Véhicule consigné à l'arrêt. Fiche stockée en attente de réseau.`
          : `📱 Mode Hors-Ligne (Zone Blanche) : Fiche d'inspection enregistrée localement avec succès sur l'appareil. Elle sera transmise automatiquement à l'atelier dès le retour de la connectivité.`,
      });

      setIsSubmitting(false);
      return;
    }

    // Cas 2 : Connexion en ligne normale
    try {
      const session = AuthClient.getSession();
      const result = await FleetIntelligenceClient.submitDvirReport(submissionDto, session.token || undefined);

      if (result.hasCriticalFailures) {
        setFeedbackMessage({
          type: 'danger',
          text: `🚨 Défaillance critique constatée pour ${selectedVehicle?.name} ! Véhicule interdit de départ. Ordre de Travail généré : ${result.generatedWorkOrderId}`,
        });
      } else {
        setFeedbackMessage({
          type: 'ok',
          text: `✅ Inspection validée avec succès pour ${selectedVehicle?.name} (${selectedVehicle?.plate}). Actif conforme et autorisé au départ.`,
        });
      }

      setSignatureDataUrl(null);
      await loadReportsAndAssets();
    } catch (err: unknown) {
      // Fallback résilient en cas de rupture subite de réseau
      const updatedQueue = [...offlineQueue, submissionDto];
      setOfflineQueue(updatedQueue);
      try {
        localStorage.setItem('df_dvir_offline_queue', JSON.stringify(updatedQueue));
      } catch {
        // Ignoré
      }

      setFeedbackMessage({
        type: 'danger',
        text: `Réseau interrompu : Fiche DVIR sauvegardée dans la file d'attente hors-ligne de l'appareil. Elle sera synchronisée au rétablissement du signal.`,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Compteurs de la checklist courante
  const passItemsCount = checklist.filter((i) => i.status === DVIRItemStatus.PASS).length;
  const minorItemsCount = checklist.filter((i) => i.status === DVIRItemStatus.FAIL_MINOR).length;
  const criticalItemsCount = checklist.filter((i) => i.status === DVIRItemStatus.FAIL_CRITICAL).length;

  // Détection d'anomalie d'odomètre par rapport au dernier relevé certifié
  const isOdometerRollback = selectedVehicle && odometerKm < selectedVehicle.odometerKm;

  // Rapports filtrés pour l'historique
  const displayedReports = filterReportsByAsset
    ? reports.filter((r) => r.assetId === selectedAssetId || r.assetName.includes(selectedVehicle?.name || ''))
    : reports;

  const criticalCount = reports.filter((r) => r.hasCriticalFailures).length;
  const compliantCount = reports.filter((r) => r.isCompliant).length;
  const t = DVIR_I18N[language];

  return (
    <>
      <Navbar />

      <main className="df-container" style={{ paddingTop: '0.5rem' }} dir={language === 'ar' ? 'rtl' : 'ltr'}>
        {/* EN-TÊTE DE SECTION COCKPIT */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            marginBottom: '2rem',
            flexWrap: 'wrap',
            gap: '1.25rem',
            borderBottom: '1px solid var(--df-border-subtle)',
            paddingBottom: '1.5rem',
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
              <span style={{ fontSize: '1.85rem' }}>📋</span>
              <h1
                style={{
                  fontSize: '1.85rem',
                  fontWeight: 800,
                  color: 'var(--df-text-main)',
                  letterSpacing: '-0.02em',
                  margin: 0,
                }}
              >
                {t.pageTitle}
              </h1>
              <Badge variant="ok">{t.badge}</Badge>
              <Badge variant={isDemoMode ? 'warning' : 'neutral'}>
                {isDemoMode ? 'MODE SIMULATION (DÉMO)' : 'PARC RÉEL (PRODUCTION RLS)'}
              </Badge>
              {!isDemoMode && vehicles.length === 0 && (
                <Badge variant="danger">Parc Vierge (0 actif)</Badge>
              )}
            </div>
            <p
              style={{
                fontSize: '0.875rem',
                color: 'var(--df-text-muted)',
                margin: 0,
                maxWidth: '820px',
                lineHeight: 1.55,
              }}
            >
              {t.subtitle}
            </p>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
            {/* BADGE CONNECTIVITÉ & STOCKAGE OFFLINE-FIRST */}
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: '0.8rem',
                fontWeight: 600,
                padding: '4px 10px',
                borderRadius: '6px',
                backgroundColor: isOnline ? 'var(--df-status-ok-bg)' : 'var(--df-status-warning-bg)',
                color: isOnline ? 'var(--df-status-ok-text)' : 'var(--df-status-warning-text)',
                border: `1px solid ${isOnline ? 'var(--df-status-ok-border)' : 'var(--df-status-warning-border)'}`,
              }}
            >
              <span
                style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  backgroundColor: isOnline ? '#10B981' : '#F59E0B',
                }}
              />
              {isOnline
                ? language === 'ar' ? 'متصل (مزامنة فورية)' : 'En Ligne (Réseau Actif)'
                : language === 'ar' ? 'غير متصل (منطقة بيضاء / حفظ محلي)' : 'Hors-Ligne (Zone Blanche / Local)'}
            </span>

            {/* BOUTON SYNCHRONISATION DIFFÉRÉE (STORE-AND-FORWARD) */}
            {offlineQueue.length > 0 && (
              <button
                onClick={() => triggerOfflineSync()}
                disabled={isSyncingOffline || !isOnline}
                style={{
                  padding: '6px 14px',
                  borderRadius: '6px',
                  border: '1px solid #f59e0b',
                  background: 'rgba(245, 158, 11, 0.15)',
                  color: '#f59e0b',
                  fontWeight: 700,
                  cursor: isOnline ? 'pointer' : 'not-allowed',
                  fontSize: '0.82rem',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  opacity: isOnline ? 1 : 0.6,
                }}
              >
                <span>🔄</span>
                <span>
                  {isSyncingOffline
                    ? 'Synchronisation en cours...'
                    : `Synchroniser (${offlineQueue.length} en attente)`}
                </span>
              </button>
            )}

            {/* COMMUTATEUR BILINGUE FR / AR (RTL) */}
            <button
              onClick={() => setLanguage(language === 'fr' ? 'ar' : 'fr')}
              style={{
                padding: '6px 12px',
                borderRadius: '4px',
                border: '1px solid var(--df-border-main)',
                background: 'var(--df-card-bg)',
                color: 'var(--df-text-main)',
                fontWeight: 700,
                cursor: 'pointer',
                fontSize: '0.82rem',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}
              title="Basculer la langue / تبديل اللغة"
            >
              <span>{language === 'fr' ? '🇩🇿 العربية (RTL)' : '🇫🇷 Français'}</span>
            </button>

            <Button variant="outline" size="sm" onClick={loadReportsAndAssets} disabled={isLoading}>
              {isLoading ? '⏳...' : t.refreshBtn}
            </Button>
            <Link href="/work-orders" style={{ textDecoration: 'none' }}>
              <Button variant="primary" size="sm">
                {t.workOrdersBtn}
              </Button>
            </Link>
          </div>
        </div>

        {/* MÉTRIQUES CLÉS CONSOLIDÉES */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
            gap: '1.25rem',
            marginBottom: '2rem',
          }}
        >
          <MetricCard
            title={t.statTotal}
            value={reports.length.toString()}
            unit={language === 'ar' ? 'تقارير' : 'Rapports'}
            description={t.statTotalDesc}
            icon="📋"
          />
          <MetricCard
            title={t.statPass}
            value={compliantCount.toString()}
            unit={language === 'ar' ? 'مركبة' : 'Flotte'}
            description={t.statPassDesc}
            icon="✅"
            trend={{
              direction: 'up',
              text: `${Math.round((compliantCount / (reports.length || 1)) * 100)}%`,
              isPositive: true,
            }}
          />
          <MetricCard
            title={t.statCritical}
            value={criticalCount.toString()}
            unit={language === 'ar' ? 'مركبة' : 'Véhicules'}
            description={t.statCriticalDesc}
            icon="🚨"
            trend={
              criticalCount > 0
                ? {
                    direction: 'down',
                    text: `${criticalCount} alertes`,
                    isPositive: false,
                  }
                : {
                    direction: 'up',
                    text: '0',
                    isPositive: true,
                  }
            }
          />
        </div>

        {/* BANNIÈRE DE NOTIFICATION */}
        {feedbackMessage && (
          <div
            style={{
              padding: '1rem 1.25rem',
              borderRadius: 'var(--df-radius-md)',
              marginBottom: '1.75rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              background:
                feedbackMessage.type === 'danger'
                  ? 'var(--df-status-danger-bg)'
                  : 'var(--df-status-ok-bg)',
              border: `1px solid ${
                feedbackMessage.type === 'danger'
                  ? 'var(--df-status-danger-border)'
                  : 'var(--df-status-ok-border)'
              }`,
              color:
                feedbackMessage.type === 'danger'
                  ? 'var(--df-status-danger)'
                  : 'var(--df-status-ok)',
              fontWeight: 600,
              fontSize: '0.875rem',
              boxShadow: feedbackMessage.type === 'danger' ? '0 0 16px rgba(239, 68, 68, 0.2)' : 'none',
            }}
          >
            <span>{feedbackMessage.text}</span>
            <button
              onClick={() => setFeedbackMessage(null)}
              style={{
                background: 'none',
                border: 'none',
                color: 'inherit',
                cursor: 'pointer',
                fontWeight: 700,
                fontSize: '0.85rem',
              }}
            >
              ✕
            </button>
          </div>
        )}

        {/* DISPOSITION COCKPIT : 2 COLONNES (FORMULAIRE & FEED HISTORIQUE) */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
            gap: '1.75rem',
            alignItems: 'start',
          }}
        >
          {/* COLONNE GAUCHE : FORMULAIRE CONDUCTEUR TERRAIN */}
          <Card
            style={{
              padding: '1.75rem',
              background: 'linear-gradient(135deg, var(--df-bg-surface-1) 0%, var(--df-bg-surface-2) 100%)',
              border: '1px solid var(--df-border-subtle)',
              borderTop: '2px solid var(--df-accent-blue)',
            }}
          >
            {/* EN-TÊTE FORMULAIRE & ACTIONS RAPIDES */}
            <div
              style={{
                borderBottom: '1px solid var(--df-border-subtle)',
                paddingBottom: '1.25rem',
                marginBottom: '1.5rem',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '1rem',
              }}
            >
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                  <span style={{ fontSize: '1.35rem' }}>📱</span>
                  <h2
                    style={{
                      fontSize: '1.15rem',
                      fontWeight: 700,
                      color: 'var(--df-text-main)',
                      margin: 0,
                    }}
                  >
                    Fiche d’Inspection Conducteur
                  </h2>
                </div>
                <p style={{ fontSize: '0.8rem', color: 'var(--df-text-muted)', margin: '0.25rem 0 0 0' }}>
                  Sélectionnez un véhicule : son odomètre et son chauffeur attitré se renseignent automatiquement.
                </p>
              </div>

              {/* BOUTONS D'ACTION RAPIDE */}
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                <button
                  type="button"
                  onClick={handleMarkAllPass}
                  style={{
                    padding: '0.35rem 0.75rem',
                    borderRadius: 'var(--df-radius-xs)',
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    background: 'var(--df-status-ok-bg)',
                    color: 'var(--df-status-ok)',
                    border: '1px solid var(--df-status-ok-border)',
                    cursor: 'pointer',
                  }}
                  title="Marquer tous les organes conformes en 1 clic"
                >
                  ⚡ Tout Conforme (Pass)
                </button>
                <button
                  type="button"
                  onClick={handleResetChecklist}
                  style={{
                    padding: '0.35rem 0.65rem',
                    borderRadius: 'var(--df-radius-xs)',
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    background: 'var(--df-bg-surface-3)',
                    color: 'var(--df-text-secondary)',
                    border: '1px solid var(--df-border-subtle)',
                    cursor: 'pointer',
                  }}
                  title="Réinitialiser"
                >
                  🔄
                </button>
              </div>
            </div>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              {/* SÉLECTEUR DE VÉHICULE & SYNCHRONISATION INSTANTANÉE */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                  <label
                    style={{
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      color: 'var(--df-text-muted)',
                      textTransform: 'uppercase',
                      letterSpacing: '0.04em',
                    }}
                  >
                    Sélection du Véhicule / Matériel *
                  </label>
                  <span style={{ fontSize: '0.72rem', color: 'var(--df-accent-cyan)', fontWeight: 600 }}>
                    ⚡ Pré-remplissage automatique
                  </span>
                </div>

                {vehicles.length === 0 ? (
                  <div
                    style={{
                      padding: '0.85rem 1rem',
                      background: 'var(--df-bg-surface-3)',
                      borderRadius: 'var(--df-radius-sm)',
                      border: '1px dashed var(--df-border-subtle)',
                      color: 'var(--df-text-muted)',
                      fontSize: '0.825rem',
                      lineHeight: 1.5,
                    }}
                  >
                    Aucun véhicule enregistré dans votre parc réel.{' '}
                    <button
                      type="button"
                      onClick={() => toggleDemoMode(true)}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: 'var(--df-accent-blue)',
                        cursor: 'pointer',
                        textDecoration: 'underline',
                        fontWeight: 700,
                        padding: 0,
                      }}
                    >
                      Activer le Mode Démo
                    </button>{' '}
                    ou{' '}
                    <Link
                      href="/assets"
                      style={{ color: 'var(--df-accent-blue)', fontWeight: 700 }}
                    >
                      Ajouter un véhicule
                    </Link>.
                  </div>
                ) : (
                  <select
                    value={selectedAssetId}
                    onChange={(e) => handleAssetChange(e.target.value)}
                    style={{
                      width: '100%',
                      background: 'var(--df-bg-surface-3)',
                      border: '1px solid var(--df-accent-blue)',
                      borderRadius: 'var(--df-radius-sm)',
                      padding: '0.65rem 0.85rem',
                      fontSize: '0.875rem',
                      fontWeight: 600,
                      color: 'var(--df-text-main)',
                      outline: 'none',
                      cursor: 'pointer',
                      boxShadow: '0 0 10px rgba(37, 99, 235, 0.2)',
                    }}
                  >
                    {vehicles.map((v) => (
                      <option key={v.id} value={v.id}>
                        {v.plate} — {v.name} ({v.category})
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {/* CARTE D'IDENTITÉ TÉLÉMÉTRIQUE DE L'ACTIF SÉLECTIONNÉ */}
              {selectedVehicle && (
                <div
                  style={{
                    padding: '1rem 1.25rem',
                    borderRadius: 'var(--df-radius-sm)',
                    background: 'var(--df-bg-surface-3)',
                    border: '1px solid var(--df-border-medium)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.6rem',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                      <span
                        className="df-mono"
                        style={{
                          padding: '0.2rem 0.55rem',
                          background: 'var(--df-bg-surface-1)',
                          border: '1px solid var(--df-accent-cyan)',
                          borderRadius: 'var(--df-radius-xs)',
                          fontSize: '0.8rem',
                          fontWeight: 800,
                          color: 'var(--df-accent-cyan)',
                          letterSpacing: '0.04em',
                        }}
                      >
                        {selectedVehicle.plate}
                      </span>
                      <span style={{ fontWeight: 700, color: 'var(--df-text-main)', fontSize: '0.875rem' }}>
                        {selectedVehicle.name}
                      </span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <span className="df-pulse-live" />
                      <span style={{ fontSize: '0.72rem', color: 'var(--df-status-ok)', fontWeight: 700 }}>
                        Traccar Live
                      </span>
                    </div>
                  </div>

                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
                      gap: '0.75rem',
                      fontSize: '0.75rem',
                      color: 'var(--df-text-muted)',
                      borderTop: '1px solid var(--df-border-subtle)',
                      paddingTop: '0.6rem',
                    }}
                  >
                    <div>
                      <span>Odomètre Récent :</span>
                      <div className="df-mono" style={{ fontWeight: 800, color: 'var(--df-text-main)', fontSize: '0.85rem' }}>
                        {selectedVehicle.odometerKm.toLocaleString('fr-DZ')} km
                      </div>
                    </div>
                    <div>
                      <span>Heures Moteur :</span>
                      <div className="df-mono" style={{ fontWeight: 700, color: 'var(--df-text-secondary)', fontSize: '0.85rem' }}>
                        {selectedVehicle.engineHours.toLocaleString('fr-DZ')} h
                      </div>
                    </div>
                    <div>
                      <span>Chauffeur Titulaire :</span>
                      <div style={{ fontWeight: 700, color: 'var(--df-text-main)' }}>
                        {selectedVehicle.driverName}
                      </div>
                    </div>
                    <div>
                      <span>Wilaya d&apos;Attache :</span>
                      <div style={{ fontWeight: 600, color: 'var(--df-text-secondary)' }}>
                        {selectedVehicle.wilaya}
                      </div>
                    </div>
                  </div>

                  {selectedVehicle.lastInspectionNotes && (
                    <div
                      style={{
                        fontSize: '0.73rem',
                        color: selectedVehicle.lastInspectionResult === 'FAIL_CRITICAL' ? 'var(--df-status-danger)' : 'var(--df-text-muted)',
                        background: 'var(--df-bg-surface-1)',
                        padding: '0.4rem 0.65rem',
                        borderRadius: 'var(--df-radius-xs)',
                        borderLeft: `3px solid ${selectedVehicle.lastInspectionResult === 'FAIL_CRITICAL' ? 'var(--df-status-danger)' : 'var(--df-status-ok)'}`,
                      }}
                    >
                      Dernier contrôle ({selectedVehicle.lastInspectionDate}) : {selectedVehicle.lastInspectionNotes}
                    </div>
                  )}
                </div>
              )}

              {/* CHAMPS COMPLÉMENTAIRES (PRE-REMPLIS ET MODIFIABLES) */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                  gap: '1rem',
                }}
              >
                <div>
                  <label
                    style={{
                      display: 'block',
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      color: 'var(--df-text-muted)',
                      textTransform: 'uppercase',
                      letterSpacing: '0.04em',
                      marginBottom: '0.4rem',
                    }}
                  >
                    Conducteur / Opérateur
                  </label>
                  <input
                    type="text"
                    value={driverName}
                    onChange={(e) => setDriverName(e.target.value)}
                    style={{
                      width: '100%',
                      background: 'var(--df-bg-surface-3)',
                      border: '1px solid var(--df-border-subtle)',
                      borderRadius: 'var(--df-radius-sm)',
                      padding: '0.6rem 0.85rem',
                      fontSize: '0.85rem',
                      color: 'var(--df-text-main)',
                      outline: 'none',
                    }}
                    required
                  />
                </div>

                <div>
                  <label
                    style={{
                      display: 'block',
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      color: 'var(--df-text-muted)',
                      textTransform: 'uppercase',
                      letterSpacing: '0.04em',
                      marginBottom: '0.4rem',
                    }}
                  >
                    Moment du Contrôle
                  </label>
                  <select
                    value={inspectionType}
                    onChange={(e) => setInspectionType(e.target.value as DVIRInspectionType)}
                    style={{
                      width: '100%',
                      background: 'var(--df-bg-surface-3)',
                      border: '1px solid var(--df-border-subtle)',
                      borderRadius: 'var(--df-radius-sm)',
                      padding: '0.6rem 0.85rem',
                      fontSize: '0.85rem',
                      color: 'var(--df-text-main)',
                      outline: 'none',
                    }}
                  >
                    <option value={DVIRInspectionType.PRE_TRIP}>Pre-Trip (Avant départ tournée)</option>
                    <option value={DVIRInspectionType.POST_TRIP}>Post-Trip (Retour de mission / Dépôt)</option>
                  </select>
                </div>

                <div style={{ gridColumn: 'span 2' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                    <label
                      style={{
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        color: 'var(--df-text-muted)',
                        textTransform: 'uppercase',
                        letterSpacing: '0.04em',
                      }}
                    >
                      Relevé Odomètre au Tableau de Bord (km) *
                    </label>
                    {isOdometerRollback && (
                      <span style={{ fontSize: '0.72rem', color: 'var(--df-status-warning)', fontWeight: 700 }}>
                        ⚠️ Inversion odomètre détectée (relevé &lt; {selectedVehicle.odometerKm} km)
                      </span>
                    )}
                  </div>
                  <input
                    type="number"
                    value={odometerKm}
                    onChange={(e) => setOdometerKm(Number(e.target.value))}
                    className="df-mono"
                    style={{
                      width: '100%',
                      background: 'var(--df-bg-surface-3)',
                      border: `1px solid ${isOdometerRollback ? 'var(--df-status-warning)' : 'var(--df-border-subtle)'}`,
                      borderRadius: 'var(--df-radius-sm)',
                      padding: '0.6rem 0.85rem',
                      fontSize: '0.95rem',
                      fontWeight: 700,
                      color: 'var(--df-text-main)',
                      outline: 'none',
                    }}
                    required
                  />
                </div>
              </div>

              {/* POINTS DE CONTRÔLE INTERACTIFS AVEC SCORECARD EN TEMPS RÉEL */}
              <div style={{ marginTop: '0.5rem' }}>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    borderBottom: '1px solid var(--df-border-subtle)',
                    paddingBottom: '0.5rem',
                    marginBottom: '1rem',
                    flexWrap: 'wrap',
                    gap: '0.5rem',
                  }}
                >
                  <h3
                    style={{
                      fontSize: '0.8rem',
                      fontWeight: 700,
                      color: 'var(--df-text-muted)',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                      margin: 0,
                    }}
                  >
                    Points de Contrôle Légaux & Organes Mécaniques
                  </h3>

                  {/* SCORECARD PILL */}
                  <div style={{ display: 'flex', gap: '0.4rem', fontSize: '0.72rem' }}>
                    <span
                      style={{
                        padding: '0.15rem 0.5rem',
                        borderRadius: 'var(--df-radius-full)',
                        background: 'var(--df-status-ok-bg)',
                        color: 'var(--df-status-ok)',
                        fontWeight: 700,
                      }}
                    >
                      {passItemsCount} Conformes
                    </span>
                    {minorItemsCount > 0 && (
                      <span
                        style={{
                          padding: '0.15rem 0.5rem',
                          borderRadius: 'var(--df-radius-full)',
                          background: 'var(--df-status-warning-bg)',
                          color: 'var(--df-status-warning)',
                          fontWeight: 700,
                        }}
                      >
                        {minorItemsCount} Mineurs
                      </span>
                    )}
                    {criticalItemsCount > 0 && (
                      <span
                        style={{
                          padding: '0.15rem 0.5rem',
                          borderRadius: 'var(--df-radius-full)',
                          background: 'var(--df-status-danger-bg)',
                          color: 'var(--df-status-danger)',
                          fontWeight: 800,
                        }}
                      >
                        🚨 {criticalItemsCount} Critique(s)
                      </span>
                    )}
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {checklist.map((item) => (
                    <div
                      key={item.code}
                      style={{
                        padding: '0.85rem 1rem',
                        borderRadius: 'var(--df-radius-sm)',
                        background:
                          item.status === DVIRItemStatus.FAIL_CRITICAL
                            ? 'linear-gradient(135deg, rgba(239, 68, 68, 0.15) 0%, var(--df-bg-surface-3) 100%)'
                            : item.status === DVIRItemStatus.FAIL_MINOR
                            ? 'linear-gradient(135deg, rgba(245, 158, 11, 0.12) 0%, var(--df-bg-surface-3) 100%)'
                            : 'var(--df-bg-surface-3)',
                        border: `1px solid ${
                          item.status === DVIRItemStatus.FAIL_CRITICAL
                            ? 'var(--df-status-danger)'
                            : item.status === DVIRItemStatus.FAIL_MINOR
                            ? 'var(--df-status-warning)'
                            : 'var(--df-border-subtle)'
                        }`,
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '0.6rem',
                        transition: 'all var(--df-transition-fast)',
                      }}
                    >
                      <div
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          flexWrap: 'wrap',
                          gap: '0.75rem',
                        }}
                      >
                        <div style={{ maxWidth: '420px' }}>
                          <div style={{ fontWeight: 700, color: 'var(--df-text-main)', fontSize: '0.875rem' }}>
                            {language === 'ar' ? (CHECKLIST_AR[item.code]?.label || item.label) : item.label}
                          </div>
                          {(CHECKLIST_AR[item.code]?.desc || item.description) && (
                            <div style={{ fontSize: '0.75rem', color: 'var(--df-text-muted)', marginTop: '0.15rem' }}>
                              {language === 'ar' ? (CHECKLIST_AR[item.code]?.desc || item.description) : item.description}
                            </div>
                          )}
                        </div>

                        {/* BOUTONS INTERACTIFS DE STATUT */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', flexShrink: 0 }}>
                          <button
                            type="button"
                            onClick={() => handleStatusChange(item.code, DVIRItemStatus.PASS)}
                            style={{
                              padding: '0.35rem 0.75rem',
                              borderRadius: 'var(--df-radius-xs)',
                              fontSize: '0.75rem',
                              fontWeight: 700,
                              cursor: 'pointer',
                              border: 'none',
                              transition: 'all var(--df-transition-fast)',
                              background:
                                item.status === DVIRItemStatus.PASS
                                  ? 'var(--df-status-ok)'
                                  : 'var(--df-bg-surface-1)',
                              color:
                                item.status === DVIRItemStatus.PASS
                                  ? '#ffffff'
                                  : 'var(--df-text-muted)',
                              boxShadow:
                                item.status === DVIRItemStatus.PASS
                                  ? '0 0 10px rgba(16, 185, 129, 0.4)'
                                  : 'none',
                            }}
                          >
                            {t.btnPass}
                          </button>
                          <button
                            type="button"
                            onClick={() => handleStatusChange(item.code, DVIRItemStatus.FAIL_MINOR)}
                            style={{
                              padding: '0.35rem 0.75rem',
                              borderRadius: 'var(--df-radius-xs)',
                              fontSize: '0.75rem',
                              fontWeight: 700,
                              cursor: 'pointer',
                              border: 'none',
                              transition: 'all var(--df-transition-fast)',
                              background:
                                item.status === DVIRItemStatus.FAIL_MINOR
                                  ? 'var(--df-status-warning)'
                                  : 'var(--df-bg-surface-1)',
                              color:
                                item.status === DVIRItemStatus.FAIL_MINOR
                                  ? '#000000'
                                  : 'var(--df-text-muted)',
                              boxShadow:
                                item.status === DVIRItemStatus.FAIL_MINOR
                                  ? '0 0 10px rgba(245, 158, 11, 0.4)'
                                  : 'none',
                            }}
                          >
                            {t.btnMinor}
                          </button>
                          <button
                            type="button"
                            onClick={() => handleStatusChange(item.code, DVIRItemStatus.FAIL_CRITICAL)}
                            style={{
                              padding: '0.35rem 0.75rem',
                              borderRadius: 'var(--df-radius-xs)',
                              fontSize: '0.75rem',
                              fontWeight: 700,
                              cursor: 'pointer',
                              border: 'none',
                              transition: 'all var(--df-transition-fast)',
                              background:
                                item.status === DVIRItemStatus.FAIL_CRITICAL
                                  ? 'var(--df-status-danger)'
                                  : 'var(--df-bg-surface-1)',
                              color:
                                item.status === DVIRItemStatus.FAIL_CRITICAL
                                  ? '#ffffff'
                                  : 'var(--df-text-muted)',
                              boxShadow:
                                item.status === DVIRItemStatus.FAIL_CRITICAL
                                  ? '0 0 10px rgba(239, 68, 68, 0.5)'
                                  : 'none',
                            }}
                          >
                            {t.btnCritical}
                          </button>
                        </div>
                      </div>

                      {item.status !== DVIRItemStatus.PASS && (
                        <div style={{ paddingTop: '0.35rem', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                          <input
                            type="text"
                            placeholder="Détaillez le défaut constaté (ex: fuite raccord flexible, usure prononcée pneu gauche)..."
                            value={item.comment || ''}
                            onChange={(e) => handleCommentChange(item.code, e.target.value)}
                            style={{
                              width: '100%',
                              background: 'var(--df-bg-surface-1)',
                              border: `1px solid ${
                                item.status === DVIRItemStatus.FAIL_CRITICAL
                                  ? 'var(--df-status-danger)'
                                  : 'var(--df-status-warning)'
                              }`,
                              borderRadius: 'var(--df-radius-xs)',
                              padding: '0.5rem 0.75rem',
                              fontSize: '0.8rem',
                              color: 'var(--df-text-main)',
                              outline: 'none',
                            }}
                            required
                          />

                          {/* CAPTURE PHOTO DE PREUVE COMPRESSÉE POUR CHAUFFEUR MOBILE */}
                          <PhotoProofCapture
                            itemCode={item.code}
                            itemLabel={item.label}
                            photoUrl={item.photoUrl}
                            onChange={(url) => handlePhotoChange(item.code, url)}
                            language={language}
                          />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <label
                  style={{
                    display: 'block',
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    color: 'var(--df-text-muted)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.04em',
                    marginBottom: '0.4rem',
                  }}
                >
                  {t.notesLabel}
                </label>
                <textarea
                  rows={2}
                  value={generalNotes}
                  onChange={(e) => setGeneralNotes(e.target.value)}
                  placeholder={language === 'ar' ? 'ملاحظات إضافية، حالة المسار، حالة الطقس...' : 'Remarques complémentaires, état de la route, conditions météo...'}
                  style={{
                    width: '100%',
                    background: 'var(--df-bg-surface-3)',
                    border: '1px solid var(--df-border-subtle)',
                    borderRadius: 'var(--df-radius-sm)',
                    padding: '0.6rem 0.85rem',
                    fontSize: '0.85rem',
                    color: 'var(--df-text-main)',
                    outline: 'none',
                    resize: 'vertical',
                  }}
                />
              </div>

              {/* PAD DE SIGNATURE TACTILE CONDUCTEUR (CANVAS HTML5 SOUVERAIN) */}
              <SignaturePad
                value={signatureDataUrl}
                onChange={setSignatureDataUrl}
                driverName={driverName || selectedVehicle?.driverName}
                language={language}
              />

              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  paddingTop: '0.5rem',
                  flexWrap: 'wrap',
                  gap: '1rem',
                }}
              >
                <span style={{ fontSize: '0.75rem', color: 'var(--df-text-muted)' }}>
                  {language === 'ar' ? 'توقيع مشفر ومؤرخ تلقائياً • مطابق للقانون 18-07' : 'Signature horodatée automatique • Loi 18-07 ANPDP'}
                </span>
                <Button type="submit" variant="primary" disabled={isSubmitting || !selectedVehicle || vehicles.length === 0}>
                  {isSubmitting ? t.submitting : t.btnSubmit}
                </Button>
              </div>
            </form>
          </Card>

          {/* COLONNE DROITE : FLUX DES INSPECTIONS RÉCENTES & FILTRE PAR VÉHICULE */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <Card style={{ padding: '1.5rem' }}>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '1.25rem',
                  flexWrap: 'wrap',
                  gap: '0.5rem',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                  <span style={{ fontSize: '1.35rem' }}>🛡️</span>
                  <h2
                    style={{
                      fontSize: '1.15rem',
                      fontWeight: 700,
                      color: 'var(--df-text-main)',
                      margin: 0,
                    }}
                  >
                    Rapports d’Inspection
                  </h2>
                </div>

                {/* FILTRE RAPIDE PAR ACTIF COURANT */}
                <button
                  type="button"
                  onClick={() => setFilterReportsByAsset(!filterReportsByAsset)}
                  style={{
                    padding: '0.3rem 0.65rem',
                    borderRadius: 'var(--df-radius-xs)',
                    fontSize: '0.72rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    border: '1px solid var(--df-border-subtle)',
                    background: filterReportsByAsset ? 'var(--df-accent-blue)' : 'var(--df-bg-surface-2)',
                    color: filterReportsByAsset ? '#ffffff' : 'var(--df-text-secondary)',
                  }}
                >
                  {filterReportsByAsset ? 'Filtré : Cet Actif' : 'Tous les Actifs'}
                </button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {displayedReports.length === 0 ? (
                  <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--df-text-muted)', fontSize: '0.85rem' }}>
                    Aucun rapport DVIR enregistré pour ce filtre.
                  </div>
                ) : (
                  displayedReports.map((report) => (
                    <div
                      key={report.id}
                      style={{
                        padding: '1rem 1.25rem',
                        borderRadius: 'var(--df-radius-md)',
                        background: report.hasCriticalFailures
                          ? 'linear-gradient(135deg, rgba(239, 68, 68, 0.12) 0%, var(--df-bg-surface-2) 100%)'
                          : 'var(--df-bg-surface-2)',
                        border: `1px solid ${
                          report.hasCriticalFailures
                            ? 'var(--df-status-danger)'
                            : 'var(--df-border-subtle)'
                        }`,
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '0.5rem',
                        boxShadow: report.hasCriticalFailures ? '0 0 16px rgba(239, 68, 68, 0.15)' : 'none',
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ fontWeight: 700, color: 'var(--df-text-main)', fontSize: '0.9rem' }}>
                          {report.assetName}
                        </div>
                        <Badge variant={report.isCompliant ? 'ok' : 'danger'}>
                          {report.isCompliant ? 'CONFORME (PASS)' : 'DÉFAUT CRITIQUE'}
                        </Badge>
                      </div>

                      <div
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          fontSize: '0.75rem',
                          color: 'var(--df-text-muted)',
                        }}
                      >
                        <span>Chauffeur : <strong style={{ color: 'var(--df-text-secondary)' }}>{report.driverName}</strong></span>
                        <span className="df-mono">
                          {new Date(report.submittedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>

                      <div style={{ fontSize: '0.75rem', color: 'var(--df-text-faint)' }}>
                        Relevé odomètre : <strong className="df-mono" style={{ color: 'var(--df-text-secondary)' }}>{report.odometerKm?.toLocaleString('fr-DZ')} km</strong>
                      </div>

                      {/* SIGNATURE TACTILE HORODATÉE DU RAPPORT */}
                      {report.signatureDataUrl && (
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            padding: '0.35rem 0.5rem',
                            background: 'var(--df-bg-surface-1)',
                            borderRadius: 'var(--df-radius-xs)',
                            border: '1px solid var(--df-border-subtle)',
                          }}
                        >
                          <span style={{ fontSize: '0.72rem', color: 'var(--df-accent-cyan)', fontWeight: 700 }}>
                            ✍️ Signature certifiée :
                          </span>
                          <img
                            src={report.signatureDataUrl}
                            alt="Signature conducteur"
                            style={{
                              height: '24px',
                              maxWidth: '90px',
                              objectFit: 'contain',
                              filter: 'contrast(120%)',
                            }}
                          />
                        </div>
                      )}

                      {/* PHOTOS DE PREUVE RATTACHÉES AUX ANOMALIES */}
                      {report.items?.some((i) => i.photoUrl) && (
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            flexWrap: 'wrap',
                            padding: '0.35rem 0.5rem',
                            background: 'var(--df-bg-surface-1)',
                            borderRadius: 'var(--df-radius-xs)',
                            border: '1px solid var(--df-border-subtle)',
                          }}
                        >
                          <span style={{ fontSize: '0.72rem', color: 'var(--df-text-secondary)', fontWeight: 700 }}>
                            📸 Preuves photos ({report.items.filter((i) => i.photoUrl).length}) :
                          </span>
                          <div style={{ display: 'flex', gap: '4px' }}>
                            {report.items
                              .filter((i) => i.photoUrl)
                              .map((item, idx) => (
                                <img
                                  key={idx}
                                  src={item.photoUrl}
                                  alt={item.label}
                                  title={`${item.label} : ${item.comment || ''}`}
                                  style={{
                                    width: '24px',
                                    height: '24px',
                                    borderRadius: '3px',
                                    objectFit: 'cover',
                                    border: '1px solid var(--df-border-medium)',
                                  }}
                                />
                              ))}
                          </div>
                        </div>
                      )}

                      {/* BLOCAGE CRITIQUE OU DÉCONSIGNATION ATELIER */}
                      {report.hasCriticalFailures && (
                        <div
                          style={{
                            background: 'var(--df-bg-surface-1)',
                            padding: '0.75rem',
                            borderRadius: 'var(--df-radius-sm)',
                            border: '1px solid var(--df-status-danger)',
                            fontSize: '0.78rem',
                            color: 'var(--df-status-danger)',
                            marginTop: '0.25rem',
                          }}
                        >
                          <div style={{ fontWeight: 800 }}>⛔ Interdiction immédiate de circulation</div>
                          {report.generatedWorkOrderId && (
                            <div style={{ marginTop: '0.25rem', color: 'var(--df-text-muted)' }}>
                              Ordre de Travail Atelier :{' '}
                              <span className="df-mono" style={{ color: 'var(--df-accent-cyan)', fontWeight: 700 }}>
                                {report.generatedWorkOrderId}
                              </span>
                            </div>
                          )}
                        </div>
                      )}

                      {/* ÉTAT DE RÉSOLUTION ATELIER SI DÉCONSIGNÉ */}
                      {report.resolvedAt && (
                        <div
                          style={{
                            background: 'var(--df-bg-surface-1)',
                            padding: '0.5rem 0.75rem',
                            borderRadius: 'var(--df-radius-sm)',
                            border: '1px solid var(--df-status-ok)',
                            fontSize: '0.75rem',
                            color: 'var(--df-status-ok)',
                          }}
                        >
                          <div style={{ fontWeight: 700 }}>
                            ✓ Consignation levée par l&apos;atelier ({report.resolvedByWorkOrderId || 'OT clôturé'})
                          </div>
                          {report.resolutionNotes && (
                            <div style={{ color: 'var(--df-text-muted)', fontSize: '0.7rem', marginTop: '0.15rem' }}>
                              Note : {report.resolutionNotes}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </Card>
          </div>
        </div>
      </main>
    </>
  );
}
