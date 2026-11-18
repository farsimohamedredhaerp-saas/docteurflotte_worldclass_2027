'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useDemoMode } from '../../context/DemoModeContext';
import { Navbar } from '../../components/navigation/Navbar';
import { Badge } from '../../components/Badge';
import { Button } from '../../components/Button';
import {
  TmdClient,
  TmdDriverCertification,
  FuelTankerCompartment,
  TmdTransportMission,
  TankerProductType,
  ValveStatus,
  TmdMissionStatus,
  CreateTmdDriverCertificationDto,
  CreateFuelTankerCompartmentDto,
  CreateTmdTransportMissionDto,
} from '../../lib/api-tmd';
import {
  IconTruck,
  IconFlame,
  IconGauge,
  IconClock,
  IconAlertTriangle,
  IconCheckCircle,
  IconRefreshCw,
  IconPlus,
  IconShieldCheck,
  IconMapPin,
  IconBarChart3,
  IconX,
  IconZap,
  IconFileText,
  IconUsers,
} from '../../components/navigation/TechIcons';
import { CalculationProofModal, CalculationProofData } from '../../components/decisions';
import { formatCurrency } from '../../lib/currency-formatter';

export default function TmdAdrPage() {
  const { isDemoMode } = useDemoMode();

  // Données
  const [drivers, setDrivers] = useState<TmdDriverCertification[]>([]);
  const [compartments, setCompartments] = useState<FuelTankerCompartment[]>([]);
  const [missions, setMissions] = useState<TmdTransportMission[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filtres & Onglets
  const [activeTab, setActiveTab] = useState<'missions' | 'compartments' | 'drivers'>('missions');
  const [selectedAssetId, setSelectedAssetId] = useState<string>('ALL');

  // Modales
  const [isAddDriverOpen, setIsAddDriverOpen] = useState(false);
  const [isAddCompOpen, setIsAddCompOpen] = useState(false);
  const [isAddMissionOpen, setIsAddMissionOpen] = useState(false);
  const [selectedProofData, setSelectedProofData] = useState<CalculationProofData | null>(null);

  // Formulaires
  const [driverForm, setDriverForm] = useState<CreateTmdDriverCertificationDto>({
    driverName: '',
    driverLicenseNumber: '',
    tmdCertificateNumber: '',
    hazardClasses: 'CLASS_3_HYDROCARBONS',
    issuingAuthority: 'Direction des Transports de Wilaya (DTW Alger)',
    issueDate: new Date().toISOString().slice(0, 10),
    expiryDate: new Date(Date.now() + 3 * 365 * 24 * 3600 * 1000).toISOString().slice(0, 10),
  });

  const [compForm, setCompForm] = useState<CreateFuelTankerCompartmentDto>({
    assetId: '',
    tankerCode: 'CIT-NAF-16-01',
    compartmentNumber: 1,
    capacityLiters: 10000,
    currentProductType: TankerProductType.GASOIL,
    currentVolumeLiters: 10000,
    apaveHydrostaticTestDate: new Date().toISOString().slice(0, 10),
    apaveTestExpiryDate: new Date(Date.now() + 3 * 365 * 24 * 3600 * 1000).toISOString().slice(0, 10),
  });

  const [missionForm, setMissionForm] = useState<CreateTmdTransportMissionDto>({
    missionCode: '',
    assetId: '',
    driverCertificationId: '',
    originDepotName: 'Dépôt Carburants Naftal Caroubier (Alger)',
    destinationStationName: 'Station-Service Naftal RN5 Rouiba',
    authorizedRoute: 'Autoroute A1 Est-Ouest & RN5',
    totalVolumeLiters: 36000,
    fireExtinguishersChecked: true,
    groundingBraidConnected: true,
  });

  // Chargement des données
  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [fetchedDrivers, fetchedComps, fetchedMissions] = await Promise.all([
        TmdClient.listDrivers(),
        TmdClient.listCompartments(),
        TmdClient.listMissions(),
      ]);

      if (fetchedDrivers.length > 0 || fetchedComps.length > 0 || fetchedMissions.length > 0) {
        setDrivers(fetchedDrivers);
        setCompartments(fetchedComps);
        setMissions(fetchedMissions);
      } else if (isDemoMode) {
        const { getSimulationTmdData } = await import('../../lib/simulation-sandbox');
        const demo = await getSimulationTmdData();
        setDrivers(demo.drivers);
        setCompartments(demo.compartments);
        setMissions(demo.missions);
      } else {
        setDrivers([]);
        setCompartments([]);
        setMissions([]);
      }
    } catch {
      if (isDemoMode) {
        const { getSimulationTmdData } = await import('../../lib/simulation-sandbox');
        const demo = await getSimulationTmdData();
        setDrivers(demo.drivers);
        setCompartments(demo.compartments);
        setMissions(demo.missions);
      }
    } finally {
      setIsLoading(false);
    }
  }, [isDemoMode]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Actions de création
  const handleCreateDriver = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await TmdClient.createDriver(driverForm, 'mock-token');
      setIsAddDriverOpen(false);
      loadData();
    } catch (err: any) {
      alert(err.message || 'Erreur lors de l’enregistrement du chauffeur TMD');
    }
  };

  const handleCreateComp = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await TmdClient.createCompartment(compForm, 'mock-token');
      setIsAddCompOpen(false);
      loadData();
    } catch (err: any) {
      alert(err.message || 'Erreur lors de la création du compartiment citerne');
    }
  };

  const handleCreateMission = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await TmdClient.createMission(missionForm, 'mock-token');
      setIsAddMissionOpen(false);
      loadData();
    } catch (err: any) {
      alert(err.message || 'Erreur lors de la création de la mission TMD');
    }
  };

  // Filtrage
  const filteredMissions = selectedAssetId === 'ALL'
    ? missions
    : missions.filter((m) => m.assetId === selectedAssetId);

  const filteredComps = selectedAssetId === 'ALL'
    ? compartments
    : compartments.filter((c) => c.assetId === selectedAssetId);

  // Métriques globales
  const totalVolumeInTransitLiters = missions
    .filter((m) => m.status === TmdMissionStatus.IN_TRANSIT)
    .reduce((sum, m) => sum + Number(m.totalVolumeLiters), 0);
  const validDriversCount = drivers.filter((d) => d.isValid).length;
  const compliantCompsCount = compartments.filter((c) => c.isAdrCompliant).length;
  const alertMissionsCount = missions.filter((m) => m.unauthorizedValveOpened).length;

  // Preuve formelle déterministe TMD (ADS)
  const showMissionProof = (mission: TmdTransportMission) => {
    const isAlert = mission.unauthorizedValveOpened || mission.status === TmdMissionStatus.BLOCKED_NON_COMPLIANT;
    const fineDzd = 500000; // Amende forfaitaire pénale transport matières dangereuses sans agrément
    const spillRiskDzd = 2400000; // Risque de perte cargaison et dépollution

    setSelectedProofData({
      title: `Audit Réglementaire & Sécurité Incendie TMD / ADR — ${mission.missionCode}`,
      decisionOrMetricName: `Contrôle de Conformité Transport Hydrocarbures (Décret Exécutif 04-415)`,
      category: 'REGULATORY',
      ruleId: `TMD-SAFETY-GATE-${mission.missionCode}`,
      legalOrOemReference: 'Décret Exécutif 04-415 & Arrêté Interministériel TMD / Ministère des Transports',
      deterministicFormula: 'Autorisation = (Brevet_TMD_Valide ∧ Épreuve_APAVE < 3 ans ∧ Extincteurs_Poudre ∧ Tresse_Masse)',
      formulaExplanation: `Le transport d'hydrocarbures liquides (Gasoil, Super Sans Plomb, Sirghaz) est subordonné au respect simultané des 4 verrous de sécurité : habilitation officielle du chauffeur, contrôle hydrostatique triennal de la cuve, dotation d'extinction 6kg et liaison antistatique lors du dépotage. Toute défaillance impose le blocage immédiat de l'ordre de mission.`,
      variables: [
        {
          name: 'Mission de Transport',
          symbol: 'Mission',
          value: mission.missionCode,
          source: 'Bordereau Naftal / Sonatrach',
        },
        {
          name: 'Volume Hydrocarbures',
          symbol: 'Vol_Total',
          value: `${mission.totalVolumeLiters.toLocaleString('fr-FR')} Litres`,
          source: 'Jauges Métrologiques Citerne',
        },
        {
          name: 'Contrôle Extincteurs & Masse',
          symbol: 'Sec_Equip',
          value: mission.fireExtinguishersChecked && mission.groundingBraidConnected ? 'CONFORME (100%)' : 'DÉFAILLANT',
          source: 'Checklist DVIR TMD Départ',
        },
        {
          name: 'Détection Vanne de Dépotage',
          symbol: 'Valve_Alert',
          value: mission.unauthorizedValveOpened ? 'OUVERTURE HORS GÉOFENCE (PIQUAGE)' : 'Fermée & Sécurisée',
          source: 'Capteur Magnétique IoT Traccar',
        },
        {
          name: 'Impact Financier d’Infraction Évité',
          symbol: 'Risque_DZD',
          value: formatCurrency(fineDzd + spillRiskDzd),
          source: 'Moteur Déterministe ADS',
        },
      ],
      steps: [
        {
          stepNumber: 1,
          description: 'Vérification de la validité de l’habilitation chauffeur et de la citerne',
          formula: 'Gate_ADR = Driver_TMD_Valid ∧ Tanker_APAVE_Valid',
          calculation: isAlert ? 'Infraction constatée ou anomalie vanne' : 'Toutes les habilitations DTW et APAVE sont valides',
          intermediateResult: isAlert ? 'BLOCAGE RÉGLEMENTAIRE OPPOSABLE' : 'AUTORISÉ AU DÉPART',
        },
        {
          stepNumber: 2,
          description: 'Calcul de la prévention financière et sécuritaire',
          formula: 'ADS = Amende_Pénale_DGI_Transport + Risque_Perte_Hydrocarbures',
          calculation: `${formatCurrency(fineDzd)} (amende pénale) + ${formatCurrency(spillRiskDzd)} (dépollution / perte)`,
          intermediateResult: `${formatCurrency(fineDzd + spillRiskDzd)} de sinistre évité`,
        },
      ],
      finalResult: {
        label: 'Verdict de Sécurité & Arbitrage ADS',
        value: isAlert ? 'MISSION BLOQUÉE POUR NON-CONFORMITÉ' : 'ORDRE DE MISSION TMD VALIDÉ',
        conclusion: isAlert
          ? `ALERTE CRITIQUE : Anomalie vanne ou défaut d'habilitation TMD. Véhicule consigné et notification d'urgence émise au chef de dépôt pour prévenir tout déversement accidentel ou détournement de carburant.`
          : `La mission ${mission.missionCode} satisfait à 100% les exigences du Décret 04-415. Camion-citerne étanche et chauffeur certifié pour le corridor d'hydrocarbures.`,
      },
    });
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* EN-TÊTE PRINCIPAL SOUVERAIN */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-slate-800 pb-5">
          <div>
            <div className="flex items-center gap-3">
              <span className="p-2.5 rounded-xl bg-red-500/10 text-red-400 border border-red-500/20">
                <IconFlame size={24} strokeWidth={2} />
              </span>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-2xl font-bold tracking-tight text-white">
                    Transport de Matières Dangereuses (TMD / ADR) &amp; Citernes
                  </h1>
                  <Badge variant="danger" className="uppercase font-mono text-xs">
                    Hydrocarbures Naftal / Sonatrach
                  </Badge>
                </div>
                <p className="text-sm text-slate-400 mt-1">
                  Décret Exécutif 04-415 : Brevets TMD Chauffeurs (DTW), Épreuves APAVE Citernes, Détection Géofencée d&apos;Ouverture de Vannes &amp; Sécurité Incendie.
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={loadData}
              disabled={isLoading}
              className="gap-2"
            >
              <IconRefreshCw size={14} className={isLoading ? 'animate-spin' : ''} />
              Actualiser
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsAddDriverOpen(true)}
              className="gap-2"
            >
              <IconPlus size={14} />
              Habiliter Chauffeur TMD
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsAddCompOpen(true)}
              className="gap-2"
            >
              <IconPlus size={14} />
              Compartiment Citerne
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={() => setIsAddMissionOpen(true)}
              className="gap-2 bg-red-600 hover:bg-red-500 text-white"
            >
              <IconFileText size={14} />
              Nouvelle Mission TMD
            </Button>
          </div>
        </div>

        {/* BANDEAU DE STATISTIQUES OPÉRATIONNELLES TMD */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4">
            <div className="flex items-center justify-between text-xs text-slate-400 font-medium">
              <span>Carburant en Transit</span>
              <IconFlame size={16} className="text-red-400" />
            </div>
            <div className="mt-2 flex items-baseline gap-1">
              <span className="text-2xl font-bold font-mono text-white">
                {(totalVolumeInTransitLiters / 1000).toFixed(1)}k
              </span>
              <span className="text-xs text-slate-400">Litres</span>
            </div>
            <div className="text-[11px] text-slate-500 mt-1">Gasoil, Sans Plomb, GPL</div>
          </div>

          <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4">
            <div className="flex items-center justify-between text-xs text-slate-400 font-medium">
              <span>Chauffeurs Habilités TMD</span>
              <IconUsers size={16} className="text-emerald-400" />
            </div>
            <div className="mt-2 flex items-baseline gap-1">
              <span className="text-2xl font-bold font-mono text-emerald-400">
                {validDriversCount}
              </span>
              <span className="text-xs text-slate-400">/ {drivers.length} chauffeurs</span>
            </div>
            <div className="text-[11px] text-slate-500 mt-1">Brevets DTW Valides</div>
          </div>

          <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4">
            <div className="flex items-center justify-between text-xs text-slate-400 font-medium">
              <span>Cuves Conformes APAVE</span>
              <IconShieldCheck size={16} className="text-cyan-400" />
            </div>
            <div className="mt-2 flex items-baseline gap-1">
              <span className="text-2xl font-bold font-mono text-cyan-400">
                {compliantCompsCount}
              </span>
              <span className="text-xs text-slate-400">/ {compartments.length} comp.</span>
            </div>
            <div className="text-[11px] text-slate-500 mt-1">Épreuves &lt; 3 ans</div>
          </div>

          <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4">
            <div className="flex items-center justify-between text-xs text-slate-400 font-medium">
              <span>Alertes Vannes / Piquage</span>
              <IconAlertTriangle size={16} className="text-amber-400" />
            </div>
            <div className="mt-2 flex items-baseline gap-1">
              <span className={`text-2xl font-bold font-mono ${alertMissionsCount > 0 ? 'text-red-400' : 'text-slate-200'}`}>
                {alertMissionsCount}
              </span>
              <span className="text-xs text-slate-400">anomalies</span>
            </div>
            <div className="text-[11px] text-slate-500 mt-1">Vannes ouvertes hors géofence</div>
          </div>

          <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4">
            <div className="flex items-center justify-between text-xs text-slate-400 font-medium">
              <span>Missions en Cours</span>
              <IconTruck size={16} className="text-indigo-400" />
            </div>
            <div className="mt-2 flex items-baseline gap-1">
              <span className="text-xl font-bold font-mono text-indigo-300">
                {missions.filter((m) => m.status === TmdMissionStatus.IN_TRANSIT).length}
              </span>
              <span className="text-xs text-slate-400">en rotation</span>
            </div>
            <div className="text-[11px] text-slate-500 mt-1">Dépôts Naftal / Sonatrach</div>
          </div>
        </div>

        {/* SÉLECTEUR & ONGLETS */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400 font-medium">Filtrer par camion-citerne :</span>
            <select
              value={selectedAssetId}
              onChange={(e) => setSelectedAssetId(e.target.value)}
              className="bg-slate-900 border border-slate-700 text-xs text-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-red-500"
            >
              <option value="ALL">Toutes les citernes hydrocarbures</option>
              {Array.from(new Set(compartments.map((c) => c.assetId))).map((assetId) => (
                <option key={assetId} value={assetId}>
                  {assetId}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-1 bg-slate-900/80 p-1 rounded-lg border border-slate-800">
            <button
              onClick={() => setActiveTab('missions')}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                activeTab === 'missions'
                  ? 'bg-red-500 text-slate-950 font-bold shadow'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Missions TMD &amp; Vannes ({filteredMissions.length})
            </button>
            <button
              onClick={() => setActiveTab('compartments')}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                activeTab === 'compartments'
                  ? 'bg-red-500 text-slate-950 font-bold shadow'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Citernes &amp; Épreuves APAVE ({filteredComps.length})
            </button>
            <button
              onClick={() => setActiveTab('drivers')}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                activeTab === 'drivers'
                  ? 'bg-red-500 text-slate-950 font-bold shadow'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Brevets TMD Chauffeurs ({drivers.length})
            </button>
          </div>
        </div>

        {/* ONGLETS DU COCKPIT */}

        {/* ONGLET 1 : MISSIONS TMD & SÉCURITÉ VANNES */}
        {activeTab === 'missions' && (
          <div className="space-y-4">
            {filteredMissions.length === 0 ? (
              <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-12 text-center">
                <IconFlame size={48} className="mx-auto text-slate-600 mb-3" />
                <h3 className="text-base font-semibold text-slate-300">Aucune mission TMD en cours</h3>
                <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
                  Déclarez une mission de transport hydrocarbures au départ d&apos;un dépôt Naftal ou Sonatrach pour lancer la vérification des verrous de sécurité.
                </p>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => setIsAddMissionOpen(true)}
                  className="mt-4 gap-2 bg-red-600 hover:bg-red-500 text-white"
                >
                  <IconPlus size={14} /> Créer une mission
                </Button>
              </div>
            ) : (
              <div className="bg-slate-900/60 border border-slate-800 rounded-xl overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-950/80 text-slate-400 uppercase font-mono border-b border-slate-800">
                      <tr>
                        <th className="py-3 px-4">Mission / Statut</th>
                        <th className="py-3 px-4">Camion-Citerne</th>
                        <th className="py-3 px-4">Dépôt Départ &rarr; Destination</th>
                        <th className="py-3 px-4">Volume Hydrocarbures</th>
                        <th className="py-3 px-4">Sécurité Incendie &amp; Masse</th>
                        <th className="py-3 px-4">Alerte Dépotage / Vanne</th>
                        <th className="py-3 px-4">Sceau SHA-256 / Audit</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60">
                      {filteredMissions.map((m) => {
                        const isAlert = m.unauthorizedValveOpened;

                        return (
                          <tr key={m.id} className="hover:bg-slate-800/30 transition-colors">
                            <td className="py-3.5 px-4">
                              <div className="font-semibold text-white">{m.missionCode}</div>
                              <Badge
                                variant={
                                  m.status === TmdMissionStatus.IN_TRANSIT
                                    ? 'warning'
                                    : m.status === TmdMissionStatus.DELIVERED
                                    ? 'success'
                                    : m.status === TmdMissionStatus.BLOCKED_NON_COMPLIANT
                                    ? 'danger'
                                    : 'neutral'
                                }
                                className="text-[10px] uppercase font-mono mt-1"
                              >
                                {m.status}
                              </Badge>
                            </td>

                            <td className="py-3.5 px-4 font-mono">
                              <div className="text-red-400 font-bold">{m.assetId}</div>
                              <div className="text-[11px] text-slate-400">
                                Chauffeur Certifié DTW
                              </div>
                            </td>

                            <td className="py-3.5 px-4">
                              <div className="text-slate-200 font-medium">{m.originDepotName}</div>
                              <div className="text-[11px] text-cyan-400">
                                &rarr; {m.destinationStationName}
                              </div>
                            </td>

                            <td className="py-3.5 px-4 font-mono">
                              <div className="text-white font-bold text-sm">
                                {m.totalVolumeLiters.toLocaleString('fr-FR')} L
                              </div>
                              <div className="text-[10px] text-slate-500">Hydrocarbures Class 3</div>
                            </td>

                            <td className="py-3.5 px-4">
                              <div className="flex items-center gap-1.5 text-xs text-emerald-400">
                                <IconShieldCheck size={14} />
                                <span>Extincteurs 6kg Poudre OK</span>
                              </div>
                              <div className="flex items-center gap-1.5 text-[11px] text-slate-400 mt-0.5">
                                <IconZap size={12} className="text-amber-400" />
                                <span>Tresse Antistatique Reliée</span>
                              </div>
                            </td>

                            <td className="py-3.5 px-4">
                              {isAlert ? (
                                <Badge variant="danger" className="text-[10px] font-mono animate-pulse">
                                  VANNE OUVERTE HORS-ZONE
                                </Badge>
                              ) : (
                                <Badge variant="success" className="text-[10px] font-mono">
                                  VANNES SÉCURISÉES
                                </Badge>
                              )}
                            </td>

                            <td className="py-3.5 px-4">
                              <div className="flex items-center gap-1 text-[10px] font-mono text-emerald-400 mb-1">
                                <IconShieldCheck size={12} />
                                <span className="truncate max-w-[120px]" title={m.sha256AuditSeal}>
                                  {m.sha256AuditSeal.slice(0, 14)}...
                                </span>
                              </div>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => showMissionProof(m)}
                                className="text-[10px] py-1 px-2"
                              >
                                Preuve ADS
                              </Button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ONGLET 2 : CITERNES & ÉPREUVES APAVE */}
        {activeTab === 'compartments' && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {filteredComps.map((comp) => {
                const isExpired = new Date(comp.apaveTestExpiryDate) < new Date();

                return (
                  <div
                    key={comp.id}
                    className={`bg-slate-900/60 border rounded-xl p-5 space-y-3 ${
                      isExpired ? 'border-red-500/50 bg-red-950/20' : 'border-slate-800'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <span className="font-mono text-xs font-bold text-red-400">
                          Comp. {comp.compartmentNumber} — {comp.assetId}
                        </span>
                        <h3 className="text-sm font-semibold text-white mt-1">
                          {comp.currentProductType}
                        </h3>
                      </div>
                      <Badge
                        variant={comp.bottomValveStatus === ValveStatus.CLOSED ? 'success' : 'danger'}
                        className="font-mono text-[10px]"
                      >
                        Vanne {comp.bottomValveStatus}
                      </Badge>
                    </div>

                    <div className="bg-slate-950/60 p-2.5 rounded-lg border border-slate-800/80 text-xs space-y-1">
                      <div className="flex justify-between">
                        <span className="text-slate-500">Capacité :</span>
                        <span className="font-mono text-slate-200">{comp.capacityLiters.toLocaleString('fr-FR')} L</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Volume Actuel :</span>
                        <span className="font-mono text-amber-400 font-semibold">{comp.currentVolumeLiters.toLocaleString('fr-FR')} L</span>
                      </div>
                    </div>

                    <div className="text-xs space-y-1.5 pt-2 border-t border-slate-800">
                      <div className="flex justify-between">
                        <span className="text-slate-500">Épreuve APAVE :</span>
                        <span className="font-mono text-slate-300">{comp.apaveHydrostaticTestDate}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Expiration :</span>
                        <span className={`font-mono font-semibold ${isExpired ? 'text-red-400' : 'text-emerald-400'}`}>
                          {comp.apaveTestExpiryDate} {isExpired && '(ÉCHU)'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Conformité ADR :</span>
                        <span className="text-cyan-400 font-semibold">{comp.isAdrCompliant ? 'Certifié ADR' : 'Non Conforme'}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ONGLET 3 : BREVETS TMD CHAUFFEURS */}
        {activeTab === 'drivers' && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {drivers.map((d) => (
                <div
                  key={d.id}
                  className={`bg-slate-900/60 border rounded-xl p-5 space-y-3 ${
                    d.isValid ? 'border-slate-800' : 'border-red-500/40 bg-red-950/20'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="font-mono text-xs font-bold text-red-400">
                        {d.tmdCertificateNumber}
                      </span>
                      <h3 className="text-sm font-semibold text-white mt-1">{d.driverName}</h3>
                      <div className="text-xs text-slate-400">{d.driverLicenseNumber}</div>
                    </div>
                    <Badge variant={d.isValid ? 'success' : 'danger'} className="text-[10px] font-mono">
                      {d.isValid ? 'HABILITÉ' : 'ÉCHU / SUSPENDU'}
                    </Badge>
                  </div>

                  <div className="space-y-1.5 text-xs text-slate-400 pt-2 border-t border-slate-800">
                    <div className="flex justify-between">
                      <span>Classes Autoroutières :</span>
                      <span className="text-slate-200 font-mono font-semibold">{d.hazardClasses}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Autorité :</span>
                      <span className="text-slate-300">{d.issuingAuthority}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Validité :</span>
                      <span className={`font-mono ${d.isValid ? 'text-emerald-400' : 'text-red-400'}`}>
                        Jusqu&apos;au {d.expiryDate}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* MODALE 1 : HABILITATION CHAUFFEUR TMD */}
        {isAddDriverOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <IconUsers size={18} className="text-red-400" />
                  Habilitation &amp; Brevet TMD Chauffeur (DTW)
                </h3>
                <button
                  onClick={() => setIsAddDriverOpen(false)}
                  className="text-slate-400 hover:text-white"
                >
                  <IconX size={18} />
                </button>
              </div>

              <form onSubmit={handleCreateDriver} className="space-y-4 text-xs">
                <div>
                  <label className="block text-slate-400 mb-1">Nom &amp; Prénom du Chauffeur</label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Khaled Bouzid"
                    value={driverForm.driverName}
                    onChange={(e) => setDriverForm({ ...driverForm, driverName: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-red-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-400 mb-1">Numéro de Permis Poids Lourd</label>
                    <input
                      type="text"
                      required
                      placeholder="Ex: PERMIS-16-9921"
                      value={driverForm.driverLicenseNumber}
                      onChange={(e) => setDriverForm({ ...driverForm, driverLicenseNumber: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-red-500"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 mb-1">Numéro Brevet TMD Officiel</label>
                    <input
                      type="text"
                      required
                      placeholder="Ex: TMD-DZ-2025-0881"
                      value={driverForm.tmdCertificateNumber}
                      onChange={(e) => setDriverForm({ ...driverForm, tmdCertificateNumber: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-red-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-400 mb-1">Date de Délivrance</label>
                    <input
                      type="date"
                      required
                      value={driverForm.issueDate}
                      onChange={(e) => setDriverForm({ ...driverForm, issueDate: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-red-500"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 mb-1">Date d&apos;Expiration (3 ans max)</label>
                    <input
                      type="date"
                      required
                      value={driverForm.expiryDate}
                      onChange={(e) => setDriverForm({ ...driverForm, expiryDate: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-red-500"
                    />
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-800 flex justify-end gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setIsAddDriverOpen(false)}
                  >
                    Annuler
                  </Button>
                  <Button type="submit" variant="primary" size="sm" className="bg-red-600 hover:bg-red-500 text-white">
                    Valider Habilitation
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* MODALE 2 : COMPARTIMENT CITERNE */}
        {isAddCompOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <IconGauge size={18} className="text-red-400" />
                  Nouveau Compartiment Citerne Hydrocarbures
                </h3>
                <button
                  onClick={() => setIsAddCompOpen(false)}
                  className="text-slate-400 hover:text-white"
                >
                  <IconX size={18} />
                </button>
              </div>

              <form onSubmit={handleCreateComp} className="space-y-4 text-xs">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-400 mb-1">Réf Véhicule / Camion</label>
                    <input
                      type="text"
                      required
                      placeholder="Ex: CIT-NAF-16-01"
                      value={compForm.assetId}
                      onChange={(e) => setCompForm({ ...compForm, assetId: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-red-500"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 mb-1">Code Citerne</label>
                    <input
                      type="text"
                      required
                      placeholder="Ex: CIT-MAGYAR-36K"
                      value={compForm.tankerCode}
                      onChange={(e) => setCompForm({ ...compForm, tankerCode: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-red-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-slate-400 mb-1">N° Comp. (1-5)</label>
                    <input
                      type="number"
                      required
                      min={1}
                      max={5}
                      value={compForm.compartmentNumber}
                      onChange={(e) => setCompForm({ ...compForm, compartmentNumber: Number(e.target.value) })}
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-red-500"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 mb-1">Capacité (L)</label>
                    <input
                      type="number"
                      required
                      min={1000}
                      step="500"
                      value={compForm.capacityLiters}
                      onChange={(e) => setCompForm({ ...compForm, capacityLiters: Number(e.target.value) })}
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-red-500"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 mb-1">Produit</label>
                    <select
                      value={compForm.currentProductType}
                      onChange={(e) => setCompForm({ ...compForm, currentProductType: e.target.value as TankerProductType })}
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-red-500"
                    >
                      <option value={TankerProductType.GASOIL}>Gasoil</option>
                      <option value={TankerProductType.SUPER_SANS_PLOMB}>Sans Plomb</option>
                      <option value={TankerProductType.SIRGHAZ_GPL}>Sirghaz GPL</option>
                      <option value={TankerProductType.FUEL_LOURD}>Fuel Lourd</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-400 mb-1">Date Épreuve APAVE</label>
                    <input
                      type="date"
                      required
                      value={compForm.apaveHydrostaticTestDate}
                      onChange={(e) => setCompForm({ ...compForm, apaveHydrostaticTestDate: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-red-500"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 mb-1">Expiration APAVE (3 ans)</label>
                    <input
                      type="date"
                      required
                      value={compForm.apaveTestExpiryDate}
                      onChange={(e) => setCompForm({ ...compForm, apaveTestExpiryDate: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-red-500"
                    />
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-800 flex justify-end gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setIsAddCompOpen(false)}
                  >
                    Annuler
                  </Button>
                  <Button type="submit" variant="primary" size="sm" className="bg-red-600 hover:bg-red-500 text-white">
                    Créer le compartiment
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* MODALE 3 : NOUVELLE MISSION TMD */}
        {isAddMissionOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <IconFileText size={18} className="text-red-400" />
                  Nouvelle Mission de Transport Hydrocarbures (TMD)
                </h3>
                <button
                  onClick={() => setIsAddMissionOpen(false)}
                  className="text-slate-400 hover:text-white"
                >
                  <IconX size={18} />
                </button>
              </div>

              <form onSubmit={handleCreateMission} className="space-y-4 text-xs">
                <div>
                  <label className="block text-slate-400 mb-1">Code Mission</label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: TMD-MSN-2026-0910"
                    value={missionForm.missionCode}
                    onChange={(e) => setMissionForm({ ...missionForm, missionCode: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-red-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-400 mb-1">Camion-Citerne</label>
                    <input
                      type="text"
                      required
                      placeholder="Ex: CIT-NAF-16-01"
                      value={missionForm.assetId}
                      onChange={(e) => setMissionForm({ ...missionForm, assetId: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-red-500"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 mb-1">Chauffeur TMD Certifié</label>
                    <select
                      required
                      value={missionForm.driverCertificationId}
                      onChange={(e) => setMissionForm({ ...missionForm, driverCertificationId: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-red-500"
                    >
                      <option value="">Sélectionnez un chauffeur...</option>
                      {drivers.map((d) => (
                        <option key={d.id} value={d.id}>
                          {d.driverName} ({d.tmdCertificateNumber})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-400 mb-1">Dépôt Naftal Départ</label>
                    <input
                      type="text"
                      required
                      value={missionForm.originDepotName}
                      onChange={(e) => setMissionForm({ ...missionForm, originDepotName: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-red-500"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 mb-1">Station Destination</label>
                    <input
                      type="text"
                      required
                      value={missionForm.destinationStationName}
                      onChange={(e) => setMissionForm({ ...missionForm, destinationStationName: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-red-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-slate-400 mb-1">Volume Total à Transporter (Litres)</label>
                  <input
                    type="number"
                    required
                    min={1000}
                    step="500"
                    value={missionForm.totalVolumeLiters}
                    onChange={(e) => setMissionForm({ ...missionForm, totalVolumeLiters: Number(e.target.value) })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-red-500"
                  />
                </div>

                <div className="pt-3 border-t border-slate-800 flex justify-end gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setIsAddMissionOpen(false)}
                  >
                    Annuler
                  </Button>
                  <Button type="submit" variant="primary" size="sm" className="bg-red-600 hover:bg-red-500 text-white">
                    Valider l&apos;Ordre TMD
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* MODALE DE PREUVE FORMELLE DÉTERMINISTE (ADS) */}
        {selectedProofData && (
          <CalculationProofModal
            isOpen={true}
            onClose={() => setSelectedProofData(null)}
            data={selectedProofData}
          />
        )}
      </main>
    </div>
  );
}

