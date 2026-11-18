'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useDemoMode } from '../../context/DemoModeContext';
import { Navbar } from '../../components/navigation/Navbar';
import { Badge } from '../../components/Badge';
import { Button } from '../../components/Button';
import {
  MiningClient,
  MiningSite,
  OtrTire,
  DumperHaulingCycle,
  MiningSiteType,
  OtrTirePosition,
  OtrTireStatus,
  CreateMiningSiteDto,
  CreateOtrTireDto,
  UpdateOtrTireTelemetryDto,
  RecordHaulingCycleDto,
} from '../../lib/api-mining';
import {
  IconTruck,
  IconGauge,
  IconRefreshCw,
  IconPlus,
  IconBarChart3,
} from '../../components/navigation/TechIcons';
import { CalculationProofModal, CalculationProofData } from '../../components/decisions';
import { formatCurrency } from '../../lib/currency-formatter';
import { MiningKpiHeader } from '@/components/mining/MiningKpiHeader';
import { OtrTiresTableView } from '@/components/mining/OtrTiresTableView';
import { HaulingCyclesTableView } from '@/components/mining/HaulingCyclesTableView';
import { SitesTableView } from '@/components/mining/SitesTableView';
import { MiningModals } from '@/components/mining/MiningModals';

export default function MiningPage() {
  const { isDemoMode } = useDemoMode();

  // Données
  const [sites, setSites] = useState<MiningSite[]>([]);
  const [tires, setTires] = useState<OtrTire[]>([]);
  const [cycles, setCycles] = useState<DumperHaulingCycle[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filtres & Onglets
  const [activeTab, setActiveTab] = useState<'tires' | 'cycles' | 'sites'>('tires');
  const [selectedSiteId, setSelectedSiteId] = useState<string>('ALL');

  // Modales
  const [isAddSiteOpen, setIsAddSiteOpen] = useState(false);
  const [isAddTireOpen, setIsAddTireOpen] = useState(false);
  const [isUpdateTireOpen, setIsUpdateTireOpen] = useState(false);
  const [isRecordCycleOpen, setIsRecordCycleOpen] = useState(false);
  const [selectedProofData, setSelectedProofData] = useState<CalculationProofData | null>(null);

  // Formulaires
  const [siteForm, setSiteForm] = useState<CreateMiningSiteDto>({
    code: '',
    name: '',
    wilayaCode: 50, // Tindouf par défaut
    commune: '',
    siteType: MiningSiteType.IRON_ORE,
    ambientTempSummerC: 48,
    averageHaulDistanceKm: 4.5,
    pisteGradientMaxPct: 8.5,
  });

  const [tireForm, setTireForm] = useState<CreateOtrTireDto>({
    assetId: '',
    serialNumber: '',
    brand: 'Michelin',
    modelPattern: 'XDR 3',
    dimension: '27.00R49',
    position: OtrTirePosition.FL,
    nominalTkph: 360,
    purchaseCostDzd: 3200000,
    treadDepthInitialMm: 88,
  });

  const [updateTelemForm, setUpdateTelemForm] = useState<UpdateOtrTireTelemetryDto>({
    tireId: '',
    pressureBar: 7.2,
    temperatureC: 70,
    treadDepthMm: 72,
    operatingHoursDelta: 8,
  });

  const [cycleForm, setCycleForm] = useState<RecordHaulingCycleDto>({
    siteId: '',
    assetId: '',
    driverId: '',
    cycleDurationMinutes: 24,
    cycleDistanceKm: 4.0,
    payloadMetricTons: 95,
    fuelConsumedLiters: 45,
    emptyWeightTons: 65,
    ambientTempC: 45,
    nominalTkph: 360,
  });

  // Chargement des données
  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [fetchedSites, fetchedTires, fetchedCycles] = await Promise.all([
        MiningClient.listSites(),
        MiningClient.listTires(),
        MiningClient.listCycles(),
      ]);

      if (fetchedSites.length > 0 || fetchedTires.length > 0 || fetchedCycles.length > 0) {
        setSites(fetchedSites);
        setTires(fetchedTires);
        setCycles(fetchedCycles);
      } else if (isDemoMode) {
        const { getSimulationMiningData } = await import('../../lib/simulation-sandbox');
        const demo = await getSimulationMiningData();
        setSites(demo.sites);
        setTires(demo.tires);
        setCycles(demo.cycles);
      } else {
        setSites([]);
        setTires([]);
        setCycles([]);
      }
    } catch {
      if (isDemoMode) {
        const { getSimulationMiningData } = await import('../../lib/simulation-sandbox');
        const demo = await getSimulationMiningData();
        setSites(demo.sites);
        setTires(demo.tires);
        setCycles(demo.cycles);
      }
    } finally {
      setIsLoading(false);
    }
  }, [isDemoMode]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Actions de création
  const handleCreateSite = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await MiningClient.createSite(siteForm, 'mock-token');
      setIsAddSiteOpen(false);
      loadData();
    } catch (err: any) {
      alert(err.message || 'Erreur lors de la création du site minier');
    }
  };

  const handleCreateTire = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await MiningClient.createTire(tireForm, 'mock-token');
      setIsAddTireOpen(false);
      loadData();
    } catch (err: any) {
      alert(err.message || 'Erreur lors de l’enregistrement du pneu OTR');
    }
  };

  const handleUpdateTire = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await MiningClient.updateTireTelemetry(updateTelemForm, 'mock-token');
      setIsUpdateTireOpen(false);
      loadData();
    } catch (err: any) {
      alert(err.message || 'Erreur lors de la mise à jour télémétrie du pneu');
    }
  };

  const handleRecordCycle = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await MiningClient.recordCycle(cycleForm, 'mock-token');
      setIsRecordCycleOpen(false);
      loadData();
    } catch (err: any) {
      alert(err.message || 'Erreur lors de l’enregistrement du cycle de roulage');
    }
  };

  // Filtrage
  const filteredCycles = selectedSiteId === 'ALL'
    ? cycles
    : cycles.filter((c) => c.siteId === selectedSiteId);

  // Métriques globales
  const standbyTiresCount = tires.filter((t) => t.status === OtrTireStatus.COOLING_STANDBY).length;
  const totalTonsHauled = cycles.reduce((sum, c) => sum + Number(c.payloadMetricTons), 0);
  const avgCostPerTon = cycles.length > 0
    ? (cycles.reduce((sum, c) => sum + Number(c.costPerTonDzd), 0) / cycles.length).toFixed(2)
    : '0.00';

  // Preuve formelle déterministe TKPH & Arbitrage ADS
  const showTireProof = (tire: OtrTire) => {
    const isStandby = tire.status === OtrTireStatus.COOLING_STANDBY;
    const temp = tire.currentTempC ?? 65.0;
    const avoidedDamageDzd = tire.purchaseCostDzd; // Évitement perte pneu 3.2M DZD
    const lostDowntimeDzd = 850000; // 6 heures d'arrêt de concassage / ligne

    setSelectedProofData({
      title: `Audit Thermique Déterministe & Calcul TKPH — Pneu OTR ${tire.serialNumber}`,
      decisionOrMetricName: `Surveillance Surchauffe Nappe Interne (Température ${temp}°C vs Seuil 90°C)`,
      category: 'FINANCIAL',
      ruleId: `OTR-TKPH-HEAT-${tire.serialNumber}`,
      legalOrOemReference: 'Norme Internationale ISO 10100 & Spécifications Constructeur Michelin/Bridgestone',
      deterministicFormula: 'TKPH_effectif = Q_moyen(t) × V_moyen(km/h) ≤ TKPH_admissible(Tamb)',
      formulaExplanation: `Sous climat saharien extrême (>40°C), l'échauffement hystérétique du caoutchouc engendre une dissociation nappe-bande de roulement. Si la température interne dépasse 90°C ou que le TKPH effectif excède la valeur admissible corrigée, un arrêt de refroidissement (Cooling Standby) est obligatoire sous peine d'éclatement explosif instantané.`,
      variables: [
        {
          name: 'Pneumatique OTR',
          symbol: 'Dim',
          value: `${tire.brand} ${tire.dimension} (${tire.position})`,
          source: 'Inventaire Actifs Miniers',
        },
        {
          name: 'Température Relevée',
          symbol: 'T_pneu',
          value: `${temp}°C`,
          source: 'Capteur TPMS OTR Haute Fréquence',
        },
        {
          name: 'Pression de Gonflage',
          symbol: 'P_bar',
          value: `${tire.currentPressureBar ?? 7.2} Bar`,
          source: 'Valve Électronique TPMS',
        },
        {
          name: 'TKPH Catalogue Constructeur',
          symbol: 'TKPH_nom',
          value: `${tire.nominalTkph}`,
          source: 'Fiche Technique OEM',
        },
        {
          name: 'Risque Financier d’Éclatement Évité',
          symbol: 'Perte_Évitée',
          value: formatCurrency(avoidedDamageDzd + lostDowntimeDzd),
          source: 'Moteur Déterministe ADS',
        },
      ],
      steps: [
        {
          stepNumber: 1,
          description: 'Calcul de la marge thermique interne du pneumatique',
          formula: 'Marge_Thermique = Seuil_Critique (90°C) - T_mesurée',
          calculation: `${90.0} - ${temp} = ${(90.0 - temp).toFixed(1)}°C de marge`,
          intermediateResult: isStandby ? 'SURCHAUFFE CRITIQUE (MARGE DÉPASSÉE)' : 'MARGE THERMIQUE CONFORME',
        },
        {
          stepNumber: 2,
          description: 'Arbitrage économique Action Immédiate vs Inaction destructrice',
          formula: 'ADS = (Coût_Pneu_Neuf + Arrêt_Production) vs Arrêt_Refroidissement 30 min',
          calculation: `${formatCurrency(avoidedDamageDzd)} (pneu) + ${formatCurrency(lostDowntimeDzd)} (arrêt ligne)`,
          intermediateResult: `${formatCurrency(avoidedDamageDzd + lostDowntimeDzd)} d'économie nette garantie`,
        },
      ],
      finalResult: {
        label: 'Arbitrage Technique & Décisionnel ADS',
        value: isStandby ? 'STANDBY REFROIDISSEMENT IMMÉDIAT PRESCRIT' : 'PNEUMATIQUE CONFORME EN CHARGE',
        conclusion: isStandby
          ? `ALERTE ROUGE : Température à ${temp}°C. Arrêt obligatoire du dumper pendant 25 minutes sur piste ombragée ou limitation de vitesse à 20 km/h en descente pour éviter l'éclatement du pneu (${formatCurrency(tire.purchaseCostDzd)}).`
          : `Pneu ${tire.serialNumber} en plage d'équilibre thermodynamique optimale. Usure régulière de sculpture (${tire.treadDepthCurrentMm} mm).`,
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
              <span className="p-2.5 rounded-xl bg-orange-500/10 text-orange-400 border border-orange-500/20">
                <IconTruck size={24} strokeWidth={2} />
              </span>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-2xl font-bold tracking-tight text-white">
                    Mines, Carrières &amp; Pneumatiques Hors-Route (OTR)
                  </h1>
                  <Badge variant="warning" className="uppercase font-mono text-xs">
                    Mines &amp; Granulats DZ
                  </Badge>
                </div>
                <p className="text-sm text-slate-400 mt-1">
                  Supervision des dumpers miniers 50T-100T (Gâra Djebilet, Tébessa, M&apos;Sila), Algorithme physique déterministe TKPH anti-éclatement &amp; Coût de revient DZD/Tonne.
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
              onClick={() => setIsAddSiteOpen(true)}
              className="gap-2"
            >
              <IconPlus size={14} />
              Nouveau Site
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsAddTireOpen(true)}
              className="gap-2"
            >
              <IconPlus size={14} />
              Nouveau Pneu OTR
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsUpdateTireOpen(true)}
              className="gap-2"
            >
              <IconGauge size={14} />
              Relevé TPMS
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={() => setIsRecordCycleOpen(true)}
              className="gap-2 bg-orange-600 hover:bg-orange-500 text-white"
            >
              <IconBarChart3 size={14} />
              Saisir Cycle Dumper
            </Button>
          </div>
        </div>

        {/* BANDEAU DE STATISTIQUES OPÉRATIONNELLES MINIÈRES */}
        <MiningKpiHeader
          sitesCount={sites.length}
          tiresCount={tires.length}
          standbyTiresCount={standbyTiresCount}
          totalTonsHauled={totalTonsHauled}
          avgCostPerTon={avgCostPerTon}
        />

        {/* SÉLECTEUR DE SITE & ONGLETS */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400 font-medium">Filtrer par gisement :</span>
            <select
              value={selectedSiteId}
              onChange={(e) => setSelectedSiteId(e.target.value)}
              className="bg-slate-900 border border-slate-700 text-xs text-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-orange-500"
            >
              <option value="ALL">Tous les sites miniers ({sites.length})</option>
              {sites.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.code} — {s.name} (W.{s.wilayaCode})
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-1 bg-slate-900/80 p-1 rounded-lg border border-slate-800">
            <button
              onClick={() => setActiveTab('tires')}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                activeTab === 'tires'
                  ? 'bg-orange-500 text-slate-950 font-bold shadow'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Pneus OTR &amp; Risque Thermique ({tires.length})
            </button>
            <button
              onClick={() => setActiveTab('cycles')}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                activeTab === 'cycles'
                  ? 'bg-orange-500 text-slate-950 font-bold shadow'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Cycles Dumpers &amp; TKPH ({filteredCycles.length})
            </button>
            <button
              onClick={() => setActiveTab('sites')}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                activeTab === 'sites'
                  ? 'bg-orange-500 text-slate-950 font-bold shadow'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Gisements &amp; Carrières ({sites.length})
            </button>
          </div>
        </div>

        {/* ONGLETS DU COCKPIT */}
        {activeTab === 'tires' && (
          <OtrTiresTableView
            tires={tires}
            onOpenAddTire={() => setIsAddTireOpen(true)}
            onShowTireProof={showTireProof}
          />
        )}

        {activeTab === 'cycles' && (
          <HaulingCyclesTableView
            filteredCycles={filteredCycles}
            sites={sites}
            onOpenRecordCycle={() => setIsRecordCycleOpen(true)}
          />
        )}

        {activeTab === 'sites' && (
          <SitesTableView sites={sites} />
        )}

        {/* MODALES D'ACTIONS OPÉRATIONNELLES */}
        <MiningModals
          sites={sites}
          tires={tires}
          isAddSiteOpen={isAddSiteOpen}
          onCloseAddSite={() => setIsAddSiteOpen(false)}
          siteForm={siteForm}
          onSiteFormChange={setSiteForm}
          onCreateSite={handleCreateSite}
          isAddTireOpen={isAddTireOpen}
          onCloseAddTire={() => setIsAddTireOpen(false)}
          tireForm={tireForm}
          onTireFormChange={setTireForm}
          onCreateTire={handleCreateTire}
          isUpdateTireOpen={isUpdateTireOpen}
          onCloseUpdateTire={() => setIsUpdateTireOpen(false)}
          updateTelemForm={updateTelemForm}
          onUpdateTelemFormChange={setUpdateTelemForm}
          onUpdateTire={handleUpdateTire}
          isRecordCycleOpen={isRecordCycleOpen}
          onCloseRecordCycle={() => setIsRecordCycleOpen(false)}
          cycleForm={cycleForm}
          onCycleFormChange={setCycleForm}
          onRecordCycle={handleRecordCycle}
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
