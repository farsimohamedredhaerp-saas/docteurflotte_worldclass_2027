'use client';

import React, { useState, useMemo } from 'react';
import { TelemetryTier, TELEMETRY_TIER_CAPABILITIES } from '@docteurflotte/contracts';

export interface VehicleMapMarker {
  id: string;
  plate: string;
  brandModel: string;
  driverPseudonym: string;
  telemetryTier: TelemetryTier;
  wilayaCode: number;
  wilayaName: string;
  latitude: number;
  longitude: number;
  speedKmh: number;
  oilRulRemainingKm: number;
  fuelLevelPct: number;
  hasCusumAlert: boolean;
  roadGradePercent: number;
  corridorName: string;
}

export interface AlgerianCorridor {
  id: string;
  code: string;
  nameFr: string;
  nameAr: string;
  lengthKm: number;
  keyStops: string[];
  climateRisk: 'HIGH_HEAT_SAND' | 'MOUNTAIN_PASSES' | 'COASTAL_HUMIDITY';
}

export const ALGERIA_MAJOR_CORRIDORS: AlgerianCorridor[] = [
  {
    id: 'corridor-rn1',
    code: 'RN1',
    nameFr: 'Axe Transsaharien Nord-Sud (Alger — Tamanrasset)',
    nameAr: 'الطريق الوطني رقم 1 — العابر للصحراء',
    lengthKm: 2300,
    keyStops: ['Alger (16)', 'Blida / Chiffa (09)', 'Médéa (26)', 'Djelfa (17)', 'Ghardaïa (47)', 'In Salah (53)', 'Tamanrasset (11)'],
    climateRisk: 'HIGH_HEAT_SAND',
  },
  {
    id: 'corridor-a1',
    code: 'A1',
    nameFr: 'Autoroute Est-Ouest (Frontière Maroc — Frontière Tunisie)',
    nameAr: 'الطريق السيار شرق-غرب',
    lengthKm: 1216,
    keyStops: ['Tlemcen (13)', 'Oran (31)', 'Chlef (02)', 'Alger (16)', 'Bouira (10)', 'Sétif (19)', 'Constantine (25)', 'Annaba (23)'],
    climateRisk: 'MOUNTAIN_PASSES',
  },
  {
    id: 'corridor-rn3',
    code: 'RN3',
    nameFr: 'Axe Pétrochimique & Minier (Skikda — Hassi Messaoud — Illizi)',
    nameAr: 'الطريق الوطني رقم 3 — محور حاسي مسعود',
    lengthKm: 1100,
    keyStops: ['Skikda (21)', 'Constantine (25)', 'Batna (05)', 'Biskra (07)', 'Touggourt (55)', 'Ouargla (30)', 'Illizi (33)'],
    climateRisk: 'HIGH_HEAT_SAND',
  },
  {
    id: 'corridor-rn6',
    code: 'RN6',
    nameFr: 'Axe Ouest Saharien (Oran — Béchar — Adrar — Tindouf)',
    nameAr: 'الطريق الوطني رقم 6 — الجنوب الغربي',
    lengthKm: 1450,
    keyStops: ['Oran (31)', 'Mascara (29)', 'Saïda (20)', 'Béchar (08)', 'Béni Abbès (52)', 'Adrar (01)'],
    climateRisk: 'HIGH_HEAT_SAND',
  },
];

export interface MapLibreCorridorsMapProps {
  vehicles?: VehicleMapMarker[];
  onSelectVehicle?: (vehicle: VehicleMapMarker) => void;
  selectedVehicleId?: string;
}

