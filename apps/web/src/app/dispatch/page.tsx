'use client';

import React, { useState } from 'react';
import Link from 'next/link';
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
} from '@/lib/api-fleet-intelligence';
import { PrintableMissionOrder } from '@/components/dispatch/PrintableMissionOrder';

// Jeu de données démo ultra-réaliste conforme Algérie (SNVI, Renault Kerax, Shacman, Mercedes Actros)
const SAMPLE_VEHICLES: VehicleStateDto[] = [
  {
    vehicleId: 'veh-kerax-440',
    registrationPlate: '01492-319-16',
    makeModel: 'Renault Kerax 440 DXi 6x4',
    category: AssetCategory.TRACTOR_TRAILER,
    maxPayloadTons: 32.0,
    grossVehicleWeightTons: 44.0,
    fuelType: 'DIESEL',
    refConsumptionL100Km: 34.5,
    hasWorkingReefer: false,
    hasWorkingPto: true,
    currentWilayaCode: 16, // Alger
    currentLat: 36.7538,
    currentLon: 3.0588,
    currentOdometerKm: 214500,
    currentEngineHours: 6820,
    annualTargetKm: 90000,
    ytdDrivenKm: 68000,
    vehicleHealthIndex: 88.5,
    batterySohPct: 91.0,
    coolingEwmaResidualC: 3.2,
    dispatchStatus: 'AVAILABLE' as any,
    documents: [
      {
        docType: 'CONTROLE_TECHNIQUE_ENACTA' as any,
        docNumber: 'ENACTA-16-2026-9912',
        issuedAt: '2026-01-15',
        expiresAt: '2026-12-31',
      },
      {
        docType: 'ASSURANCE_RC_CATNAT' as any,
        docNumber: 'SAA-POL-2026-8841',
        issuedAt: '2026-01-01',
        expiresAt: '2026-12-31',
      },
    ],
    subsystemRuls: [],
    activeDtcs: [],
  },
  {
    vehicleId: 'veh-actros-3340',
    registrationPlate: '09812-114-30',
    makeModel: 'Mercedes-Benz Actros 3340 6x4',
    category: AssetCategory.TRACTOR_TRAILER,
    maxPayloadTons: 30.0,
    grossVehicleWeightTons: 40.0,
    fuelType: 'DIESEL',
    refConsumptionL100Km: 32.0,
    hasWorkingReefer: false,
    hasWorkingPto: true,
    currentWilayaCode: 30, // Ouargla
    currentLat: 31.9522,
    currentLon: 5.3283,
    currentOdometerKm: 184000,
    currentEngineHours: 5410,
    annualTargetKm: 85000,
    ytdDrivenKm: 59000,
    vehicleHealthIndex: 92.0,
    batterySohPct: 94.0,
    coolingEwmaResidualC: 2.1,
    dispatchStatus: 'AVAILABLE' as any,
    documents: [
      {
        docType: 'CONTROLE_TECHNIQUE_ENACTA' as any,
        docNumber: 'ENACTA-30-2026-4412',
        issuedAt: '2026-03-01',
        expiresAt: '2026-12-31',
      },
      {
        docType: 'ASSURANCE_RC_CATNAT' as any,
        docNumber: 'CAAT-POL-2026-1190',
        issuedAt: '2026-01-01',
        expiresAt: '2026-12-31',
      },
    ],
    subsystemRuls: [],
    activeDtcs: [],
  },
  {
    vehicleId: 'veh-shacman-f3000-blocked',
    registrationPlate: '04512-120-19',
    makeModel: 'Shacman F3000 Benne 8x4 (Bloqué)',
    category: AssetCategory.HEAVY_TRUCK_RIGID,
    maxPayloadTons: 28.0,
    grossVehicleWeightTons: 38.0,
    fuelType: 'DIESEL',
    refConsumptionL100Km: 38.0,
    hasWorkingReefer: false,
    hasWorkingPto: true,
    currentWilayaCode: 19, // Sétif
    currentLat: 36.1911,
    currentLon: 5.4137,
    currentOdometerKm: 289000,
    currentEngineHours: 8940,
    annualTargetKm: 95000,
    ytdDrivenKm: 82000,
    vehicleHealthIndex: 44.0, // VHI CRITIQUE
    batterySohPct: 62.0,
    coolingEwmaResidualC: 13.5, // SURCHAUFFE
    dispatchStatus: 'BLOCKED_SAFETY' as any,
    documents: [
      {
        docType: 'CONTROLE_TECHNIQUE_ENACTA' as any,
        docNumber: 'ENACTA-19-2025-0012',
        issuedAt: '2025-06-01',
        expiresAt: '2025-12-31', // EXPIRÉ
      },
    ],
    subsystemRuls: [],
    activeDtcs: [{ code: 'SPN 110 FMI 0', severity: 'CRITICAL_STOP', description: 'Surchauffe culasse EWMA >= 11°C' }],
  },
];

