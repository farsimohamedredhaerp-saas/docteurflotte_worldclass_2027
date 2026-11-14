'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Navbar } from '@/components/navigation/Navbar';
import { Badge } from '@/components/Badge';
import { useDemoMode } from '@/context/DemoModeContext';
import { AssetClient } from '@/lib/api-assets';
import {
  DispatchDecisionResult,
  FleetIntelligenceClient,
  IndustrySector,
  ClimateZoneDZ,
  AssetCategory,
  LicenseCategoryDZ,
  RegulatoryMissionOrderData,
  VehicleStateDto,
  DriverStateDto,
  MissionRequestDto,
  DispatchStatus,
  DocumentTypeDZ,
} from '@/lib/api-fleet-intelligence';
import { PrintableMissionOrder } from '@/components/dispatch/PrintableMissionOrder';
import {
  IconFileText,
  IconCpu,
  IconCompass,
  IconTruck,
  IconLayers,
  IconAlertTriangle,
  IconThermometer,
  IconRefreshCw,
  IconZap,
  IconShieldCheck,
  IconSearch,
  IconCheckCircle,
  IconAlertOctagon,
  IconWrench,
  IconCheck,
} from '@/components/navigation/TechIcons';

export default function DispatchPage() {
  const { isDemoMode, isGuest, session } = useDemoMode();
  const [vehicles, setVehicles] = useState<VehicleStateDto[]>([]);
  const [drivers, setDrivers] = useState<DriverStateDto[]>([]);
  const [loadingFleet, setLoadingFleet] = useState<boolean>(false);

  const [selectedSector, setSelectedSector] = useState<IndustrySector>(IndustrySector.TRANSPORT);
  const [selectedVehicleId, setSelectedVehicleId] = useState<string>('');
  const [selectedDriverId, setSelectedDriverId] = useState<string>('');

  const [originName, setOriginName] = useState<string>('Plateforme Logistique Rouïba (Zone Industrielle)');
  const [originWilaya, setOriginWilaya] = useState<number>(16);
  const [destinationName, setDestinationName] = useState<string>('Base Logistique Hassi Messaoud (Base 24)');
  const [destinationWilaya, setDestinationWilaya] = useState<number>(30);
  const [transitWilayas, setTransitWilayas] = useState<string>('09, 28, 47'); // Blida, M'Sila, Ghardaïa

  const [cargoNature, setCargoNature] = useState<string>('Pièces de forage & tubes acier pétroliers');
  const [payloadTons, setPayloadTons] = useState<number>(24.5);
  const [routeKm, setRouteKm] = useState<number>(850);
  const [climateZone, setClimateZone] = useState<ClimateZoneDZ>(ClimateZoneDZ.SAHARA_SOUTH);

  const [requiresHazmat, setRequiresHazmat] = useState<boolean>(false);
  const [requiresReefer, setRequiresReefer] = useState<boolean>(false);

  // États du cycle de décision
  const [isEvaluating, setIsEvaluating] = useState<boolean>(false);
  const [decisionResult, setDecisionResult] = useState<DispatchDecisionResult | null>(null);
  const [activeMissionOrder, setActiveMissionOrder] = useState<RegulatoryMissionOrderData | null>(null);

  // État de vérification hors-ligne
  const [verifyQrText, setVerifyQrText] = useState<string>('');
  const [verifyTokenText, setVerifyTokenText] = useState<string>('');
  const [verificationOutput, setVerificationOutput] = useState<any>(null);

  useEffect(() => {
    if (isDemoMode) {
      setLoadingFleet(true);
      import('@/lib/simulation-sandbox')
        .then((sandbox) => {
          const mockVehicles = sandbox.getMockSandboxDispatchVehicles() as unknown as VehicleStateDto[];
          const mockDrivers = sandbox.MOCK_SANDBOX_DISPATCH_DRIVERS as unknown as DriverStateDto[];
          setVehicles(mockVehicles);
          setDrivers(mockDrivers);
          setSelectedVehicleId(mockVehicles[0]?.vehicleId || '');
          setSelectedDriverId(mockDrivers[0]?.driverId || '');
        })
        .finally(() => setLoadingFleet(false));
      return;
    }

    if (!session.token) {
      setVehicles([]);
      setDrivers([]);
      setSelectedVehicleId('');
      setSelectedDriverId('');
      return;
    }

    setLoadingFleet(true);
    AssetClient.listAssets(session.token)
      .then((assetsList) => {
        if (assetsList && assetsList.length > 0) {
          const mapped: VehicleStateDto[] = assetsList.map((a) => ({
            vehicleId: a.id,
            registrationPlate: a.code || 'DZ-PARC',
            makeModel: a.name || `${a.brand || ''} ${a.model || ''}`.trim() || 'Véhicule Flotte Actif',
            category: AssetCategory.TRACTOR_TRAILER,
            maxPayloadTons: 25.0,
            grossVehicleWeightTons: 38.0,
            fuelType: 'DIESEL',
            refConsumptionL100Km: 32.0,
            hasWorkingReefer: false,
            hasWorkingPto: true,
            currentWilayaCode: 16,
            currentLat: 36.75,
            currentLon: 3.05,
            currentOdometerKm: 100000,
            currentEngineHours: 3000,
            annualTargetKm: 80000,
            ytdDrivenKm: 45000,
            vehicleHealthIndex: 90.0,
            batterySohPct: 92.0,
            coolingEwmaResidualC: 2.0,
            dispatchStatus: DispatchStatus.AVAILABLE,
            documents: [],
            subsystemRuls: [],
            activeDtcs: [],
          }));
          setVehicles(mapped);
          setSelectedVehicleId(mapped[0]?.vehicleId || '');
        } else {
          setVehicles([]);
          setSelectedVehicleId('');
        }
      })
      .catch(() => {
        setVehicles([]);
        setSelectedVehicleId('');
      })
      .finally(() => setLoadingFleet(false));
  }, [isDemoMode, session.token]);

  const selectedVehicle = vehicles.find((v) => v.vehicleId === selectedVehicleId) || vehicles[0];
  const selectedDriver = drivers.find((d) => d.driverId === selectedDriverId) || drivers[0];

  const handleEvaluateDispatch = async () => {
    if (vehicles.length === 0 || !selectedVehicle) {
      alert("Aucun véhicule d'exploitation disponible pour l'évaluation de mission.");
      return;
    }

    setIsEvaluating(true);
    setDecisionResult(null);
    setActiveMissionOrder(null);

    const transits = transitWilayas
      .split(',')
      .map((s) => Number(s.trim()))
      .filter((n) => !isNaN(n) && n > 0);

    const currentTenantId = session.tenant?.id || 'tenant-default';
    const mission: MissionRequestDto = {
      missionId: `MIS-2026-${Date.now().toString().slice(-5)}`,
      tenantId: currentTenantId,
      industrySector: selectedSector,
      requestedVehicleId: selectedVehicleId,
      requestedDriverId: selectedDriverId,
      originName,
      originWilayaCode: originWilaya,
      originLat: 36.73,
      originLon: 3.28,
      destinationName,
      destinationWilayaCode: destinationWilaya,
      transitWilayaCodes: transits,
      plannedDepartureUtc: new Date().toISOString(),
      routeDistanceKm: routeKm,
      estimatedDrivingHours: Math.round((routeKm / 65) * 10) / 10,
      requiredPayloadTons: payloadTons,
      targetClimateZone: climateZone,
      requiresReeferColdChain: requiresReefer,
      requiresHazmatAdr: requiresHazmat,
      requiresPtoHydraulics: true,
    };

    try {
      const res = await FleetIntelligenceClient.evaluateAndAssign({
        mission,
        fleetVehicles: vehicles,
        fleetDrivers: drivers,
      });
      setDecisionResult(res);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      alert(`Erreur d'évaluation : ${msg || 'Échec réseau'}`);
    } finally {
      setIsEvaluating(false);
    }
  };

  const handleIssueMissionOrder = async () => {
    if (!decisionResult) return;

    const assignedVehId = decisionResult.assignedVehicleId || selectedVehicleId;
    const assignedDrvId = decisionResult.assignedDriverId || selectedDriverId;

    const v = vehicles.find((x) => x.vehicleId === assignedVehId) || selectedVehicle;
    const d = drivers.find((x) => x.driverId === assignedDrvId) || selectedDriver;

    const currentTenantId = session.tenant?.id || 'tenant-default';
    const mission: MissionRequestDto = {
      missionId: decisionResult.missionId,
      tenantId: currentTenantId,
      industrySector: selectedSector,
      requestedVehicleId: v.vehicleId,
      requestedDriverId: d.driverId,
      originName,
      originWilayaCode: originWilaya,
      originLat: 36.73,
      originLon: 3.28,
      destinationName,
      destinationWilayaCode: destinationWilaya,
      transitWilayaCodes: transitWilayas.split(',').map((s) => Number(s.trim())).filter((n) => !isNaN(n)),
      plannedDepartureUtc: decisionResult.recommendedEtdUtc || new Date().toISOString(),
      routeDistanceKm: routeKm,
      estimatedDrivingHours: Math.round((routeKm / 65) * 10) / 10,
      requiredPayloadTons: payloadTons,
      targetClimateZone: climateZone,
      requiresReeferColdChain: requiresReefer,
      requiresHazmatAdr: requiresHazmat,
      requiresPtoHydraulics: true,
    };

    try {
      const order = await FleetIntelligenceClient.issueMissionOrder({
        mission,
        vehicle: v,
        driver: d,
        companyInfo: {
          legalName: 'SOCIÉTÉ ALGÉRIENNE DE TRANSPORT & LOGISTIQUE EURL',
          tradeName: 'ALGERIA FLEET LOGISTICS',
          nif: '001616012345678',
          nis: '00161601234',
          rcNumber: '16/00-1234567B22',
          aiNumber: '16012345678',
          headquartersWilayaCode: 16,
          headquartersWilayaName: 'Alger',
        },
      });
      setActiveMissionOrder(order);
      setVerifyQrText(order.qrVerificationPayload);
      setVerifyTokenText(order.offlineSignatureToken);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      alert(`Impossible d'émettre l'Ordre de Mission : ${msg}`);
    }
  };

  const handleVerifyOfflineOrder = async () => {
    if (!verifyQrText) return;
    const res = await FleetIntelligenceClient.verifyMissionOrder({
      qrPayload: verifyQrText,
      signatureToken: verifyTokenText || 'DUMMY_TOKEN',
    });
    setVerificationOutput(res);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 dark:bg-[#090D16] dark:text-slate-100 transition-colors duration-150">
      {/* 1. BARRE DE NAVIGATION SUPÉRIEURE UNIFIÉE */}
      <Navbar />

      <main className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 pt-2 pb-16">
        {/* 2. HEADER DU COCKPIT DE DISPATCH */}
        <section className="mb-6 rounded-2xl border border-slate-200/90 dark:border-slate-800/80 bg-white/95 dark:bg-[#111827] p-5 sm:p-6 shadow-2xs">
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-5">
            <div>
              <div className="flex items-center gap-2 mb-2 flex-wrap">
                <Badge variant="ok" pulse>
                  Gate DZ Opposable
                </Badge>
                <span className="text-slate-300 dark:text-slate-700" aria-hidden="true">•</span>
                <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Code de la Route (Loi 01-14 / Décret 04-415) • Signature Ed25519
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-slate-50 mb-2">
                Cockpit de Dispatch & Ordres de Mission Réglementaires (OM)
              </h1>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed max-w-3xl">
                Machine à états stricte validant en temps réel les 4 portes réglementaires (Véhicule, Chauffeur, Trajet 58 Wilayas, Cargaison) et génération de jetons QR cryptographiques opposables hors-ligne.
              </p>
            </div>

            <div className="flex items-center gap-2.5 flex-wrap shrink-0">
              <Link
                href="/preventive"
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold border border-slate-200 dark:border-slate-700/80 transition-colors"
              >
                <IconCpu size={14} className="text-indigo-500" />
                <span>Cockpit Maintenance</span>
              </Link>
              <Link
                href="/compliance"
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs transition-colors"
              >
                <IconShieldCheck size={14} />
                <span>Portail Conformité DZ</span>
              </Link>
            </div>
          </div>
        </section>

        {/* MODALE D'ORDRE DE MISSION IMPRIMABLE */}
        {activeMissionOrder && (
          <div className="mb-6">
            <PrintableMissionOrder order={activeMissionOrder} onClose={() => setActiveMissionOrder(null)} />
          </div>
        )}

        {/* BANNIÈRE PARC VIERGE (EMPTY STATE) */}
        {vehicles.length === 0 && !loadingFleet && (
          <div className="mb-6 rounded-2xl border border-blue-500/30 bg-blue-50/70 dark:bg-blue-950/20 p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-2xs">
            <div className="max-w-2xl">
              <div className="flex items-center gap-2 mb-1.5">
                <IconTruck size={18} className="text-blue-600 dark:text-blue-400" />
                <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                  Votre parc d&apos;exploitation est vierge
                </h3>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                Aucun véhicule n&apos;est enregistré dans votre organisation. Pour planifier un ordre de mission réglementaire, ajoutez un véhicule dans l&apos;inventaire ou activez le mode démo.
              </p>
            </div>
            <Link
              href="/assets"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs transition-colors shrink-0"
            >
              + Ajouter un véhicule
            </Link>
          </div>
        )}

        {/* GRILLE PRINCIPALE : FORMULAIRE DE MISSION & RÉSULTAT DÉCISIONNEL */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* COLONNE GAUCHE : FORMULAIRE INTELLIGENT DE MISSION (5 COLS) */}
          <div className="lg:col-span-5 rounded-2xl border border-slate-200/90 dark:border-slate-800/80 bg-white/95 dark:bg-[#111827] p-5 sm:p-6 shadow-2xs">
            <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100 mb-4 flex items-center gap-2">
              <IconLayers size={16} className="text-blue-500" />
              <span>Paramètres de la Mission de Transport</span>
            </h2>

            <div className="space-y-4">
              {/* SECTEUR INDUSTRIEL */}
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
                  Secteur d&apos;Activité
                </label>
                <select
                  value={selectedSector}
                  onChange={(e) => setSelectedSector(e.target.value as IndustrySector)}
                  className="w-full px-3 py-2 text-xs font-semibold rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all"
                >
                  <option value={IndustrySector.TRANSPORT}>Transport Routier & Fret Général</option>
                  <option value={IndustrySector.BTP}>BTPH & Chantiers de Terrassement</option>
                  <option value={IndustrySector.LOGISTICS}>Logistique & Distribution Urbaine</option>
                  <option value={IndustrySector.COLD_CHAIN}>Chaîne du Froid & Pharmacie (ATP)</option>
                  <option value={IndustrySector.AGRICULTURE}>Agriculture & Transport Céréalier</option>
                </select>
              </div>

              {/* VÉHICULE & CHAUFFEUR */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
                    Véhicule {loadingFleet ? '(Chargement...)' : ''}
                  </label>
                  <select
                    value={selectedVehicleId}
                    onChange={(e) => setSelectedVehicleId(e.target.value)}
                    disabled={loadingFleet || vehicles.length === 0}
                    className="w-full px-3 py-2 text-xs font-semibold rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all disabled:opacity-50"
                  >
                    {vehicles.length === 0 ? (
                      <option value="">Aucun véhicule</option>
                    ) : (
                      vehicles.map((v) => (
                        <option key={v.vehicleId} value={v.vehicleId}>
                          {v.registrationPlate} — VHI {v.vehicleHealthIndex}%
                        </option>
                      ))
                    )}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
                    Conducteur
                  </label>
                  <select
                    value={selectedDriverId}
                    onChange={(e) => setSelectedDriverId(e.target.value)}
                    disabled={drivers.length === 0}
                    className="w-full px-3 py-2 text-xs font-semibold rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all disabled:opacity-50"
                  >
                    {drivers.length === 0 ? (
                      <option value="">Aucun conducteur</option>
                    ) : (
                      drivers.map((d) => (
                        <option key={d.driverId} value={d.driverId}>
                          {d.fullName} ({d.licenseCategories.join('+')})
                        </option>
                      ))
                    )}
                  </select>
                </div>
              </div>

              {/* ITINÉRAIRE (58 WILAYAS) */}
              <div className="pt-3 border-t border-slate-200/80 dark:border-slate-800 space-y-3">
                <div className="text-xs font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                  <IconCompass size={14} className="text-emerald-500" />
                  <span>Itinéraire National (58 Wilayas)</span>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div className="col-span-2">
                    <label className="block text-[10.5px] font-medium text-slate-500 dark:text-slate-400 mb-1">
                      Origine (Départ)
                    </label>
                    <input
                      type="text"
                      value={originName}
                      onChange={(e) => setOriginName(e.target.value)}
                      className="w-full px-3 py-1.5 text-xs font-medium rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                    />
                  </div>
                  <div>
                    <label className="block text-[10.5px] font-medium text-slate-500 dark:text-slate-400 mb-1">
                      Wilaya
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="58"
                      value={originWilaya}
                      onChange={(e) => setOriginWilaya(Number(e.target.value))}
                      className="w-full px-2.5 py-1.5 text-xs font-mono font-bold rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500/30 text-center"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div className="col-span-2">
                    <label className="block text-[10.5px] font-medium text-slate-500 dark:text-slate-400 mb-1">
                      Destination (Arrivée)
                    </label>
                    <input
                      type="text"
                      value={destinationName}
                      onChange={(e) => setDestinationName(e.target.value)}
                      className="w-full px-3 py-1.5 text-xs font-medium rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                    />
                  </div>
                  <div>
                    <label className="block text-[10.5px] font-medium text-slate-500 dark:text-slate-400 mb-1">
                      Wilaya
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="58"
                      value={destinationWilaya}
                      onChange={(e) => setDestinationWilaya(Number(e.target.value))}
                      className="w-full px-2.5 py-1.5 text-xs font-mono font-bold rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500/30 text-center"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10.5px] font-medium text-slate-500 dark:text-slate-400 mb-1">
                    Wilayas de Transit Autorisées
                  </label>
                  <input
                    type="text"
                    value={transitWilayas}
                    onChange={(e) => setTransitWilayas(e.target.value)}
                    placeholder="Ex: 09, 28, 47"
                    className="w-full px-3 py-1.5 text-xs font-mono rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                  />
                </div>
              </div>

              {/* CARGAISON & EXIGENCES */}
              <div className="pt-3 border-t border-slate-200/80 dark:border-slate-800 space-y-3">
                <div className="grid grid-cols-3 gap-2">
                  <div className="col-span-1">
                    <label className="block text-[10.5px] font-medium text-slate-500 dark:text-slate-400 mb-1">
                      Cargaison
                    </label>
                    <input
                      type="text"
                      value={cargoNature}
                      onChange={(e) => setCargoNature(e.target.value)}
                      className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                    />
                  </div>
                  <div>
                    <label className="block text-[10.5px] font-medium text-slate-500 dark:text-slate-400 mb-1">
                      Charge (T)
                    </label>
                    <input
                      type="number"
                      step="0.5"
                      value={payloadTons}
                      onChange={(e) => setPayloadTons(Number(e.target.value))}
                      className="w-full px-2.5 py-1.5 text-xs font-mono font-bold rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500/30 text-center"
                    />
                  </div>
                  <div>
                    <label className="block text-[10.5px] font-medium text-slate-500 dark:text-slate-400 mb-1">
                      Distance (km)
                    </label>
                    <input
                      type="number"
                      value={routeKm}
                      onChange={(e) => setRouteKm(Number(e.target.value))}
                      className="w-full px-2.5 py-1.5 text-xs font-mono font-bold rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500/30 text-center"
                    />
                  </div>
                </div>

                {/* CLIMAT & EXIGENCES SPÉCIALES */}
                <div className="flex items-center gap-4 flex-wrap pt-1">
                  <label className="inline-flex items-center gap-2 text-xs font-medium cursor-pointer text-slate-700 dark:text-slate-300">
                    <input
                      type="checkbox"
                      checked={requiresHazmat}
                      onChange={(e) => setRequiresHazmat(e.target.checked)}
                      className="rounded border-slate-300 text-rose-600 focus:ring-rose-500 h-3.5 w-3.5"
                    />
                    <span className="flex items-center gap-1">
                      <IconAlertTriangle size={13} className="text-rose-500" />
                      <span>HAZMAT / ADR</span>
                    </span>
                  </label>

                  <label className="inline-flex items-center gap-2 text-xs font-medium cursor-pointer text-slate-700 dark:text-slate-300">
                    <input
                      type="checkbox"
                      checked={requiresReefer}
                      onChange={(e) => setRequiresReefer(e.target.checked)}
                      className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 h-3.5 w-3.5"
                    />
                    <span className="flex items-center gap-1">
                      <IconThermometer size={13} className="text-blue-500" />
                      <span>Frigo / ATP</span>
                    </span>
                  </label>
                </div>
              </div>

              {/* BOUTON D'ÉVALUATION PRINCIPAL */}
              <div className="pt-2">
                <button
                  type="button"
                  onClick={handleEvaluateDispatch}
                  disabled={isEvaluating || vehicles.length === 0}
                  className="w-full py-2.5 px-4 rounded-xl font-bold text-xs bg-blue-600 hover:bg-blue-700 text-white shadow-xs transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {isEvaluating ? (
                    <IconRefreshCw size={14} className="animate-spin" />
                  ) : (
                    <IconZap size={14} />
                  )}
                  <span>
                    {isEvaluating
                      ? 'Évaluation des 4 Portes Réglementaires...'
                      : vehicles.length === 0
                        ? 'Aucun véhicule disponible'
                        : 'Évaluer Éligibilité Réglementaire (Gate DZ)'}
                  </span>
                </button>
              </div>
            </div>
          </div>

          {/* COLONNE DROITE : RÉSULTAT DÉCISIONNEL & VERDICT (7 COLS) */}
          <div className="lg:col-span-7 space-y-6">
            {decisionResult ? (
              <div className="rounded-2xl border border-slate-200/90 dark:border-slate-800/80 bg-white/95 dark:bg-[#111827] p-5 sm:p-6 shadow-2xs">
                {/* BANDEAU DE STATUT */}
                <div className="flex items-center justify-between gap-3 mb-4 flex-wrap">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    Verdict du Moteur Décisionnel (Gate DZ)
                  </span>
                  <span
                    className={`text-xs font-bold px-3 py-1 rounded-full ${
                      decisionResult.decisionOutcome === 'APPROVED_AS_REQUESTED'
                        ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60'
                        : decisionResult.decisionOutcome === 'SUBSTITUTED_AUTOMATICALLY'
                          ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800/60'
                          : 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800/60'
                    }`}
                  >
                    {decisionResult.decisionOutcome === 'APPROVED_AS_REQUESTED' && 'MISSION APPROUVÉE CONFORME'}
                    {decisionResult.decisionOutcome === 'APPROVED_WITH_ETD_OR_ROUTE_SHIFT' && 'APPROUVÉ AVEC DÉCALAGE HORAIRE'}
                    {decisionResult.decisionOutcome === 'SUBSTITUTED_AUTOMATICALLY' && 'SUBSTITUTION AUTOMATIQUE TOPSIS'}
                    {decisionResult.decisionOutcome === 'REJECTED_NO_ELIGIBLE_ASSET' && 'MISSION REJETÉE SANS ACTIF VALIDE'}
                  </span>
                </div>

                {/* DÉTAIL DES ACTIFS AFFECTÉS */}
                <div className="p-4 rounded-xl bg-slate-50 dark:bg-[#161F30] border border-slate-200/90 dark:border-[#1F2937] mb-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="text-[11px] font-medium text-slate-500 dark:text-slate-400">Véhicule Assigné :</div>
                      <div className="font-mono text-base font-bold text-slate-900 dark:text-slate-100 mt-0.5">
                        {decisionResult.assignedRegistrationPlate || 'Aucun'}
                      </div>
                    </div>
                    <div>
                      <div className="text-[11px] font-medium text-slate-500 dark:text-slate-400">Conducteur Autorisé :</div>
                      <div className="text-base font-bold text-slate-900 dark:text-slate-100 mt-0.5">
                        {decisionResult.assignedDriverName || 'Aucun'}
                      </div>
                    </div>
                  </div>

                  {decisionResult.routeAdvisoryNotes && decisionResult.routeAdvisoryNotes.length > 0 && (
                    <div className="mt-3 pt-2.5 border-t border-slate-200/80 dark:border-slate-800 text-xs text-blue-600 dark:text-blue-400">
                      Avis Routier : {decisionResult.routeAdvisoryNotes.join(' • ')}
                    </div>
                  )}
                </div>

                {/* VIOLATIONS & BLOCAGES DÉTECTÉS */}
                {decisionResult.violationsDetected && decisionResult.violationsDetected.length > 0 && (
                  <div className="mb-4">
                    <div className="text-xs font-bold text-rose-600 dark:text-rose-400 mb-2 flex items-center gap-1.5">
                      <IconAlertOctagon size={14} />
                      <span>Violations Réglementaires Bloquantes :</span>
                    </div>
                    <div className="space-y-1.5">
                      {decisionResult.violationsDetected.map((v, i) => (
                        <div
                          key={i}
                          className="p-2.5 rounded-lg bg-rose-50/70 dark:bg-rose-950/25 border border-rose-200/70 dark:border-rose-800/40 text-xs text-rose-700 dark:text-rose-300"
                        >
                          <strong>[{v.gate}]</strong> {v.messageFr}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* SUBSTITUTIONS TOPSIS RECOMMANDÉES */}
                {decisionResult.rankedSubstitutions && decisionResult.rankedSubstitutions.length > 0 && (
                  <div className="mb-4">
                    <div className="text-xs font-bold text-blue-600 dark:text-blue-400 mb-2 flex items-center gap-1.5">
                      <IconRefreshCw size={14} />
                      <span>Classement TOPSIS des Véhicules de Substitution :</span>
                    </div>
                    <div className="space-y-2">
                      {decisionResult.rankedSubstitutions.slice(0, 2).map((sub, i) => (
                        <div
                          key={i}
                          className="p-3 rounded-lg bg-slate-50 dark:bg-[#161F30] border border-slate-200/80 dark:border-[#1F2937]"
                        >
                          <div className="flex items-center justify-between gap-2 mb-1">
                            <strong className="text-xs text-slate-900 dark:text-slate-100">
                              #{i + 1} — {sub.registrationPlate} ({sub.makeModel})
                            </strong>
                            <span className="font-mono text-xs font-bold text-blue-600 dark:text-blue-400">
                              Score TOPSIS : {sub.totalScore100}/100
                            </span>
                          </div>
                          <div className="text-[11.5px] text-slate-500 dark:text-slate-400">
                            {sub.auditJustification} • Carburant estimé :{' '}
                            <strong className="font-mono text-slate-700 dark:text-slate-300">
                              {sub.estimatedFuelCostDzd.toLocaleString('fr-DZ')} DZD
                            </strong>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* BOUTON D'ÉMISSION OFFICIEL DE L'ORDRE DE MISSION */}
                {(decisionResult.decisionOutcome === 'APPROVED_AS_REQUESTED' ||
                  decisionResult.decisionOutcome === 'APPROVED_WITH_ETD_OR_ROUTE_SHIFT' ||
                  decisionResult.decisionOutcome === 'SUBSTITUTED_AUTOMATICALLY') && (
                  <button
                    onClick={handleIssueMissionOrder}
                    className="w-full py-3 px-4 rounded-xl font-bold text-xs bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs transition-colors flex items-center justify-center gap-2"
                  >
                    <IconFileText size={16} />
                    <span>Générer l&apos;Ordre de Mission Officiel Bilingue (FR/AR) & QR Ed25519</span>
                  </button>
                )}
              </div>
            ) : (
              <div className="rounded-2xl border border-dashed border-slate-300 dark:border-slate-800 bg-white/50 dark:bg-[#111827]/50 p-8 text-center">
                <div className="w-12 h-12 rounded-full bg-blue-50 dark:bg-blue-950/40 text-blue-500 flex items-center justify-center mx-auto mb-3">
                  <IconShieldCheck size={24} />
                </div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 mb-1">
                  En Attente d&apos;Évaluation Réglementaire
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto leading-relaxed">
                  Renseignez les paramètres de la mission à gauche puis cliquez sur <strong>Évaluer Éligibilité Réglementaire</strong> pour exécuter la machine à états et contrôler les 4 portes de conformité.
                </p>
              </div>
            )}

            {/* VÉRIFICATEUR HORS-LIGNE POUR LA GENDARMERIE / DGSN */}
            <div className="rounded-2xl border border-slate-200/90 dark:border-slate-800/80 bg-white/95 dark:bg-[#111827] p-5 sm:p-6 shadow-2xs">
              <div className="flex items-center gap-2 mb-2">
                <IconShieldCheck size={16} className="text-blue-500" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-slate-100">
                  Vérificateur Hors-Ligne (Contrôle Routier Gendarmerie / DGSN)
                </h3>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-3.5">
                Testez la validation cryptographique sans accès Internet (Mode 100% hors-ligne dans le Grand Sud) :
              </p>

              <div className="space-y-3">
                <div>
                  <label className="block text-[10.5px] font-medium text-slate-500 dark:text-slate-400 mb-1">
                    Chaîne lue par scan QR (Format DZOM) :
                  </label>
                  <input
                    type="text"
                    value={verifyQrText}
                    onChange={(e) => setVerifyQrText(e.target.value)}
                    placeholder="DZOM|OM-2026-161234|01492-319-16|198516012345678901|16|30|2026-11-04|FRET"
                    className="w-full px-3 py-1.5 text-xs font-mono rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                  />
                </div>

                <div>
                  <label className="block text-[10.5px] font-medium text-slate-500 dark:text-slate-400 mb-1">
                    Jeton de signature numérique Ed25519 :
                  </label>
                  <input
                    type="text"
                    value={verifyTokenText}
                    onChange={(e) => setVerifyTokenText(e.target.value)}
                    placeholder="ED25519-SIG-..."
                    className="w-full px-3 py-1.5 text-xs font-mono rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                  />
                </div>

                <button
                  type="button"
                  onClick={handleVerifyOfflineOrder}
                  className="w-full py-2 px-3 rounded-lg text-xs font-semibold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 transition-colors flex items-center justify-center gap-1.5"
                >
                  <IconSearch size={13} />
                  <span>Vérifier l&apos;Authenticité Hors-Ligne</span>
                </button>

                {verificationOutput && (
                  <div
                    className={`p-3 rounded-xl border text-xs ${
                      verificationOutput.isValid
                        ? 'bg-emerald-50/70 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800/50 text-emerald-800 dark:text-emerald-300'
                        : 'bg-rose-50/70 dark:bg-rose-950/20 border-rose-200 dark:border-rose-800/50 text-rose-800 dark:text-rose-300'
                    }`}
                  >
                    <div className="font-bold flex items-center gap-1.5 mb-1">
                      {verificationOutput.isValid ? (
                        <>
                          <IconCheck size={14} className="text-emerald-600" />
                          <span>ORDRE DE MISSION AUTHENTIQUE & VALIDE</span>
                        </>
                      ) : (
                        <>
                          <IconAlertOctagon size={14} className="text-rose-600" />
                          <span>INVALIDITÉ : {verificationOutput.reason}</span>
                        </>
                      )}
                    </div>
                    {verificationOutput.decodedOrder && (
                      <div className="text-[11px] opacity-80 leading-relaxed font-mono">
                        Ordre : {verificationOutput.decodedOrder.orderNumber} • Véhicule : {verificationOutput.decodedOrder.registrationPlate} • Validité : {verificationOutput.decodedOrder.validUntil}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