export function MapLibreCorridorsMap({
  vehicles = [],
  onSelectVehicle,
  selectedVehicleId,
}: MapLibreCorridorsMapProps) {
  const [activeCorridorId, setActiveCorridorId] = useState<string>('corridor-rn1');
  const [filterTier, setFilterTier] = useState<TelemetryTier | 'ALL'>('ALL');
  const [selectedVehicle, setSelectedVehicle] = useState<VehicleMapMarker | null>(null);

  // Exemple de véhicules par défaut si non fournis
  const displayVehicles = useMemo(() => {
    if (vehicles.length > 0) return vehicles;

    return [
      {
        id: 'v-shacman-01',
        plate: '01-104-16',
        brandModel: 'Shacman X3000 6x4 Weichai WP12',
        driverPseudonym: 'CHAUFFEUR-MB-8A2F',
        telemetryTier: TelemetryTier.MODE_2_CAN_J1939,
        wilayaCode: 1, // Adrar
        wilayaName: 'Adrar',
        latitude: 27.87,
        longitude: -0.29,
        speedKmh: 68,
        oilRulRemainingKm: 4200,
        fuelLevelPct: 72,
        hasCusumAlert: false,
        roadGradePercent: 0.8,
        corridorName: 'RN6 (Axe Ouest)',
      },
      {
        id: 'v-renault-02',
        plate: '16-224-09',
        brandModel: 'Renault Trucks Kerax 440 DXi',
        driverPseudonym: 'CHAUFFEUR-AH-91BC',
        telemetryTier: TelemetryTier.MODE_2_CAN_J1939,
        wilayaCode: 9, // Blida / Chiffa
        wilayaName: 'Blida',
        latitude: 36.47,
        longitude: 2.83,
        speedKmh: 42,
        oilRulRemainingKm: 11500,
        fuelLevelPct: 54,
        hasCusumAlert: false,
        roadGradePercent: 8.5, // Gorges de la Chiffa
        corridorName: 'RN1 (Transsaharienne)',
      },
      {
        id: 'v-isuzu-03',
        plate: '30-410-18',
        brandModel: 'Isuzu FTR 15T',
        driverPseudonym: 'CHAUFFEUR-SK-33DE',
        telemetryTier: TelemetryTier.MODE_1_GNSS,
        wilayaCode: 30, // Ouargla
        wilayaName: 'Ouargla',
        latitude: 31.95,
        longitude: 5.32,
        speedKmh: 82,
        oilRulRemainingKm: 6800,
        fuelLevelPct: 38,
        hasCusumAlert: false,
        roadGradePercent: 0.2,
        corridorName: 'RN3 (Hassi Messaoud)',
      },
      {
        id: 'v-van-04',
        plate: '16-890-21',
        brandModel: 'Renault Master 2.3 dCi',
        driverPseudonym: 'CHAUFFEUR-YB-12FA',
        telemetryTier: TelemetryTier.MODE_0_DECLARATIVE,
        wilayaCode: 16, // Alger
        wilayaName: 'Alger',
        latitude: 36.75,
        longitude: 3.05,
        speedKmh: 0,
        oilRulRemainingKm: 8500,
        fuelLevelPct: 90,
        hasCusumAlert: false,
        roadGradePercent: 1.0,
        corridorName: 'Autoroute A1 Est-Ouest',
      },
    ] as VehicleMapMarker[];
  }, [vehicles]);

  const filteredVehicles = useMemo(() => {
    if (filterTier === 'ALL') return displayVehicles;
    return displayVehicles.filter((v) => v.telemetryTier === filterTier);
  }, [displayVehicles, filterTier]);

  const activeCorridor = useMemo(() => {
    return ALGERIA_MAJOR_CORRIDORS.find((c) => c.id === activeCorridorId) || ALGERIA_MAJOR_CORRIDORS[0];
  }, [activeCorridorId]);

  const handleSelect = (v: VehicleMapMarker) => {
    setSelectedVehicle(v);
    if (onSelectVehicle) onSelectVehicle(v);
  };

  const getTierBadge = (tier: TelemetryTier) => {
    switch (tier) {
      case TelemetryTier.MODE_2_CAN_J1939:
        return {
          bg: 'var(--df-status-ok-bg)',
          color: 'var(--df-status-ok-text)',
          border: 'var(--df-status-ok-border)',
          label: 'Mode 2 · Full CAN J1939',
        };
      case TelemetryTier.MODE_1_GNSS:
        return {
          bg: 'var(--df-accent-blue-subtle)',
          color: 'var(--df-accent-blue)',
          border: 'var(--df-accent-blue)',
          label: 'Mode 1 · GNSS Standard',
        };
      case TelemetryTier.MODE_0_DECLARATIVE:
      default:
        return {
          bg: 'var(--df-bg-surface-2)',
          color: 'var(--df-text-secondary)',
          border: 'var(--df-border-subtle)',
          label: 'Mode 0 · Déclaratif (DVIR)',
        };
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', width: '100%' }}>
      {/* Barre de contrôle des Corridors et des Paliers */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '12px',
          padding: '14px 18px',
          backgroundColor: 'var(--df-bg-surface-1)',
          borderRadius: 'var(--df-radius-md)',
          border: '1px solid var(--df-border-subtle)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontWeight: 600, fontSize: '14px', color: 'var(--df-text-main)' }}>Corridor Logistique :</span>
          <select
            value={activeCorridorId}
            onChange={(e) => setActiveCorridorId(e.target.value)}
            style={{
              padding: '6px 12px',
              borderRadius: 'var(--df-radius-sm)',
              border: '1px solid var(--df-border-subtle)',
              fontSize: '13px',
              fontWeight: 500,
              backgroundColor: 'var(--df-bg-surface-2)',
              color: 'var(--df-text-main)',
            }}
          >
            {ALGERIA_MAJOR_CORRIDORS.map((c) => (
              <option key={c.id} value={c.id}>
                {c.code} — {c.nameFr}
              </option>
            ))}
          </select>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '13px', color: 'var(--df-text-muted)', fontWeight: 500 }}>Palier Matériel :</span>
          {(['ALL', TelemetryTier.MODE_2_CAN_J1939, TelemetryTier.MODE_1_GNSS, TelemetryTier.MODE_0_DECLARATIVE] as const).map(
            (t) => {
              const isSelected = filterTier === t;
              return (
                <button
                  key={t}
                  onClick={() => setFilterTier(t)}
                  style={{
                    padding: '4px 10px',
                    borderRadius: 'var(--df-radius-sm)',
                    fontSize: '12px',
                    fontWeight: 500,
                    cursor: 'pointer',
                    border: isSelected ? '1px solid var(--df-accent-blue)' : '1px solid var(--df-border-subtle)',
                    backgroundColor: isSelected ? 'var(--df-accent-blue-subtle)' : 'var(--df-bg-surface-1)',
                    color: isSelected ? 'var(--df-accent-blue)' : 'var(--df-text-secondary)',
                  }}
                >
                  {t === 'ALL' ? 'Tous les Actifs' : t === TelemetryTier.MODE_2_CAN_J1939 ? 'Mode 2 (CAN)' : t === TelemetryTier.MODE_1_GNSS ? 'Mode 1 (GPS)' : 'Mode 0 (DVIR)'}
                </button>
              );
            },
          )}
        </div>
      </div>

      {/* Rendu Cartographique Vectoriel Souverain */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: selectedVehicle ? '2fr 1fr' : '1fr',
          gap: '16px',
          minHeight: '480px',
        }}
      >
        <div
          style={{
            position: 'relative',
            backgroundColor: '#0F172A',
            borderRadius: '12px',
            overflow: 'hidden',
            border: '1px solid #334155',
            padding: '20px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
          }}
        >
          {/* Header Map */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', zIndex: 10 }}>
            <div>
              <div style={{ color: '#38BDF8', fontSize: '12px', fontWeight: 600, letterSpacing: '0.05em' }}>
                MAPLIBRE SOUVERAINE · RÉSEAU ROUTIER ALGORITHMIQUE DES 58 WILAYAS
              </div>
              <h3 style={{ color: '#F8FAFC', margin: '4px 0 0 0', fontSize: '18px' }}>
                {activeCorridor.nameFr}
              </h3>
              <div style={{ color: '#94A3B8', fontSize: '12px', marginTop: '2px' }}>
                Longueur: {activeCorridor.lengthKm.toLocaleString()} km · Risque: {activeCorridor.climateRisk === 'HIGH_HEAT_SAND' ? 'Canicule & Silice Saharienne' : 'Cols Montagneux & Dévers'}
              </div>
            </div>

            <span
              style={{
                backgroundColor: '#1E293B',
                color: '#10B981',
                padding: '4px 10px',
                borderRadius: '20px',
                fontSize: '11px',
                fontWeight: 600,
                border: '1px solid #059669',
              }}
            >
              100% Hors-Ligne · Loi 18-07 ANPDP
            </span>
          </div>

          {/* Canvas Stylisé des Corridors et Villes Algériennes */}
          <div
            style={{
              position: 'relative',
              width: '100%',
              height: '320px',
              margin: '20px 0',
              background: 'radial-gradient(circle at 50% 30%, #1E293B 0%, #0B1120 100%)',
              borderRadius: '8px',
              border: '1px solid #1E293B',
              overflow: 'hidden',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {/* Points d étapes du corridor */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-around',
                alignItems: 'center',
                width: '90%',
                position: 'relative',
              }}
            >
              <div
                style={{
                  position: 'absolute',
                  top: '50%',
                  left: '5%',
                  right: '5%',
                  height: '3px',
                  backgroundColor: '#0284C7',
                  zIndex: 1,
                  transform: 'translateY(-50%)',
                }}
              />

              {activeCorridor.keyStops.map((stop, i) => (
                <div
                  key={stop}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '6px',
                    zIndex: 2,
                  }}
                >
                  <div
                    style={{
                      width: '14px',
                      height: '14px',
                      borderRadius: '50%',
                      backgroundColor: i === 0 || i === activeCorridor.keyStops.length - 1 ? '#38BDF8' : '#64748B',
                      border: '2px solid #0F172A',
                    }}
                  />
                  <span style={{ color: '#E2E8F0', fontSize: '11px', fontWeight: 500, whiteSpace: 'nowrap' }}>
                    {stop.split(' ')[0]}
                  </span>
                </div>
              ))}
            </div>

            {/* Badges Véhicules Positionnés sur la carte */}
            <div
              style={{
                position: 'absolute',
                bottom: '15px',
                left: '20px',
                right: '20px',
                display: 'flex',
                flexWrap: 'wrap',
                gap: '10px',
                zIndex: 5,
              }}
            >
              {filteredVehicles.map((v) => {
                const badge = getTierBadge(v.telemetryTier);
                const isCurrent = selectedVehicle?.id === v.id;
                return (
                  <div
                    key={v.id}
                    onClick={() => handleSelect(v)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '6px 12px',
                      borderRadius: '8px',
                      backgroundColor: isCurrent ? '#0369A1' : '#1E293B',
                      border: isCurrent ? '2px solid #38BDF8' : '1px solid #334155',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    <span
                      style={{
                        width: '8px',
                        height: '8px',
                        borderRadius: '50%',
                        backgroundColor: v.hasCusumAlert ? '#EF4444' : v.speedKmh > 0 ? '#10B981' : '#F59E0B',
                      }}
                    />
                    <div style={{ textAlign: 'left' }}>
                      <div style={{ color: '#F8FAFC', fontSize: '12px', fontWeight: 600 }}>{v.plate}</div>
                      <div style={{ color: '#94A3B8', fontSize: '10px' }}>
                        {v.wilayaName} · {v.speedKmh} km/h
                      </div>
                    </div>
                    <span
                      style={{
                        fontSize: '9px',
                        fontWeight: 700,
                        padding: '2px 6px',
                        borderRadius: '4px',
                        backgroundColor: badge.bg,
                        color: badge.color,
                        marginLeft: '4px',
                      }}
                    >
                      {v.telemetryTier === TelemetryTier.MODE_2_CAN_J1939 ? 'CAN' : v.telemetryTier === TelemetryTier.MODE_1_GNSS ? 'GPS' : 'M0'}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Footer Map */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              borderTop: '1px solid #1E293B',
              paddingTop: '12px',
              fontSize: '12px',
              color: '#64748B',
            }}
          >
            <span>Topographie Valhalla : Compensation dynamique de pente & altitude active</span>
            <span>{filteredVehicles.length} véhicule(s) supervisé(s)</span>
          </div>
        </div>

        {/* Tiroir d'Inspection Tactique du Véhicule Sélectionné */}
        {selectedVehicle && (
          <div
            style={{
              backgroundColor: 'var(--df-bg-surface-1)',
              borderRadius: 'var(--df-radius-lg)',
              border: '1px solid var(--df-border-subtle)',
              padding: '20px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              boxShadow: 'var(--df-shadow-md)',
            }}
          >
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <h4 style={{ margin: 0, fontSize: '16px', color: 'var(--df-text-main)' }}>{selectedVehicle.plate}</h4>
                  <div style={{ fontSize: '13px', color: 'var(--df-text-secondary)', marginTop: '2px' }}>
                    {selectedVehicle.brandModel}
                  </div>
                </div>
                <button
                  onClick={() => setSelectedVehicle(null)}
                  style={{
                    background: 'none',
                    border: 'none',
                    fontSize: '18px',
                    color: 'var(--df-text-muted)',
                    cursor: 'pointer',
                  }}
                >
                  &times;
                </button>
              </div>

              {/* Badge de palier */}
              <div style={{ marginTop: '12px' }}>
                {(() => {
                  const b = getTierBadge(selectedVehicle.telemetryTier);
                  return (
                    <span
                      style={{
                        display: 'inline-block',
                        padding: '4px 10px',
                        borderRadius: 'var(--df-radius-xs)',
                        backgroundColor: b.bg,
                        color: b.color,
                        border: `1px solid ${b.border}`,
                        fontSize: '11px',
                        fontWeight: 600,
                      }}
                    >
                      {b.label}
                    </span>
                  );
                })()}
              </div>

              {/* Métriques télématiques et d usure */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: '10px',
                  marginTop: '16px',
                }}
              >
                <div style={{ backgroundColor: 'var(--df-bg-surface-2)', padding: '10px', borderRadius: 'var(--df-radius-sm)' }}>
                  <div style={{ fontSize: '11px', color: 'var(--df-text-muted)' }}>Chauffeur (Loi 18-07)</div>
                  <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--df-text-main)' }}>
                    {selectedVehicle.driverPseudonym}
                  </div>
                </div>

                <div style={{ backgroundColor: 'var(--df-bg-surface-2)', padding: '10px', borderRadius: 'var(--df-radius-sm)' }}>
                  <div style={{ fontSize: '11px', color: 'var(--df-text-muted)' }}>Position Wilaya</div>
                  <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--df-text-main)' }}>
                    {selectedVehicle.wilayaName} ({selectedVehicle.wilayaCode})
                  </div>
                </div>

                <div style={{ backgroundColor: 'var(--df-bg-surface-2)', padding: '10px', borderRadius: 'var(--df-radius-sm)' }}>
                  <div style={{ fontSize: '11px', color: 'var(--df-text-muted)' }}>RUL Huile Restant</div>
                  <div className="df-mono" style={{ fontSize: '13px', fontWeight: 700, color: selectedVehicle.oilRulRemainingKm < 5000 ? 'var(--df-status-danger)' : 'var(--df-status-ok)' }}>
                    {selectedVehicle.oilRulRemainingKm.toLocaleString('fr-DZ')} km
                  </div>
                </div>

                <div style={{ backgroundColor: 'var(--df-bg-surface-2)', padding: '10px', borderRadius: 'var(--df-radius-sm)' }}>
                  <div style={{ fontSize: '11px', color: 'var(--df-text-muted)' }}>Pente Valhalla</div>
                  <div className="df-mono" style={{ fontSize: '12px', fontWeight: 600, color: 'var(--df-text-main)' }}>
                    {selectedVehicle.roadGradePercent}%
                  </div>
                </div>
              </div>

              {/* Statut CUSUM Anti-Fraude */}
              <div
                style={{
                  marginTop: '16px',
                  padding: '12px',
                  borderRadius: 'var(--df-radius-sm)',
                  backgroundColor: selectedVehicle.hasCusumAlert ? 'var(--df-status-danger-bg)' : 'var(--df-status-ok-bg)',
                  border: `1px solid ${selectedVehicle.hasCusumAlert ? 'var(--df-status-danger-border)' : 'var(--df-status-ok-border)'}`,
                }}
              >
                <div style={{ fontSize: '12px', fontWeight: 600, color: selectedVehicle.hasCusumAlert ? 'var(--df-status-danger-text)' : 'var(--df-status-ok-text)' }}>
                  {selectedVehicle.hasCusumAlert ? 'Alerte CUSUM : Baisse anormale détectée' : 'Traçabilité Carburant : Intégrité conforme'}
                </div>
                <div style={{ fontSize: '11px', color: selectedVehicle.hasCusumAlert ? 'var(--df-status-danger-text)' : 'var(--df-status-ok-text)', marginTop: '4px' }}>
                  {selectedVehicle.telemetryTier === TelemetryTier.MODE_0_DECLARATIVE
                    ? 'Mode 0 : Contrôle par réconciliation des tickets Naftal et odomètre Valhalla.'
                    : `Compensation d'assiette active pour pente de ${selectedVehicle.roadGradePercent}%. Faux positifs de ballottement éliminés.`}
                </div>
              </div>
            </div>

            <div style={{ marginTop: '20px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <a
                href={`/digital-twin?assetId=${selectedVehicle.id}`}
                style={{
                  display: 'block',
                  textAlign: 'center',
                  padding: '9px 14px',
                  borderRadius: 'var(--df-radius-sm)',
                  backgroundColor: 'var(--df-accent-blue)',
                  color: 'var(--df-text-on-accent)',
                  fontWeight: 600,
                  fontSize: '13px',
                  textDecoration: 'none',
                }}
              >
                Ouvrir dans Jumeau Numérique 5.0
              </a>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

