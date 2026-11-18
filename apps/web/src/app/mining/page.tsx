'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
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
  IconThermometer,
} from '../../components/navigation/TechIcons';
import { CalculationProofModal, CalculationProofData } from '../../components/decisions';
import { formatCurrency } from '../../lib/currency-formatter';

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
  const totalTiresValueDzd = tires.reduce((sum, t) => sum + Number(t.purchaseCostDzd), 0);
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
                    Mines, Carrières & Pneumatiques Hors-Route (OTR)
                  </h1>
                  <Badge variant="warning" className="uppercase font-mono text-xs">
                    Mines & Granulats DZ
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
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4">
            <div className="flex items-center justify-between text-xs text-slate-400 font-medium">
              <span>Gisements &amp; Carrières</span>
              <IconMapPin size={16} className="text-orange-400" />
            </div>
            <div className="mt-2 flex items-baseline gap-1">
              <span className="text-2xl font-bold font-mono text-white">
                {sites.length}
              </span>
              <span className="text-xs text-slate-400">Sites Actifs</span>
            </div>
            <div className="text-[11px] text-slate-500 mt-1">Fer, Phosphate, Ciment</div>
          </div>

          <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4">
            <div className="flex items-center justify-between text-xs text-slate-400 font-medium">
              <span>Pneus OTR en Service</span>
              <IconGauge size={16} className="text-amber-400" />
            </div>
            <div className="mt-2 flex items-baseline gap-1">
              <span className="text-2xl font-bold font-mono text-amber-400">
                {tires.length}
              </span>
              <span className="text-xs text-slate-400">Pneus Géants</span>
            </div>
            <div className="text-[11px] text-slate-500 mt-1">27.00R49 à 33.00R51</div>
          </div>

          <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4">
            <div className="flex items-center justify-between text-xs text-slate-400 font-medium">
              <span>Standby Refroidissement</span>
              <IconFlame size={16} className="text-red-400" />
            </div>
            <div className="mt-2 flex items-baseline gap-1">
              <span className="text-2xl font-bold font-mono text-red-400">
                {standbyTiresCount}
              </span>
              <span className="text-xs text-slate-400">en alerte</span>
            </div>
            <div className="text-[11px] text-slate-500 mt-1">Surchauffe &gt; 90°C</div>
          </div>

          <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4">
            <div className="flex items-center justify-between text-xs text-slate-400 font-medium">
              <span>Tonnage Transporté</span>
              <IconBarChart3 size={16} className="text-cyan-400" />
            </div>
            <div className="mt-2 flex items-baseline gap-1">
              <span className="text-2xl font-bold font-mono text-cyan-400">
                {totalTonsHauled.toLocaleString('fr-FR')}
              </span>
              <span className="text-xs text-slate-400">Tonnes</span>
            </div>
            <div className="text-[11px] text-slate-500 mt-1">Dumpers Rigides 100T</div>
          </div>

          <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4">
            <div className="flex items-center justify-between text-xs text-slate-400 font-medium">
              <span>Coût Moyen au Roulage</span>
              <IconZap size={16} className="text-emerald-400" />
            </div>
            <div className="mt-2 flex items-baseline gap-1">
              <span className="text-xl font-bold font-mono text-emerald-400">
                {avgCostPerTon}
              </span>
              <span className="text-xs text-slate-400">DZD / Tonne</span>
            </div>
            <div className="text-[11px] text-slate-500 mt-1">Gasoil + Pneus OTR</div>
          </div>
        </div>

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

        {/* ONGLET 1 : PNEUMATIQUES HORS-ROUTE (OTR) & RISQUE THERMIQUE */}
        {activeTab === 'tires' && (
          <div className="space-y-4">
            {tires.length === 0 ? (
              <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-12 text-center">
                <IconTruck size={48} className="mx-auto text-slate-600 mb-3" />
                <h3 className="text-base font-semibold text-slate-300">Aucun pneumatique OTR enregistré</h3>
                <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
                  Enregistrez un train de pneus pour dumper minier avec numéro de série et TKPH catalogue constructeur.
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsAddTireOpen(true)}
                  className="mt-4 gap-2"
                >
                  <IconPlus size={14} /> Enregistrer un pneu
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {tires.map((tire) => {
                  const isStandby = tire.status === OtrTireStatus.COOLING_STANDBY;
                  const temp = tire.currentTempC ?? 65.0;
                  const wearPct = Math.round(
                    ((tire.treadDepthInitialMm - tire.treadDepthCurrentMm) / tire.treadDepthInitialMm) * 100,
                  );

                  return (
                    <div
                      key={tire.id}
                      className={`bg-slate-900/60 border rounded-xl p-5 flex flex-col justify-between transition-all ${
                        isStandby
                          ? 'border-red-500/50 bg-red-950/20 shadow-lg shadow-red-950/20'
                          : 'border-slate-800'
                      }`}
                    >
                      <div>
                        {/* En-tête du pneu */}
                        <div className="flex items-start justify-between">
                          <div>
                            <span className="font-mono text-xs font-bold text-orange-400">
                              {tire.position} — {tire.serialNumber}
                            </span>
                            <h3 className="text-sm font-semibold text-white mt-1">
                              {tire.brand} {tire.dimension}
                            </h3>
                            <div className="text-xs text-slate-400">
                              {tire.modelPattern || 'Motif Roche E4'}
                            </div>
                          </div>
                          <Badge
                            variant={isStandby ? 'danger' : 'neutral'}
                            className="font-mono text-[10px] uppercase"
                          >
                            {tire.status}
                          </Badge>
                        </div>

                        {/* Engin & TKPH Nominal */}
                        <div className="mt-3 bg-slate-950/60 p-2.5 rounded-lg border border-slate-800/80 text-xs space-y-1">
                          <div className="flex justify-between">
                            <span className="text-slate-500">Dumper affecté :</span>
                            <span className="font-mono text-slate-200">{tire.assetId || 'En Stock'}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-500">TKPH Constructeur :</span>
                            <span className="font-mono text-amber-400 font-semibold">{tire.nominalTkph}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-500">Coût Acquisition :</span>
                            <span className="font-mono text-slate-300">{formatCurrency(tire.purchaseCostDzd)}</span>
                          </div>
                        </div>

                        {/* Télémétrie TPMS Déterministe */}
                        <div className="mt-4 space-y-2">
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-slate-400 flex items-center gap-1.5">
                              <IconThermometer size={14} className={isStandby ? 'text-red-400' : 'text-slate-400'} />
                              Température Interne
                            </span>
                            <span className={`font-mono font-bold ${isStandby ? 'text-red-400' : 'text-slate-200'}`}>
                              {temp}°C {isStandby && '(!)'}
                            </span>
                          </div>

                          <div className="flex items-center justify-between text-xs">
                            <span className="text-slate-400 flex items-center gap-1.5">
                              <IconGauge size={14} className="text-cyan-400" />
                              Pression TPMS
                            </span>
                            <span className="font-mono text-cyan-300">
                              {tire.currentPressureBar ?? 7.2} Bar
                            </span>
                          </div>

                          <div className="flex items-center justify-between text-xs">
                            <span className="text-slate-400 flex items-center gap-1.5">
                              <IconClock size={14} className="text-slate-400" />
                              Sculpture mm (Usure)
                            </span>
                            <span className="font-mono text-slate-200">
                              {tire.treadDepthCurrentMm} mm ({wearPct}% usé)
                            </span>
                          </div>

                          {isStandby && (
                            <div className="p-2 rounded bg-red-950/50 border border-red-500/40 text-[11px] text-red-300 mt-2">
                              <span className="font-bold block">Surchauffe Nappe Critique</span>
                              Arrêt obligatoire dumper pour refroidissement gomme.
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="mt-5 pt-3 border-t border-slate-800/80">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => showTireProof(tire)}
                          className="text-xs gap-1.5 w-full"
                        >
                          <IconShieldCheck size={14} />
                          Audit Thermique ADS
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ONGLET 2 : CYCLES DUMPERS & DÉTERMINISME TKPH */}
        {activeTab === 'cycles' && (
          <div className="space-y-4">
            {filteredCycles.length === 0 ? (
              <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-12 text-center">
                <IconBarChart3 size={48} className="mx-auto text-slate-600 mb-3" />
                <h3 className="text-base font-semibold text-slate-300">Aucun cycle de roulage enregistré</h3>
                <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
                  Enregistrez un cycle de dumper minier pour calculer le TKPH effectif et le coût par tonne transportée en DZD.
                </p>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => setIsRecordCycleOpen(true)}
                  className="mt-4 gap-2 bg-orange-600 hover:bg-orange-500 text-white"
                >
                  <IconPlus size={14} /> Saisir un cycle
                </Button>
              </div>
            ) : (
              <div className="bg-slate-900/60 border border-slate-800 rounded-xl overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-950/80 text-slate-400 uppercase font-mono border-b border-slate-800">
                      <tr>
                        <th className="py-3 px-4">Horodatage / Site</th>
                        <th className="py-3 px-4">Dumper &amp; Chauffeur</th>
                        <th className="py-3 px-4">Charge &amp; Distance</th>
                        <th className="py-3 px-4">TKPH Effectif vs Admissible</th>
                        <th className="py-3 px-4">Gasoil Cycle</th>
                        <th className="py-3 px-4">Coût de Revient Tonne</th>
                        <th className="py-3 px-4">Statut &amp; Standby</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60">
                      {filteredCycles.map((c) => {
                        const site = sites.find((s) => s.id === c.siteId);

                        return (
                          <tr key={c.id} className="hover:bg-slate-800/30 transition-colors">
                            <td className="py-3.5 px-4">
                              <div className="font-semibold text-white">{site?.name || 'Site Minier'}</div>
                              <div className="text-[11px] text-slate-500 font-mono">
                                W.{site?.wilayaCode} — {new Date(c.cycleTimestamp).toLocaleTimeString('fr-FR')}
                              </div>
                            </td>

                            <td className="py-3.5 px-4 font-mono">
                              <div className="text-orange-400 font-bold">{c.assetId}</div>
                              <div className="text-[11px] text-slate-400">{c.driverId || 'Opérateur dumper'}</div>
                            </td>

                            <td className="py-3.5 px-4 font-mono">
                              <div className="text-white font-semibold">{c.payloadMetricTons} Tonnes</div>
                              <div className="text-[11px] text-slate-500">
                                {c.cycleDistanceKm} km en {c.cycleDurationMinutes} min
                              </div>
                            </td>

                            <td className="py-3.5 px-4 font-mono">
                              <div className={`font-bold ${c.isTkphExceeded ? 'text-red-400' : 'text-emerald-400'}`}>
                                {c.calculatedTkph} TKPH
                              </div>
                              <div className="text-[11px] text-slate-500">
                                Max Admissible : {c.tkphAdmissible} TKPH
                              </div>
                            </td>

                            <td className="py-3.5 px-4 font-mono">
                              <div className="text-amber-400">{c.fuelConsumedLiters} L</div>
                              <div className="text-[10px] text-slate-500">
                                {formatCurrency(c.fuelConsumedLiters * 29.0)}
                              </div>
                            </td>

                            <td className="py-3.5 px-4 font-mono">
                              <div className="text-emerald-400 font-bold text-sm">
                                {c.costPerTonDzd} DZD/T
                              </div>
                              <div className="text-[10px] text-slate-500">Carburant + Pneus OTR</div>
                            </td>

                            <td className="py-3.5 px-4">
                              {c.coolingStandbyRecommended ? (
                                <Badge variant="danger" className="text-[10px] font-mono">
                                  STANDBY RECOMMANDÉ
                                </Badge>
                              ) : (
                                <Badge variant="success" className="text-[10px] font-mono">
                                  CONFORME
                                </Badge>
                              )}
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

        {/* ONGLET 3 : GISEMENTS & CARRIÈRES */}
        {activeTab === 'sites' && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {sites.map((s) => (
                <div
                  key={s.id}
                  className="bg-slate-900/60 border border-slate-800 rounded-xl p-5 space-y-3"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="font-mono text-xs font-bold text-orange-400">
                        {s.code}
                      </span>
                      <h3 className="text-sm font-semibold text-white mt-1">{s.name}</h3>
                    </div>
                    <Badge variant="neutral" className="font-mono text-xs">
                      Wilaya {s.wilayaCode}
                    </Badge>
                  </div>

                  <div className="space-y-1.5 text-xs text-slate-400 pt-2 border-t border-slate-800">
                    <div className="flex justify-between">
                      <span>Type d&apos;Exploitation :</span>
                      <span className="text-slate-200 font-semibold">{s.siteType}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>T° Ambiante Estivale :</span>
                      <span className="text-amber-400 font-mono">{s.ambientTempSummerC}°C</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Distance Moyenne Piste :</span>
                      <span className="text-cyan-400 font-mono">{s.averageHaulDistanceKm} km</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Pente Descendante Max :</span>
                      <span className="text-slate-200 font-mono">{s.pisteGradientMaxPct}%</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* MODALE 1 : NOUVEAU SITE MINIER */}
        {isAddSiteOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <IconMapPin size={18} className="text-orange-400" />
                  Nouveau Site Minier / Carrière
                </h3>
                <button
                  onClick={() => setIsAddSiteOpen(false)}
                  className="text-slate-400 hover:text-white"
                >
                  <IconX size={18} />
                </button>
              </div>

              <form onSubmit={handleCreateSite} className="space-y-4 text-xs">
                <div>
                  <label className="block text-slate-400 mb-1">Code Site</label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: MINE-TIN-02"
                    value={siteForm.code}
                    onChange={(e) => setSiteForm({ ...siteForm, code: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-orange-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 mb-1">Désignation du Gisement</label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Gisement de Phosphate Bled El Hadba"
                    value={siteForm.name}
                    onChange={(e) => setSiteForm({ ...siteForm, name: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-orange-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-400 mb-1">Wilaya (1 à 58)</label>
                    <input
                      type="number"
                      required
                      min={1}
                      max={58}
                      value={siteForm.wilayaCode}
                      onChange={(e) => setSiteForm({ ...siteForm, wilayaCode: Number(e.target.value) })}
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-orange-500"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 mb-1">Type de Ressource</label>
                    <select
                      value={siteForm.siteType}
                      onChange={(e) => setSiteForm({ ...siteForm, siteType: e.target.value as MiningSiteType })}
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-orange-500"
                    >
                      <option value={MiningSiteType.IRON_ORE}>Minerai de Fer</option>
                      <option value={MiningSiteType.PHOSPHATE}>Phosphate</option>
                      <option value={MiningSiteType.AGGREGATES_QUARRY}>Carrière Granulats</option>
                      <option value={MiningSiteType.CEMENT_PLANT}>Cimenterie</option>
                      <option value={MiningSiteType.MARBLE}>Marbre &amp; Pierre</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-slate-400 mb-1">T° Été (°C)</label>
                    <input
                      type="number"
                      step="0.5"
                      value={siteForm.ambientTempSummerC}
                      onChange={(e) => setSiteForm({ ...siteForm, ambientTempSummerC: Number(e.target.value) })}
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-orange-500"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 mb-1">Distance Piste (km)</label>
                    <input
                      type="number"
                      step="0.1"
                      value={siteForm.averageHaulDistanceKm}
                      onChange={(e) => setSiteForm({ ...siteForm, averageHaulDistanceKm: Number(e.target.value) })}
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-orange-500"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 mb-1">Pente Max (%)</label>
                    <input
                      type="number"
                      step="0.5"
                      value={siteForm.pisteGradientMaxPct}
                      onChange={(e) => setSiteForm({ ...siteForm, pisteGradientMaxPct: Number(e.target.value) })}
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-orange-500"
                    />
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-800 flex justify-end gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setIsAddSiteOpen(false)}
                  >
                    Annuler
                  </Button>
                  <Button type="submit" variant="primary" size="sm" className="bg-orange-600 hover:bg-orange-500 text-white">
                    Créer le site
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* MODALE 2 : NOUVEAU PNEU OTR */}
        {isAddTireOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <IconTruck size={18} className="text-orange-400" />
                  Nouveau Pneumatique OTR Géant
                </h3>
                <button
                  onClick={() => setIsAddTireOpen(false)}
                  className="text-slate-400 hover:text-white"
                >
                  <IconX size={18} />
                </button>
              </div>

              <form onSubmit={handleCreateTire} className="space-y-4 text-xs">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-400 mb-1">Numéro de Série (Vulcanisé)</label>
                    <input
                      type="text"
                      required
                      placeholder="Ex: MICH-XDR3-2026-9921"
                      value={tireForm.serialNumber}
                      onChange={(e) => setTireForm({ ...tireForm, serialNumber: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-orange-500"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 mb-1">Marque</label>
                    <select
                      value={tireForm.brand}
                      onChange={(e) => setTireForm({ ...tireForm, brand: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-orange-500"
                    >
                      <option value="Michelin">Michelin</option>
                      <option value="Bridgestone">Bridgestone</option>
                      <option value="Goodyear">Goodyear</option>
                      <option value="Triangle">Triangle</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-slate-400 mb-1">Dimension</label>
                    <input
                      type="text"
                      required
                      placeholder="Ex: 27.00R49"
                      value={tireForm.dimension}
                      onChange={(e) => setTireForm({ ...tireForm, dimension: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-orange-500"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 mb-1">Position Dumper</label>
                    <select
                      value={tireForm.position}
                      onChange={(e) => setTireForm({ ...tireForm, position: e.target.value as OtrTirePosition })}
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-orange-500"
                    >
                      <option value={OtrTirePosition.FL}>FL (Avant Gauche)</option>
                      <option value={OtrTirePosition.FR}>FR (Avant Droit)</option>
                      <option value={OtrTirePosition.RLO}>RLO (Arr. Gauche Ext)</option>
                      <option value={OtrTirePosition.RLI}>RLI (Arr. Gauche Int)</option>
                      <option value={OtrTirePosition.RRO}>RRO (Arr. Droit Ext)</option>
                      <option value={OtrTirePosition.RRI}>RRI (Arr. Droit Int)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-slate-400 mb-1">TKPH Constructeur</label>
                    <input
                      type="number"
                      required
                      min={100}
                      value={tireForm.nominalTkph}
                      onChange={(e) => setTireForm({ ...tireForm, nominalTkph: Number(e.target.value) })}
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-orange-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-400 mb-1">Coût d&apos;Achat (DZD)</label>
                    <input
                      type="number"
                      required
                      step="1000"
                      value={tireForm.purchaseCostDzd}
                      onChange={(e) => setTireForm({ ...tireForm, purchaseCostDzd: Number(e.target.value) })}
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-orange-500"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 mb-1">Sculpture Neuve (mm)</label>
                    <input
                      type="number"
                      step="0.5"
                      value={tireForm.treadDepthInitialMm}
                      onChange={(e) => setTireForm({ ...tireForm, treadDepthInitialMm: Number(e.target.value) })}
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-orange-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-slate-400 mb-1">Réf Dumper Affecté</label>
                  <input
                    type="text"
                    placeholder="Ex: DUMPER-CAT-777-01"
                    value={tireForm.assetId}
                    onChange={(e) => setTireForm({ ...tireForm, assetId: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-orange-500"
                  />
                </div>

                <div className="pt-3 border-t border-slate-800 flex justify-end gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setIsAddTireOpen(false)}
                  >
                    Annuler
                  </Button>
                  <Button type="submit" variant="primary" size="sm" className="bg-orange-600 hover:bg-orange-500 text-white">
                    Enregistrer le pneu
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* MODALE 3 : MISE À JOUR TÉLÉMÉTRIE PNEU TPMS */}
        {isUpdateTireOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <IconGauge size={18} className="text-cyan-400" />
                  Mise à Jour Télémétrie Pneu TPMS
                </h3>
                <button
                  onClick={() => setIsUpdateTireOpen(false)}
                  className="text-slate-400 hover:text-white"
                >
                  <IconX size={18} />
                </button>
              </div>

              <form onSubmit={handleUpdateTire} className="space-y-4 text-xs">
                <div>
                  <label className="block text-slate-400 mb-1">Pneu OTR</label>
                  <select
                    required
                    value={updateTelemForm.tireId}
                    onChange={(e) => setUpdateTelemForm({ ...updateTelemForm, tireId: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-orange-500"
                  >
                    <option value="">Sélectionnez un pneu...</option>
                    {tires.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.position} — {t.serialNumber} ({t.brand} {t.dimension})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-400 mb-1">Pression (Bar)</label>
                    <input
                      type="number"
                      step="0.05"
                      value={updateTelemForm.pressureBar}
                      onChange={(e) => setUpdateTelemForm({ ...updateTelemForm, pressureBar: Number(e.target.value) })}
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-orange-500"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 mb-1">Température (°C)</label>
                    <input
                      type="number"
                      step="0.5"
                      value={updateTelemForm.temperatureC}
                      onChange={(e) => setUpdateTelemForm({ ...updateTelemForm, temperatureC: Number(e.target.value) })}
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-orange-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-400 mb-1">Sculpture Restante (mm)</label>
                    <input
                      type="number"
                      step="0.5"
                      value={updateTelemForm.treadDepthMm}
                      onChange={(e) => setUpdateTelemForm({ ...updateTelemForm, treadDepthMm: Number(e.target.value) })}
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-orange-500"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 mb-1">Heures Roulées (+Δh)</label>
                    <input
                      type="number"
                      step="0.5"
                      value={updateTelemForm.operatingHoursDelta}
                      onChange={(e) => setUpdateTelemForm({ ...updateTelemForm, operatingHoursDelta: Number(e.target.value) })}
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-orange-500"
                    />
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-800 flex justify-end gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setIsUpdateTireOpen(false)}
                  >
                    Annuler
                  </Button>
                  <Button type="submit" variant="primary" size="sm" className="bg-cyan-600 hover:bg-cyan-500 text-white">
                    Mettre à jour
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* MODALE 4 : SAISIE CYCLE DE ROULAGE DUMPER */}
        {isRecordCycleOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <IconBarChart3 size={18} className="text-orange-400" />
                  Saisie Cycle Roulage &amp; Déterminisme TKPH
                </h3>
                <button
                  onClick={() => setIsRecordCycleOpen(false)}
                  className="text-slate-400 hover:text-white"
                >
                  <IconX size={18} />
                </button>
              </div>

              <form onSubmit={handleRecordCycle} className="space-y-4 text-xs">
                <div>
                  <label className="block text-slate-400 mb-1">Gisement Minier</label>
                  <select
                    required
                    value={cycleForm.siteId}
                    onChange={(e) => setCycleForm({ ...cycleForm, siteId: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-orange-500"
                  >
                    <option value="">Sélectionnez un site...</option>
                    {sites.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.code} — {s.name} (W.{s.wilayaCode})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-400 mb-1">Réf Dumper (ex: Cat 777)</label>
                    <input
                      type="text"
                      required
                      placeholder="Ex: DUMPER-CAT-777-01"
                      value={cycleForm.assetId}
                      onChange={(e) => setCycleForm({ ...cycleForm, assetId: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-orange-500"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 mb-1">Chauffeur Opérateur</label>
                    <input
                      type="text"
                      placeholder="Ex: Amar Khelifa"
                      value={cycleForm.driverId}
                      onChange={(e) => setCycleForm({ ...cycleForm, driverId: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-orange-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-slate-400 mb-1">Charge Utile (T)</label>
                    <input
                      type="number"
                      required
                      min={10}
                      value={cycleForm.payloadMetricTons}
                      onChange={(e) => setCycleForm({ ...cycleForm, payloadMetricTons: Number(e.target.value) })}
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-orange-500"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 mb-1">Distance (km)</label>
                    <input
                      type="number"
                      required
                      step="0.1"
                      min={0.5}
                      value={cycleForm.cycleDistanceKm}
                      onChange={(e) => setCycleForm({ ...cycleForm, cycleDistanceKm: Number(e.target.value) })}
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-orange-500"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 mb-1">Durée (min)</label>
                    <input
                      type="number"
                      required
                      min={5}
                      value={cycleForm.cycleDurationMinutes}
                      onChange={(e) => setCycleForm({ ...cycleForm, cycleDurationMinutes: Number(e.target.value) })}
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-orange-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-400 mb-1">Gasoil Consommé (L)</label>
                    <input
                      type="number"
                      required
                      min={5}
                      value={cycleForm.fuelConsumedLiters}
                      onChange={(e) => setCycleForm({ ...cycleForm, fuelConsumedLiters: Number(e.target.value) })}
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-orange-500"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 mb-1">T° Ambiante Piste (°C)</label>
                    <input
                      type="number"
                      step="0.5"
                      value={cycleForm.ambientTempC}
                      onChange={(e) => setCycleForm({ ...cycleForm, ambientTempC: Number(e.target.value) })}
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-orange-500"
                    />
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-800 flex justify-end gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setIsRecordCycleOpen(false)}
                  >
                    Annuler
                  </Button>
                  <Button type="submit" variant="primary" size="sm" className="bg-orange-600 hover:bg-orange-500 text-white">
                    Enregistrer le cycle
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

