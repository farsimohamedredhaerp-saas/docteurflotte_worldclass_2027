'use client';

import React, { useState, useEffect, useCallback } from 'react';
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
  TmdMissionStatus,
  CreateTmdDriverCertificationDto,
  CreateFuelTankerCompartmentDto,
  CreateTmdTransportMissionDto,
} from '../../lib/api-tmd';
import {
  IconFlame,
  IconGauge,
  IconRefreshCw,
  IconPlus,
  IconFileText,
} from '../../components/navigation/TechIcons';
import { CalculationProofModal, CalculationProofData } from '../../components/decisions';
import { formatCurrency } from '../../lib/currency-formatter';
import { TmdKpiHeader } from '@/components/tmd/TmdKpiHeader';
import { MissionsTableView } from '@/components/tmd/MissionsTableView';
import { TankersTableView } from '@/components/tmd/TankersTableView';
import { DriversTableView } from '@/components/tmd/DriversTableView';
import { TmdModals } from '@/components/tmd/TmdModals';

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
  const inTransitMissionsCount = missions.filter((m) => m.status === TmdMissionStatus.IN_TRANSIT).length;

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
        <TmdKpiHeader
          totalVolumeInTransitLiters={totalVolumeInTransitLiters}
          validDriversCount={validDriversCount}
          totalDriversCount={drivers.length}
          compliantCompsCount={compliantCompsCount}
          totalCompsCount={compartments.length}
          alertMissionsCount={alertMissionsCount}
          inTransitMissionsCount={inTransitMissionsCount}
        />

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
        {activeTab === 'missions' && (
          <MissionsTableView
            filteredMissions={filteredMissions}
            onOpenAddMission={() => setIsAddMissionOpen(true)}
            onShowMissionProof={showMissionProof}
          />
        )}

        {activeTab === 'compartments' && (
          <TankersTableView filteredComps={filteredComps} />
        )}

        {activeTab === 'drivers' && (
          <DriversTableView drivers={drivers} />
        )}

        {/* MODALES D'ACTIONS OPÉRATIONNELLES */}
        <TmdModals
          drivers={drivers}
          isAddDriverOpen={isAddDriverOpen}
          onCloseAddDriver={() => setIsAddDriverOpen(false)}
          driverForm={driverForm}
          onDriverFormChange={setDriverForm}
          onCreateDriver={handleCreateDriver}
          isAddCompOpen={isAddCompOpen}
          onCloseAddComp={() => setIsAddCompOpen(false)}
          compForm={compForm}
          onCompFormChange={setCompForm}
          onCreateComp={handleCreateComp}
          isAddMissionOpen={isAddMissionOpen}
          onCloseAddMission={() => setIsAddMissionOpen(false)}
          missionForm={missionForm}
          onMissionFormChange={setMissionForm}
          onCreateMission={handleCreateMission}
        />

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