const SAMPLE_DRIVERS: DriverStateDto[] = [
  {
    driverId: 'drv-karim-b',
    fullName: 'Karim Benali',
    phoneDz: '+213 550 12 34 56',
    licenseCategories: [LicenseCategoryDZ.C2, LicenseCategoryDZ.E],
    hasBrevetProfessionnel: true,
    hasAdrHazmatCert: true,
    currentWilayaCode: 16,
    continuousDrivingHours: 1.5,
    dailyDrivingHoursToday: 3.5,
    restHoursLast24h: 11.0,
    safetyScore: 94.0,
    isAvailable: true,
  },
  {
    driverId: 'drv-mourad-z',
    fullName: 'Mourad Ziani',
    phoneDz: '+213 661 98 76 54',
    licenseCategories: [LicenseCategoryDZ.C2, LicenseCategoryDZ.E],
    hasBrevetProfessionnel: true,
    hasAdrHazmatCert: false,
    currentWilayaCode: 30,
    continuousDrivingHours: 0.5,
    dailyDrivingHoursToday: 2.0,
    restHoursLast24h: 12.0,
    safetyScore: 91.0,
    isAvailable: true,
  },
];

export default function DispatchPage() {
  const [selectedSector, setSelectedSector] = useState<IndustrySector>(IndustrySector.TRANSPORT);
  const [selectedVehicleId, setSelectedVehicleId] = useState<string>('veh-kerax-440');
  const [selectedDriverId, setSelectedDriverId] = useState<string>('drv-karim-b');

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

  const selectedVehicle = SAMPLE_VEHICLES.find((v) => v.vehicleId === selectedVehicleId) || SAMPLE_VEHICLES[0];
  const selectedDriver = SAMPLE_DRIVERS.find((d) => d.driverId === selectedDriverId) || SAMPLE_DRIVERS[0];

  const handleEvaluateDispatch = async () => {
    setIsEvaluating(true);
    setDecisionResult(null);
    setActiveMissionOrder(null);

    const transits = transitWilayas
      .split(',')
      .map((s) => Number(s.trim()))
      .filter((n) => !isNaN(n) && n > 0);

    const mission: MissionRequestDto = {
      missionId: `MIS-2026-${Date.now().toString().slice(-5)}`,
      tenantId: 'tenant-algeria-logistics-01',
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
        fleetVehicles: SAMPLE_VEHICLES,
        fleetDrivers: SAMPLE_DRIVERS,
      });
      setDecisionResult(res);
    } catch (err: any) {
      alert(`Erreur d'évaluation : ${err.message || 'Échec réseau'}`);
    } finally {
      setIsEvaluating(false);
    }
  };

  const handleIssueMissionOrder = async () => {
    if (!decisionResult) return;

    const assignedVehId = decisionResult.assignedVehicleId || selectedVehicleId;
    const assignedDrvId = decisionResult.assignedDriverId || selectedDriverId;

    const v = SAMPLE_VEHICLES.find((x) => x.vehicleId === assignedVehId) || selectedVehicle;
    const d = SAMPLE_DRIVERS.find((x) => x.driverId === assignedDrvId) || selectedDriver;

    const mission: MissionRequestDto = {
      missionId: decisionResult.missionId,
      tenantId: 'tenant-algeria-logistics-01',
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
    } catch (err: any) {
      alert(`Impossible d'émettre l'Ordre de Mission : ${err.message}`);
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
    <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '24px 20px' }}>
      {/* HEADER COCKPIT */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '4px 12px', background: 'rgba(99, 102, 241, 0.12)', border: '1px solid rgba(99, 102, 241, 0.3)', borderRadius: '20px', fontSize: '12px', fontWeight: 700, color: 'var(--df-accent-blue)', marginBottom: '8px' }}>
            <span>📜</span>
            <span>RÉGLEMENTATION ALGORITHMIQUE & DISPATCH (GATE DZ)</span>
          </div>
          <h1 style={{ fontSize: '26px', fontWeight: 800, color: 'var(--df-text-main)', margin: 0, letterSpacing: '-0.02em' }}>
            Cockpit de Dispatch & Ordres de Mission Réglementaires (OM)
          </h1>
          <p style={{ fontSize: '14px', color: 'var(--df-text-secondary)', marginTop: '4px' }}>
            Machine à états stricte conforme au Code de la Route algérien (Loi 01-14 / Décret 04-415), barème ENACTA et jetons QR cryptographiques hors-ligne HMAC-256.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <Link
            href="/preventive"
            style={{
              padding: '10px 16px',
              borderRadius: '8px',
              border: '1px solid var(--df-border-subtle)',
              background: 'var(--df-bg-surface-1)',
              color: 'var(--df-text-main)',
              fontSize: '13px',
              fontWeight: 600,
              textDecoration: 'none',
              boxShadow: 'var(--df-shadow-sm)',
            }}
          >
            🧬 Cockpit Maintenance 5.0
          </Link>
          <Link
            href="/guide#field-modules"
            style={{
              padding: '10px 16px',
              borderRadius: '8px',
              border: '1px solid var(--df-border-subtle)',
              background: 'var(--df-bg-surface-1)',
              color: 'var(--df-text-main)',
              fontSize: '13px',
              fontWeight: 600,
              textDecoration: 'none',
              boxShadow: 'var(--df-shadow-sm)',
            }}
          >
            📖 Référentiel Réglementaire
          </Link>
        </div>
      </div>

      {/* MODALE D'ORDRE DE MISSION IMPRIMABLE */}
      {activeMissionOrder && (
        <div style={{ marginBottom: '32px' }}>
          <PrintableMissionOrder order={activeMissionOrder} onClose={() => setActiveMissionOrder(null)} />
        </div>
      )}

      {/* GRILLE PRINCIPALE : FORMULAIRE DE MISSION & RÉSULTAT DÉCISIONNEL */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(380px, 1.2fr) minmax(380px, 1.4fr)', gap: '24px', alignItems: 'start' }}>
        {/* COLONNE GAUCHE : FORMULAIRE INTELLIGENT */}
        <div style={{ background: 'var(--df-bg-surface-1)', border: '1px solid var(--df-border-subtle)', borderRadius: '14px', padding: '24px', boxShadow: 'var(--df-shadow-sm)' }}>
          <h2 style={{ fontSize: '17px', fontWeight: 800, color: 'var(--df-text-main)', margin: '0 0 18px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span>📋</span> Paramètres de la Mission de Transport
          </h2>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* SECTEUR INDUSTRIEL */}
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: 'var(--df-text-secondary)', marginBottom: '6px' }}>
                Secteur d&apos;Activité
              </label>
              <select
                value={selectedSector}
                onChange={(e) => setSelectedSector(e.target.value as any)}
                style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid var(--df-border-medium)', background: 'var(--df-bg-surface-2)', color: 'var(--df-text-main)', fontSize: '13px', fontWeight: 600 }}
              >
                <option value={IndustrySector.TRANSPORT}>Transport Routier & Fret Général</option>
                <option value={IndustrySector.BTP}>BTPH & Chantiers de Terrassement</option>
                <option value={IndustrySector.LOGISTICS}>Logistique & Distribution Urbaine</option>
                <option value={IndustrySector.COLD_CHAIN}>Chaîne du Froid & Pharmacie (ATP)</option>
                <option value={IndustrySector.AGRICULTURE}>Agriculture & Transport Céréalier</option>
              </select>
            </div>

            {/* VÉHICULE & CHAUFFEUR */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: 'var(--df-text-secondary)', marginBottom: '6px' }}>
                  Véhicule Demandé
                </label>
                <select
                  value={selectedVehicleId}
                  onChange={(e) => setSelectedVehicleId(e.target.value)}
                  style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid var(--df-border-medium)', background: 'var(--df-bg-surface-2)', color: 'var(--df-text-main)', fontSize: '12.5px', fontWeight: 600 }}
                >
                  {SAMPLE_VEHICLES.map((v) => (
                    <option key={v.vehicleId} value={v.vehicleId}>
                      {v.registrationPlate} ({v.makeModel.split(' ')[0]}) — VHI {v.vehicleHealthIndex}%
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: 'var(--df-text-secondary)', marginBottom: '6px' }}>
                  Conducteur Demandé
                </label>
                <select
                  value={selectedDriverId}
                  onChange={(e) => setSelectedDriverId(e.target.value)}
                  style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid var(--df-border-medium)', background: 'var(--df-bg-surface-2)', color: 'var(--df-text-main)', fontSize: '12.5px', fontWeight: 600 }}
                >
                  {SAMPLE_DRIVERS.map((d) => (
                    <option key={d.driverId} value={d.driverId}>
                      {d.fullName} ({d.licenseCategories.join('+')})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* BADGE ÉTAT DU VÉHICULE SÉLECTIONNÉ */}
            <div style={{ background: 'var(--df-bg-surface-2)', padding: '12px', borderRadius: '8px', border: '1px solid var(--df-border-subtle)', fontSize: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <span style={{ fontWeight: 700, color: 'var(--df-text-main)' }}>{selectedVehicle.makeModel}</span>
                <span style={{ padding: '2px 8px', borderRadius: '4px', fontWeight: 800, fontSize: '11px', background: selectedVehicle.vehicleHealthIndex >= 80 ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)', color: selectedVehicle.vehicleHealthIndex >= 80 ? '#059669' : '#dc2626' }}>
                  Santé VHI : {selectedVehicle.vehicleHealthIndex}/100
                </span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '6px', color: 'var(--df-text-secondary)', fontSize: '11px' }}>
                <div>Batterie SOH : <strong>{selectedVehicle.batterySohPct}%</strong></div>
                <div>Charge Max : <strong>{selectedVehicle.maxPayloadTons}t</strong></div>
                <div>Consom. Réf : <strong>{selectedVehicle.refConsumptionL100Km} L</strong></div>
              </div>
            </div>

            {/* ITINÉRAIRE (ORIGINE / DESTINATION / TRANSIT) */}
            <div style={{ borderTop: '1px solid var(--df-border-subtle)', paddingTop: '14px' }}>
              <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--df-text-main)', marginBottom: '10px' }}>
                🗺️ Itinéraire National (58 Wilayas)
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '10px', marginBottom: '10px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '11px', color: 'var(--df-text-muted)', marginBottom: '4px' }}>Origine (Lieu de Départ)</label>
                  <input
                    type="text"
                    value={originName}
                    onChange={(e) => setOriginName(e.target.value)}
                    style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid var(--df-border-medium)', background: 'var(--df-bg-surface-2)', color: 'var(--df-text-main)', fontSize: '12px' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '11px', color: 'var(--df-text-muted)', marginBottom: '4px' }}>Wilaya N°</label>
                  <input
                    type="number"
                    min="1"
                    max="58"
                    value={originWilaya}
                    onChange={(e) => setOriginWilaya(Number(e.target.value))}
                    style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid var(--df-border-medium)', background: 'var(--df-bg-surface-2)', color: 'var(--df-text-main)', fontSize: '12px' }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '10px', marginBottom: '10px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '11px', color: 'var(--df-text-muted)', marginBottom: '4px' }}>Destination (Lieu d&apos;Arrivée)</label>
                  <input
                    type="text"
                    value={destinationName}
                    onChange={(e) => setDestinationName(e.target.value)}
                    style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid var(--df-border-medium)', background: 'var(--df-bg-surface-2)', color: 'var(--df-text-main)', fontSize: '12px' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '11px', color: 'var(--df-text-muted)', marginBottom: '4px' }}>Wilaya N°</label>
                  <input
                    type="number"
                    min="1"
                    max="58"
                    value={destinationWilaya}
                    onChange={(e) => setDestinationWilaya(Number(e.target.value))}
                    style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid var(--df-border-medium)', background: 'var(--df-bg-surface-2)', color: 'var(--df-text-main)', fontSize: '12px' }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '11px', color: 'var(--df-text-muted)', marginBottom: '4px' }}>Wilayas de Transit Autorisées (séparées par virgule)</label>
                <input
                  type="text"
                  value={transitWilayas}
                  onChange={(e) => setTransitWilayas(e.target.value)}
                  placeholder="Ex: 09, 28, 47"
                  style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid var(--df-border-medium)', background: 'var(--df-bg-surface-2)', color: 'var(--df-text-main)', fontSize: '12px' }}
                />
              </div>
            </div>

            {/* CARGAISON & EXIGENCES */}
            <div style={{ borderTop: '1px solid var(--df-border-subtle)', paddingTop: '14px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: '10px', marginBottom: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '11px', color: 'var(--df-text-muted)', marginBottom: '4px' }}>Nature Cargaison</label>
                  <input
                    type="text"
                    value={cargoNature}
                    onChange={(e) => setCargoNature(e.target.value)}
                    style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid var(--df-border-medium)', background: 'var(--df-bg-surface-2)', color: 'var(--df-text-main)', fontSize: '12px' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '11px', color: 'var(--df-text-muted)', marginBottom: '4px' }}>Charge (T)</label>
                  <input
                    type="number"
                    step="0.5"
                    value={payloadTons}
                    onChange={(e) => setPayloadTons(Number(e.target.value))}
                    style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid var(--df-border-medium)', background: 'var(--df-bg-surface-2)', color: 'var(--df-text-main)', fontSize: '12px' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '11px', color: 'var(--df-text-muted)', marginBottom: '4px' }}>Distance (km)</label>
                  <input
                    type="number"
                    value={routeKm}
                    onChange={(e) => setRouteKm(Number(e.target.value))}
                    style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid var(--df-border-medium)', background: 'var(--df-bg-surface-2)', color: 'var(--df-text-main)', fontSize: '12px' }}
                  />
                </div>
              </div>

              {/* CLIMAT & RESTRICTIONS SPÉCIALES */}
              <div style={{ display: 'flex', gap: '14px', flexWrap: 'wrap', alignItems: 'center', marginBottom: '12px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', cursor: 'pointer', color: 'var(--df-text-secondary)' }}>
                  <input
                    type="checkbox"
                    checked={requiresHazmat}
                    onChange={(e) => setRequiresHazmat(e.target.checked)}
                    style={{ accentColor: '#dc2626' }}
                  />
                  <span>⚠️ ADR (Matières Dangereuses)</span>
                </label>

                <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', cursor: 'pointer', color: 'var(--df-text-secondary)' }}>
                  <input
                    type="checkbox"
                    checked={requiresReefer}
                    onChange={(e) => setRequiresReefer(e.target.checked)}
                    style={{ accentColor: 'var(--df-accent-blue)' }}
                  />
                  <span>❄️ Frigo / ATP (Pharmaceutique)</span>
                </label>
              </div>
            </div>

            {/* BOUTON D'ÉVALUATION */}
            <button
              onClick={handleEvaluateDispatch}
              disabled={isEvaluating}
              style={{
                width: '100%',
                padding: '12px 18px',
                borderRadius: '8px',
                border: 'none',
                background: isEvaluating ? '#64748b' : 'var(--df-accent-blue)',
                color: '#ffffff',
                fontWeight: 800,
                fontSize: '14px',
                cursor: isEvaluating ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                boxShadow: 'var(--df-shadow-sm)',
                transition: 'all 0.15s ease',
              }}
            >
              <span>{isEvaluating ? '⏳' : '⚡'}</span>
              <span>{isEvaluating ? 'Évaluation des 4 Portes Réglementaires...' : 'Évaluer Éligibilité Réglementaire (Gate DZ)'}</span>
            </button>
          </div>
        </div>

        {/* COLONNE DROITE : RÉSULTAT DÉCISIONNEL & MACHINE À ÉTATS */}
        <div>
          {decisionResult ? (
            <div style={{ background: 'var(--df-bg-surface-1)', border: '1px solid var(--df-border-subtle)', borderRadius: '14px', padding: '24px', boxShadow: 'var(--df-shadow-sm)', marginBottom: '24px' }}>
              {/* BANDEAU DE STATUT */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
                <div style={{ fontSize: '12px', fontWeight: 800, textTransform: 'uppercase', color: 'var(--df-text-muted)' }}>
                  Verdict du Moteur Décisionnel (Gate DZ)
                </div>
                <div
                  style={{
                    padding: '6px 14px',
                    borderRadius: '20px',
                    fontWeight: 800,
                    fontSize: '13px',
                    background:
                      decisionResult.decisionOutcome === 'APPROVED_AS_REQUESTED'
                        ? 'rgba(16, 185, 129, 0.15)'
                        : decisionResult.decisionOutcome === 'SUBSTITUTED_AUTOMATICALLY'
                        ? 'rgba(245, 158, 11, 0.15)'
                        : 'rgba(239, 68, 68, 0.15)',
                    color:
                      decisionResult.decisionOutcome === 'APPROVED_AS_REQUESTED'
                        ? '#059669'
                        : decisionResult.decisionOutcome === 'SUBSTITUTED_AUTOMATICALLY'
                        ? '#d97706'
                        : '#dc2626',
                    border: `1px solid ${
                      decisionResult.decisionOutcome === 'APPROVED_AS_REQUESTED'
                        ? 'rgba(16, 185, 129, 0.3)'
                        : decisionResult.decisionOutcome === 'SUBSTITUTED_AUTOMATICALLY'
                        ? 'rgba(245, 158, 11, 0.3)'
                        : 'rgba(239, 68, 68, 0.3)'
                    }`,
                  }}
                >
                  {decisionResult.decisionOutcome === 'APPROVED_AS_REQUESTED' && '✓ MISSION APPROUVÉE CONFORME'}
                  {decisionResult.decisionOutcome === 'APPROVED_WITH_ETD_OR_ROUTE_SHIFT' && '⚠️ APPROUVÉ AVEC DÉCALAGE HORAIRE'}
                  {decisionResult.decisionOutcome === 'SUBSTITUTED_AUTOMATICALLY' && '🔄 SUBSTITUTION AUTOMATIQUE TOPSIS'}
                  {decisionResult.decisionOutcome === 'REJECTED_NO_ELIGIBLE_ASSET' && '🚫 MISSION REJETÉE SANS ACTIF VALIDE'}
                </div>
              </div>

              {/* DÉTAIL DES ACTIFS AFFECTÉS */}
              <div style={{ background: 'var(--df-bg-surface-2)', padding: '16px', borderRadius: '10px', marginBottom: '18px', border: '1px solid var(--df-border-subtle)' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', fontSize: '13px' }}>
                  <div>
                    <div style={{ fontSize: '11px', color: 'var(--df-text-muted)' }}>Véhicule Assigné pour le Trajet :</div>
                    <div style={{ fontSize: '16px', fontWeight: 800, color: 'var(--df-text-main)', marginTop: '2px' }}>
                      {decisionResult.assignedRegistrationPlate || 'Aucun'}
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: '11px', color: 'var(--df-text-muted)' }}>Conducteur Titulaire Autorisé :</div>
                    <div style={{ fontSize: '16px', fontWeight: 800, color: 'var(--df-text-main)', marginTop: '2px' }}>
                      {decisionResult.assignedDriverName || 'Aucun'}
                    </div>
                  </div>
                </div>

                {decisionResult.routeAdvisoryNotes && decisionResult.routeAdvisoryNotes.length > 0 && (
                  <div style={{ marginTop: '12px', borderTop: '1px dashed var(--df-border-medium)', paddingTop: '8px', fontSize: '12px', color: '#0284c7' }}>
                    💡 Avis Routier : {decisionResult.routeAdvisoryNotes.join(' • ')}
                  </div>
                )}
              </div>

              {/* VIOLATIONS & BLOCAGES DÉTECTÉS */}
              {decisionResult.violationsDetected && decisionResult.violationsDetected.length > 0 && (
                <div style={{ marginBottom: '18px' }}>
                  <div style={{ fontSize: '13px', fontWeight: 800, color: '#dc2626', marginBottom: '8px' }}>
                    🚫 Violations Réglementaires & Techniques Bloquantes :
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {decisionResult.violationsDetected.map((v, i) => (
                      <div key={i} style={{ background: 'rgba(239, 68, 68, 0.08)', border: '1px solid rgba(239, 68, 68, 0.25)', borderRadius: '6px', padding: '10px 12px', fontSize: '12px', color: '#991b1b' }}>
                        <strong>[{v.gate}]</strong> {v.messageFr}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* ORDRES DE TRAVAIL (OT) GÉNÉRÉS AUTOMATIQUEMENT */}
              {decisionResult.generatedWorkOrders && decisionResult.generatedWorkOrders.length > 0 && (
                <div style={{ marginBottom: '18px' }}>
                  <div style={{ fontSize: '13px', fontWeight: 800, color: '#d97706', marginBottom: '8px' }}>
                    🔧 Ordres de Travail (OT) d&apos;Atelier Déclenchés :
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {decisionResult.generatedWorkOrders.map((ot, idx) => (
                      <div key={idx} style={{ background: 'rgba(245, 158, 11, 0.08)', border: '1px solid rgba(245, 158, 11, 0.25)', borderRadius: '6px', padding: '10px 12px', fontSize: '12px' }}>
                        <div style={{ fontWeight: 700, color: '#b45309' }}>{ot.title} (Immobilisation estimée: {ot.estimatedDowntimeHours}h)</div>
                        <div style={{ color: 'var(--df-text-secondary)', fontSize: '11px', marginTop: '2px' }}>Tâches : {ot.tasksToPerform.join(', ')}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* SUBSTITUTIONS TOPSIS RECOMMANDÉES */}
              {decisionResult.rankedSubstitutions && decisionResult.rankedSubstitutions.length > 0 && (
                <div style={{ marginBottom: '18px' }}>
                  <div style={{ fontSize: '13px', fontWeight: 800, color: 'var(--df-accent-blue)', marginBottom: '8px' }}>
                    🔄 Classement Multicritère TOPSIS des Véhicules de Remplacement :
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {decisionResult.rankedSubstitutions.slice(0, 2).map((sub, i) => (
                      <div key={i} style={{ background: 'var(--df-bg-surface-2)', border: '1px solid var(--df-border-subtle)', borderRadius: '8px', padding: '12px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                          <strong style={{ fontSize: '13px', color: 'var(--df-text-main)' }}>
                            #{i + 1} — {sub.registrationPlate} ({sub.makeModel})
                          </strong>
                          <span style={{ fontSize: '12px', fontWeight: 800, color: 'var(--df-accent-blue)' }}>
                            Score TOPSIS : {sub.totalScore100}/100
                          </span>
                        </div>
                        <div style={{ fontSize: '11.5px', color: 'var(--df-text-secondary)', lineHeight: 1.5 }}>
                          {sub.auditJustification} • Carburant estimé : <strong>{sub.estimatedFuelCostDzd.toLocaleString('fr-DZ')} DZD</strong>
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
                  style={{
                    width: '100%',
                    padding: '12px 18px',
                    borderRadius: '8px',
                    border: 'none',
                    background: '#059669',
                    color: '#ffffff',
                    fontWeight: 800,
                    fontSize: '14px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    boxShadow: 'var(--df-shadow-sm)',
                  }}
                >
                  <span>📜</span>
                  <span>Générer l&apos;Ordre de Mission Officiel Bilingue (FR/AR) & QR HMAC</span>
                </button>
              )}
            </div>
          ) : (
            <div style={{ background: 'var(--df-bg-surface-1)', border: '1px dashed var(--df-border-medium)', borderRadius: '14px', padding: '40px 24px', textAlign: 'center', color: 'var(--df-text-secondary)', marginBottom: '24px' }}>
              <div style={{ fontSize: '36px', marginBottom: '10px' }}>⚖️</div>
              <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--df-text-main)', margin: '0 0 6px 0' }}>
                En Attente d&apos;Évaluation Réglementaire
              </h3>
              <p style={{ fontSize: '13px', maxWidth: '420px', margin: '0 auto', lineHeight: 1.6 }}>
                Renseignez les paramètres de la mission à gauche puis cliquez sur <strong>Évaluer Éligibilité Réglementaire</strong> pour exécuter la machine à états et contrôler les 4 portes de conformité.
              </p>
            </div>
          )}

          {/* SIMULATEUR DE VÉRIFICATION HORS-LIGNE POUR LA GENDARMERIE / DGSN */}
          <div style={{ background: 'var(--df-bg-surface-1)', border: '1px solid var(--df-border-subtle)', borderRadius: '14px', padding: '20px', boxShadow: 'var(--df-shadow-sm)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
              <span style={{ fontSize: '18px' }}>🛡️</span>
              <h3 style={{ fontSize: '15px', fontWeight: 800, color: 'var(--df-text-main)', margin: 0 }}>
                Vérificateur Hors-Ligne (Contrôle Routier Gendarmerie / DGSN)
              </h3>
            </div>
            <p style={{ fontSize: '12px', color: 'var(--df-text-secondary)', lineHeight: 1.5, marginBottom: '12px' }}>
              Testez la validation cryptographique sans accès Internet (Mode 100% hors-ligne dans le Grand Sud) :
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '11px', color: 'var(--df-text-muted)', marginBottom: '3px' }}>
                  Chaîne lue par scan QR (Format DZOM) :
                </label>
                <input
                  type="text"
                  value={verifyQrText}
                  onChange={(e) => setVerifyQrText(e.target.value)}
                  placeholder="DZOM|OM-2026-161234|01492-319-16|198516012345678901|16|30|2026-11-04|FRET"
                  style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid var(--df-border-medium)', background: 'var(--df-bg-surface-2)', color: 'var(--df-text-main)', fontSize: '11px', fontFamily: 'monospace' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '11px', color: 'var(--df-text-muted)', marginBottom: '3px' }}>
                  Jeton de signature HMAC-SHA256 :
                </label>
                <input
                  type="text"
                  value={verifyTokenText}
                  onChange={(e) => setVerifyTokenText(e.target.value)}
                  placeholder="SIG-HMAC256-..."
                  style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid var(--df-border-medium)', background: 'var(--df-bg-surface-2)', color: 'var(--df-text-main)', fontSize: '11px', fontFamily: 'monospace' }}
                />
              </div>

              <button
                onClick={handleVerifyOfflineOrder}
                style={{
                  padding: '9px 14px',
                  borderRadius: '6px',
                  border: 'none',
                  background: 'var(--df-bg-surface-2)',
                  color: 'var(--df-text-main)',
                  fontWeight: 700,
                  fontSize: '12px',
                  cursor: 'pointer',
                  borderWidth: '1px',
                  borderStyle: 'solid',
                  borderColor: 'var(--df-border-medium)',
                }}
              >
                🔍 Vérifier l&apos;Authenticité Hors-Ligne
              </button>

              {verificationOutput && (
                <div style={{ marginTop: '8px', padding: '10px 12px', borderRadius: '6px', background: verificationOutput.isValid ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)', border: `1px solid ${verificationOutput.isValid ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`, fontSize: '12px' }}>
                  <div style={{ fontWeight: 800, color: verificationOutput.isValid ? '#059669' : '#dc2626' }}>
                    {verificationOutput.isValid ? '✓ ORDRE DE MISSION AUTHENTIQUE & VALIDE' : `✗ INVALIDITÉ : ${verificationOutput.reason}`}
                  </div>
                  {verificationOutput.decodedOrder && (
                    <div style={{ marginTop: '6px', fontSize: '11px', color: 'var(--df-text-secondary)', lineHeight: 1.5 }}>
                      Ordre : <strong>{verificationOutput.decodedOrder.orderNumber}</strong> • Véhicule : <strong>{verificationOutput.decodedOrder.registrationPlate}</strong> • Validité : <strong>{verificationOutput.decodedOrder.validUntil}</strong>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
