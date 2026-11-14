'use client';

import React, { useState, useMemo } from 'react';
import { useMaintenance } from '../../context/MaintenanceContext';
import { calculateRul } from '@docteurflotte/contracts';
import { IconCpu, IconZap, IconAlertTriangle } from '@/components/navigation/TechIcons';
import type { MaintenanceWorkOrderItem } from '../../types';

export function CanSimulatorBench() {
  const { fleet, workOrders, setWorkOrders, triggerNotification } = useMaintenance();

  const [simVehicleId, setSimVehicleId] = useState<string>(fleet[0]?.id || 'v-001');
  const [simCoolantTemp, setSimCoolantTemp] = useState<number>(92.0); // SPN 110 (°C)
  const [simOilPressure, setSimOilPressure] = useState<number>(3.6); // SPN 100 (bar)
  const [simApsPressure, setSimApsPressure] = useState<number>(9.8); // SPN 1087 (bar)
  const [simHydraulicTemp, setSimHydraulicTemp] = useState<number>(68.0); // SPN 1638 (°C)
  const [simBatteryVoltage, setSimBatteryVoltage] = useState<number>(26.8); // SPN 168 (V)
  const [simInjectedDtc, setSimInjectedDtc] = useState<string>('NONE');
  const [simDutyFactor, setSimDutyFactor] = useState<number>(0.85);
  const [simIdleHours, setSimIdleHours] = useState<number>(45);

  const simVehicle = useMemo(() => {
    return fleet.find((v) => v.id === simVehicleId) || fleet[0];
  }, [fleet, simVehicleId]);

  const simCalculationResult = useMemo(() => {
    const sensors = [];
    if (simCoolantTemp > 103.0) {
      sensors.push({
        parameterName: 'SPN 110 Temp Eau Culasse',
        value: simCoolantTemp,
        normalMax: 100,
        isAnomalous: true,
        penalty: 0.18,
      });
    }
    if (simOilPressure < 1.6) {
      sensors.push({
        parameterName: 'SPN 100 Pression Huile Basse',
        value: simOilPressure,
        normalMax: 4.5,
        isAnomalous: true,
        penalty: 0.35,
      });
    }
    if (simApsPressure < 8.0) {
      sensors.push({
        parameterName: 'SPN 1087 Pression Freinage APS',
        value: simApsPressure,
        normalMax: 10.5,
        isAnomalous: true,
        penalty: 0.25,
      });
    }
    if (simHydraulicTemp > 90.0) {
      sensors.push({
        parameterName: 'SPN 1638 Temp Huile Hydr',
        value: simHydraulicTemp,
        normalMax: 85,
        isAnomalous: true,
        penalty: 0.18,
      });
    }
    if (simBatteryVoltage < 23.5) {
      sensors.push({
        parameterName: 'SPN 168 Tension Alternateur',
        value: simBatteryVoltage,
        normalMax: 28.0,
        isAnomalous: true,
        penalty: 0.12,
      });
    }

    const dtcs = [];
    if (simInjectedDtc !== 'NONE') {
      const penalty = simInjectedDtc === 'P0087' ? 0.3 : simInjectedDtc === 'SPN-100-FMI-1' ? 0.35 : 0.2;
      dtcs.push({ code: simInjectedDtc, penalty });
    }

    return calculateRul({
      subsystem: 'ENGINE',
      severeDutyFactor: simDutyFactor,
      oemIntervalKm: 30000,
      oemIntervalEngineHours: 500,
      oemIntervalDays: 180,
      deltaOdometerKm: 21500,
      deltaEngineHours: 390,
      deltaDays: 80,
      idleHours: simIdleHours,
      avgDailyKm: simVehicle?.avgDailyKm || 280,
      avgDailyEngineHours: simVehicle?.avgDailyEngineHours || 7.5,
      sensors,
      dtcs,
    });
  }, [simVehicle, simCoolantTemp, simOilPressure, simApsPressure, simHydraulicTemp, simBatteryVoltage, simInjectedDtc, simDutyFactor, simIdleHours]);

  const handleCreateSimulatedWorkOrder = () => {
    if (!simVehicle) return;

    const newWo: MaintenanceWorkOrderItem = {
      id: `wo-auto-${Date.now()}`,
      workOrderNumber: `OT-AUTO-${Math.floor(1000 + Math.random() * 9000)}`,
      vehicleId: simVehicle.id,
      vehicleRegistration: simVehicle.registrationNumber,
      vehicleModel: `${simVehicle.make} ${simVehicle.model}`,
      triggerSource:
        simInjectedDtc !== 'NONE'
          ? 'TELEMETRY_DTC_CRITICAL'
          : simCalculationResult.requiresWorkOrder
          ? 'PREDICTIVE_RUL_DRIFT'
          : 'PREVENTIVE_KM_HOURS',
      priority:
        simCalculationResult.status === 'CRITICAL_OVERDUE'
          ? 'P1_IMMOBILIZATION'
          : 'P2_URGENT_48H',
      status: 'OPEN',
      subsystem: 'ENGINE',
      title: `Intervention d'urgence générée par banc d'essai CAN (${simVehicle.registrationNumber})`,
      description: `RUL critique simulée : ${simCalculationResult.rulRemainingHours?.toFixed(1) ?? '--'}h / ${simCalculationResult.rulRemainingKm?.toFixed(0) ?? '--'}km (Probabilité panne 30j : ${(simCalculationResult.failureProbability30d * 100).toFixed(1)}%). Accélération CAN: x${simCalculationResult.canAccelerationFactor.toFixed(2)}.`,
      estimatedCostDzd: 74000,
      downtimeHours: 5.0,
      partsRequired: ['Filtres et fluides de rechange', 'Sonde de contrôle température/pression'],
      assignedTechnician: 'Atelier Central (Attribution Automatique)',
      createdAt: new Date().toISOString().replace('T', ' ').substring(0, 16),
    };

    setWorkOrders([newWo, ...workOrders]);
    triggerNotification(`Ordre de travail ${newWo.workOrderNumber} créé avec succès depuis le banc d'essai.`);
  };

  return (
    <div
      style={{
        background: 'var(--df-bg-surface-1)',
        border: '1px solid var(--df-border-subtle)',
        borderRadius: 'var(--df-radius-lg)',
        padding: '20px',
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <IconCpu size={20} className="text-indigo-400" />
          <h2 style={{ fontSize: '16px', fontWeight: 800, color: '#fff', margin: 0 }}>
            Banc d'Essai Télémétrique & Injection de Signaux CAN J1939
          </h2>
        </div>
        <span style={{ fontSize: '11px', background: 'rgba(99, 102, 241, 0.15)', color: '#a5b4fc', padding: '3px 8px', borderRadius: '4px', fontWeight: 600 }}>
          Simulation Interactive
        </span>
      </div>

      {/* Target Asset Selector */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <label style={{ fontSize: '12px', color: 'var(--df-text-muted)' }}>Actif Cible :</label>
        <select
          value={simVehicleId}
          onChange={(e) => setSimVehicleId(e.target.value)}
          style={{
            background: 'var(--df-bg-surface-2)',
            border: '1px solid var(--df-border-medium)',
            borderRadius: '6px',
            color: '#fff',
            fontSize: '12.5px',
            padding: '6px 10px',
          }}
        >
          {fleet.map((v) => (
            <option key={v.id} value={v.id}>
              {v.registrationNumber} — {v.make} {v.model} ({v.protocolType})
            </option>
          ))}
        </select>
      </div>

      {/* Sliders Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '14px',
          background: 'var(--df-bg-base)',
          padding: '16px',
          borderRadius: '10px',
          border: '1px solid var(--df-border-subtle)',
        }}
      >
        {/* SPN 110 Coolant Temp */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', marginBottom: '4px' }}>
            <span style={{ color: 'var(--df-text-muted)' }}>SPN 110 Temp Eau Culasse :</span>
            <strong style={{ color: simCoolantTemp > 103 ? '#EF4444' : '#10B981' }}>{simCoolantTemp.toFixed(1)} °C</strong>
          </div>
          <input
            type="range"
            min="70"
            max="125"
            step="0.5"
            value={simCoolantTemp}
            onChange={(e) => setSimCoolantTemp(parseFloat(e.target.value))}
            style={{ width: '100%', accentColor: simCoolantTemp > 103 ? '#EF4444' : '#6366f1' }}
          />
        </div>

        {/* SPN 100 Oil Pressure */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', marginBottom: '4px' }}>
            <span style={{ color: 'var(--df-text-muted)' }}>SPN 100 Pression Huile :</span>
            <strong style={{ color: simOilPressure < 1.6 ? '#EF4444' : '#10B981' }}>{simOilPressure.toFixed(1)} bar</strong>
          </div>
          <input
            type="range"
            min="0.5"
            max="6.0"
            step="0.1"
            value={simOilPressure}
            onChange={(e) => setSimOilPressure(parseFloat(e.target.value))}
            style={{ width: '100%', accentColor: simOilPressure < 1.6 ? '#EF4444' : '#6366f1' }}
          />
        </div>

        {/* SPN 1087 APS Brake Pressure */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', marginBottom: '4px' }}>
            <span style={{ color: 'var(--df-text-muted)' }}>SPN 1087 Pression Frein APS :</span>
            <strong style={{ color: simApsPressure < 8.0 ? '#EF4444' : '#10B981' }}>{simApsPressure.toFixed(1)} bar</strong>
          </div>
          <input
            type="range"
            min="5.0"
            max="12.0"
            step="0.2"
            value={simApsPressure}
            onChange={(e) => setSimApsPressure(parseFloat(e.target.value))}
            style={{ width: '100%', accentColor: simApsPressure < 8.0 ? '#EF4444' : '#6366f1' }}
          />
        </div>

        {/* SPN 168 Alternator Voltage */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', marginBottom: '4px' }}>
            <span style={{ color: 'var(--df-text-muted)' }}>SPN 168 Tension Alternateur :</span>
            <strong style={{ color: simBatteryVoltage < 23.5 ? '#EF4444' : '#10B981' }}>{simBatteryVoltage.toFixed(1)} V</strong>
          </div>
          <input
            type="range"
            min="18.0"
            max="30.0"
            step="0.2"
            value={simBatteryVoltage}
            onChange={(e) => setSimBatteryVoltage(parseFloat(e.target.value))}
            style={{ width: '100%', accentColor: simBatteryVoltage < 23.5 ? '#EF4444' : '#6366f1' }}
          />
        </div>

        {/* Injected DTC */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', marginBottom: '4px' }}>
            <span style={{ color: 'var(--df-text-muted)' }}>Injection Code Défaut DTC :</span>
            <strong style={{ color: simInjectedDtc !== 'NONE' ? '#EF4444' : '#94a3b8' }}>{simInjectedDtc}</strong>
          </div>
          <select
            value={simInjectedDtc}
            onChange={(e) => setSimInjectedDtc(e.target.value)}
            style={{
              width: '100%',
              background: 'var(--df-bg-surface-2)',
              border: '1px solid var(--df-border-medium)',
              borderRadius: '6px',
              color: '#fff',
              fontSize: '11.5px',
              padding: '4px 6px',
            }}
          >
            <option value="NONE">Aucun défaut injecté</option>
            <option value="P0087">P0087 (Pression rampe carburant trop basse)</option>
            <option value="SPN-100-FMI-1">SPN 100 FMI 1 (Pression huile sous seuil critique)</option>
            <option value="SPN-110-FMI-0">SPN 110 FMI 0 (Surchauffe liquide refroidissement)</option>
          </select>
        </div>
      </div>

      {/* Recalculation Results Card */}
      <div
        style={{
          background: 'rgba(99, 102, 241, 0.08)',
          border: '1px solid rgba(99, 102, 241, 0.25)',
          borderRadius: '10px',
          padding: '16px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '14px',
        }}
      >
        <div>
          <div style={{ fontSize: '11px', color: '#a5b4fc', textTransform: 'uppercase', fontWeight: 700 }}>
            Impact RUL Direct sur {simVehicle?.registrationNumber} :
          </div>
          <div style={{ display: 'flex', gap: '16px', marginTop: '6px', flexWrap: 'wrap' }}>
            <div>
              <span style={{ fontSize: '11px', color: 'var(--df-text-muted)' }}>RUL Heures : </span>
              <strong style={{ fontSize: '15px', color: '#F59E0B' }}>
                {simCalculationResult.rulRemainingHours?.toFixed(1) ?? '--'} h
              </strong>
            </div>
            <div>
              <span style={{ fontSize: '11px', color: 'var(--df-text-muted)' }}>RUL Kilomètres : </span>
              <strong style={{ fontSize: '15px', color: '#F59E0B' }}>
                {simCalculationResult.rulRemainingKm?.toFixed(0) ?? '--'} km
              </strong>
            </div>
            <div>
              <span style={{ fontSize: '11px', color: 'var(--df-text-muted)' }}>Probabilité Panne (30j) : </span>
              <strong style={{ fontSize: '15px', color: simCalculationResult.failureProbability30d > 0.4 ? '#EF4444' : '#10B981' }}>
                {(simCalculationResult.failureProbability30d * 100).toFixed(1)}%
              </strong>
            </div>
            <div>
              <span style={{ fontSize: '11px', color: 'var(--df-text-muted)' }}>Facteur Accélération CAN : </span>
              <strong style={{ fontSize: '15px', color: '#38BDF8' }}>
                x{simCalculationResult.canAccelerationFactor.toFixed(2)}
              </strong>
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={handleCreateSimulatedWorkOrder}
          style={{
            background: 'linear-gradient(135deg, #EF4444 0%, #DC2626 100%)',
            border: 'none',
            borderRadius: '8px',
            color: '#fff',
            padding: '10px 18px',
            fontSize: '12.5px',
            fontWeight: 700,
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            boxShadow: '0 4px 12px rgba(239, 68, 68, 0.3)',
          }}
        >
          <IconZap size={14} />
          <span>Déclencher OT d'Urgence</span>
        </button>
      </div>
    </div>
  );
}

