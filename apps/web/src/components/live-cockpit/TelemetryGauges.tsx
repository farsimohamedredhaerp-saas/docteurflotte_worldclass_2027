'use client';

import React from 'react';
import { CanBusMetrics, GpsCoordinates } from './types';
import {
  IconGauge,
  IconFlame,
  IconAlertTriangle,
  IconActivity,
  IconZap,
} from '../navigation/TechIcons';

interface TelemetryGaugesProps {
  can: CanBusMetrics;
  gps: GpsCoordinates;
}

export function TelemetryGauges({ can, gps }: TelemetryGaugesProps) {
  // Calcul tachymétrique RPM segmenté (30 segments de 100 RPM chacun, max 3000 RPM)
  const totalSegments = 30;
  const currentSegment = Math.min(
    totalSegments,
    Math.round(can.engineRpm / 100)
  );

  const isRpmOptimal = can.engineRpm >= 1100 && can.engineRpm <= 1650;
  const isRpmRedline = can.engineRpm > 2100;
  const isCoolantWarning = can.coolantTempC > 102;
  const isOilWarning = can.oilPressureBar < 1.2;

  // Données synthétiques de mini sparkline 5 minutes pour Coolant et Huile
  const coolantSparkPoints = [88, 89, 90, 91, 91, 92, 92, can.coolantTempC];
  const oilSparkPoints = [3.8, 3.7, 3.6, 3.7, 3.6, 3.5, can.oilPressureBar];

  return (
    <div className="flex flex-col gap-3">
      {/* 1. BLOC CINÉMATIQUE PRIMAIRE : VITESSE & TACHYMÈTRE */}
      <div
        className="p-3 rounded-sm"
        style={{
          backgroundColor: 'var(--df-cockpit-card-bg)',
          border: '1px solid var(--df-cockpit-border)',
        }}
      >
        <div
          className="flex items-center justify-between pb-2 mb-2.5"
          style={{ borderBottom: '1px solid var(--df-cockpit-border)' }}
        >
          <span
            className="text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5"
            style={{ color: 'var(--df-cockpit-text-title)' }}
          >
            <IconGauge size={13} className="text-blue-500" />
            Cinématique & Moteur Primaire
          </span>
          <div className="flex items-center gap-2 text-[10px] font-mono">
            <span style={{ color: 'var(--df-cockpit-text-muted)' }}>Rapport :</span>
            <span
              className="px-1.5 py-0.2 font-bold rounded-xs"
              style={{
                backgroundColor: 'var(--df-accent-blue-subtle)',
                color: 'var(--df-accent-blue)',
                border: '1px solid var(--df-accent-blue)',
              }}
            >
              {can.transmissionGear}
            </span>
            <span
              className="px-1.5 py-0.2 rounded-xs border font-bold"
              style={
                can.parkingBrakeEngaged
                  ? {
                      backgroundColor: 'var(--df-status-danger-bg)',
                      border: '1px solid var(--df-status-danger-border)',
                      color: 'var(--df-status-danger-text)',
                    }
                  : {
                      backgroundColor: 'var(--df-cockpit-card-hover)',
                      border: '1px solid var(--df-cockpit-border)',
                      color: 'var(--df-cockpit-text-muted)',
                    }
              }
            >
              {can.parkingBrakeEngaged ? 'FREIN SERRÉ' : 'DESSERRÉ'}
            </span>
          </div>
        </div>

        {/* Double compteur : Vitesse GPS vs Vitesse Roues CAN */}
        <div className="grid grid-cols-2 gap-3 mb-3">
          {/* Vitesse GPS */}
          <div
            className="p-2 rounded-xs flex flex-col"
            style={{
              backgroundColor: 'var(--df-cockpit-sidebar-bg)',
              border: '1px solid var(--df-cockpit-border)',
            }}
          >
            <div className="flex items-center justify-between text-[10px] font-mono" style={{ color: 'var(--df-cockpit-text-muted)' }}>
              <span>VITESSE GPS</span>
              <span className="text-[9px] text-emerald-500 font-bold">GNSS</span>
            </div>
            <div className="flex items-baseline gap-1 mt-0.5">
              <span
                className="text-2xl font-mono font-bold tabular-nums tracking-tight"
                style={{ color: 'var(--df-cockpit-text-title)' }}
              >
                {Math.round(gps.speedKmh)}
              </span>
              <span className="text-[11px] font-mono uppercase" style={{ color: 'var(--df-cockpit-text-muted)' }}>km/h</span>
            </div>
          </div>

          {/* Vitesse Roues (CAN SPN 84) */}
          <div
            className="p-2 rounded-xs flex flex-col"
            style={{
              backgroundColor: 'var(--df-cockpit-sidebar-bg)',
              border: '1px solid var(--df-cockpit-border)',
            }}
          >
            <div className="flex items-center justify-between text-[10px] font-mono" style={{ color: 'var(--df-cockpit-text-muted)' }}>
              <span>VITESSE CAN</span>
              <span className="text-[9px] text-blue-500 font-bold">SPN 84</span>
            </div>
            <div className="flex items-baseline gap-1 mt-0.5">
              <span
                className="text-2xl font-mono font-bold tabular-nums tracking-tight text-blue-600 dark:text-blue-300"
              >
                {can.wheelSpeedKmh.toFixed(1)}
              </span>
              <span className="text-[11px] font-mono uppercase" style={{ color: 'var(--df-cockpit-text-muted)' }}>km/h</span>
            </div>
          </div>
        </div>

        {/* Tachymètre Régime Moteur (RPM) Segmenté Haute Définition */}
        <div
          className="p-2.5 rounded-xs"
          style={{
            backgroundColor: 'var(--df-cockpit-sidebar-bg)',
            border: '1px solid var(--df-cockpit-border)',
          }}
        >
          <div className="flex items-center justify-between text-[11px] font-mono mb-1.5">
            <div className="flex items-center gap-1.5">
              <span className="uppercase text-[10px] tracking-wide" style={{ color: 'var(--df-cockpit-text-muted)' }}>
                Régime Moteur (SPN 190)
              </span>
              {isRpmOptimal && (
                <span
                  className="text-[8px] px-1 py-0.2 font-bold rounded-xs"
                  style={{
                    backgroundColor: 'var(--df-status-ok-bg)',
                    border: '1px solid var(--df-status-ok-border)',
                    color: 'var(--df-status-ok-text)',
                  }}
                >
                  PLAGE ÉCO
                </span>
              )}
              {isRpmRedline && (
                <span
                  className="text-[8px] px-1 py-0.2 font-bold rounded-xs animate-pulse"
                  style={{
                    backgroundColor: 'var(--df-status-danger-bg)',
                    border: '1px solid var(--df-status-danger-border)',
                    color: 'var(--df-status-danger-text)',
                  }}
                >
                  ZONE ROUGE
                </span>
              )}
            </div>
            <div className="flex items-baseline gap-1 font-bold">
              <span
                className="text-lg tabular-nums"
                style={{
                  color: isRpmRedline
                    ? 'var(--df-status-danger-text)'
                    : isRpmOptimal
                    ? 'var(--df-status-ok-text)'
                    : 'var(--df-cockpit-text-title)',
                }}
              >
                {can.engineRpm.toLocaleString()}
              </span>
              <span className="text-[10px] font-normal" style={{ color: 'var(--df-cockpit-text-muted)' }}>RPM</span>
            </div>
          </div>

          {/* Grille de 30 barres de progression segmentées */}
          <div
            className="grid grid-cols-30 gap-0.5 h-3.5 p-0.5 rounded-xs"
            style={{
              backgroundColor: 'var(--df-cockpit-card-bg)',
              border: '1px solid var(--df-cockpit-border)',
            }}
          >
            {Array.from({ length: totalSegments }).map((_, idx) => {
              const segmentValue = (idx + 1) * 100;
              const isActive = idx < currentSegment;

              // Définition des couleurs selon la zone industrielle J1939
              let segmentColor = 'bg-slate-300 dark:bg-slate-700/60';
              if (isActive) {
                if (segmentValue <= 1000) {
                  segmentColor = 'bg-blue-500';
                } else if (segmentValue <= 1650) {
                  segmentColor = 'bg-emerald-500'; // Green band couple max
                } else if (segmentValue <= 2100) {
                  segmentColor = 'bg-amber-500';
                } else {
                  segmentColor = 'bg-rose-500'; // Sursouffle / Zone rouge
                }
              }

              return (
                <div
                  key={idx}
                  className={`h-full rounded-xxs transition-all duration-100 ${segmentColor}`}
                  title={`${segmentValue} RPM`}
                />
              );
            })}
          </div>

          {/* Légende du compte-tours */}
          <div className="flex justify-between text-[8px] font-mono mt-1" style={{ color: 'var(--df-cockpit-text-muted)' }}>
            <span>0</span>
            <span className="text-emerald-600 dark:text-emerald-400 font-bold">1100 - 1650 (Zone Optimum)</span>
            <span className="text-rose-600 dark:text-rose-400 font-bold">2100+ (Max)</span>
            <span>3000</span>
          </div>
        </div>

        {/* Charge Moteur & Accélérateur */}
        <div
          className="grid grid-cols-2 gap-2 mt-2 pt-2"
          style={{ borderTop: '1px solid var(--df-cockpit-border)' }}
        >
          {/* Charge Moteur % */}
          <div className="flex flex-col gap-1">
            <div className="flex justify-between text-[9px] font-mono" style={{ color: 'var(--df-cockpit-text-muted)' }}>
              <span>CHARGE MOTEUR</span>
              <span className="font-bold tabular-nums" style={{ color: 'var(--df-cockpit-text-title)' }}>
                {can.engineLoadPercent}%
              </span>
            </div>
            <div
              className="h-1.5 rounded-xs overflow-hidden"
              style={{ backgroundColor: 'var(--df-cockpit-border)' }}
            >
              <div
                className={`h-full transition-all ${
                  can.engineLoadPercent > 85 ? 'bg-rose-500' : 'bg-blue-500'
                }`}
                style={{ width: `${can.engineLoadPercent}%` }}
              />
            </div>
          </div>

          {/* Pédale Accélérateur % */}
          <div className="flex flex-col gap-1">
            <div className="flex justify-between text-[9px] font-mono" style={{ color: 'var(--df-cockpit-text-muted)' }}>
              <span>ACCÉLÉRATEUR</span>
              <span className="font-bold tabular-nums" style={{ color: 'var(--df-cockpit-text-title)' }}>
                {can.throttlePercent}%
              </span>
            </div>
            <div
              className="h-1.5 rounded-xs overflow-hidden"
              style={{ backgroundColor: 'var(--df-cockpit-border)' }}
            >
              <div
                className="h-full bg-emerald-500 transition-all"
                style={{ width: `${can.throttlePercent}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* 2. GRILLE THERMIQUE & FLUIDES AVEC SPARKLINES 5 MIN */}
      <div
        className="p-3 rounded-sm"
        style={{
          backgroundColor: 'var(--df-cockpit-card-bg)',
          border: '1px solid var(--df-cockpit-border)',
        }}
      >
        <div
          className="flex items-center justify-between pb-2 mb-2.5"
          style={{ borderBottom: '1px solid var(--df-cockpit-border)' }}
        >
          <span
            className="text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5"
            style={{ color: 'var(--df-cockpit-text-title)' }}
          >
            <IconFlame size={13} className="text-amber-500" />
            Thermique, Pressions & Fluides
          </span>
          <span className="text-[9px] font-mono uppercase" style={{ color: 'var(--df-cockpit-text-muted)' }}>
            Capteurs J1939 Calibrés
          </span>
        </div>

        <div className="grid grid-cols-2 gap-2.5">
          {/* Température Liquide de Refroidissement */}
          <div
            className="p-2 rounded-xs border flex flex-col justify-between"
            style={
              isCoolantWarning
                ? {
                    backgroundColor: 'var(--df-status-danger-bg)',
                    borderColor: 'var(--df-status-danger-border)',
                  }
                : {
                    backgroundColor: 'var(--df-cockpit-sidebar-bg)',
                    borderColor: 'var(--df-cockpit-border)',
                  }
            }
          >
            <div className="flex items-center justify-between text-[9px] font-mono" style={{ color: 'var(--df-cockpit-text-muted)' }}>
              <span>LQD REFROIDISSEMENT</span>
              <span className="text-[8px]">SPN 110</span>
            </div>
            <div className="flex items-baseline justify-between mt-1">
              <span
                className={`text-lg font-mono font-bold tabular-nums ${
                  isCoolantWarning ? 'text-rose-500 animate-pulse' : ''
                }`}
                style={!isCoolantWarning ? { color: 'var(--df-cockpit-text-title)' } : undefined}
              >
                {can.coolantTempC.toFixed(1)}°C
              </span>
              {/* Mini Sparkline SVG */}
              <svg className="w-14 h-4 overflow-visible" viewBox="0 0 70 20">
                <polyline
                  fill="none"
                  stroke={isCoolantWarning ? '#EF4444' : '#2563EB'}
                  strokeWidth="1.5"
                  points={coolantSparkPoints
                    .map((val, i) => `${i * 10},${20 - ((val - 80) / 30) * 18}`)
                    .join(' ')}
                />
              </svg>
            </div>
            {isCoolantWarning && (
              <span className="text-[8px] font-mono text-rose-600 dark:text-rose-400 mt-1 font-bold">
                ALERTE SURCHAUFFE &gt; 102°C
              </span>
            )}
          </div>

          {/* Pression d'Huile Moteur */}
          <div
            className="p-2 rounded-xs border flex flex-col justify-between"
            style={
              isOilWarning
                ? {
                    backgroundColor: 'var(--df-status-danger-bg)',
                    borderColor: 'var(--df-status-danger-border)',
                  }
                : {
                    backgroundColor: 'var(--df-cockpit-sidebar-bg)',
                    borderColor: 'var(--df-cockpit-border)',
                  }
            }
          >
            <div className="flex items-center justify-between text-[9px] font-mono" style={{ color: 'var(--df-cockpit-text-muted)' }}>
              <span>PRESSION HUILE</span>
              <span className="text-[8px]">SPN 100</span>
            </div>
            <div className="flex items-baseline justify-between mt-1">
              <span
                className={`text-lg font-mono font-bold tabular-nums ${
                  isOilWarning ? 'text-rose-500 animate-pulse' : ''
                }`}
                style={!isOilWarning ? { color: 'var(--df-cockpit-text-title)' } : undefined}
              >
                {can.oilPressureBar.toFixed(2)} <span className="text-xs">Bar</span>
              </span>
              {/* Mini Sparkline SVG */}
              <svg className="w-14 h-4 overflow-visible" viewBox="0 0 70 20">
                <polyline
                  fill="none"
                  stroke={isOilWarning ? '#EF4444' : '#10B981'}
                  strokeWidth="1.5"
                  points={oilSparkPoints
                    .map((val, i) => `${i * 10},${20 - (val / 5) * 18}`)
                    .join(' ')}
                />
              </svg>
            </div>
            {isOilWarning && (
              <span className="text-[8px] font-mono text-rose-600 dark:text-rose-400 mt-1 font-bold">
                PRESSION CRITIQUE &lt; 1.2 BAR
              </span>
            )}
          </div>

          {/* Pression Turbo / Suralimentation */}
          <div
            className="p-2 rounded-xs flex flex-col"
            style={{
              backgroundColor: 'var(--df-cockpit-sidebar-bg)',
              border: '1px solid var(--df-cockpit-border)',
            }}
          >
            <div className="flex items-center justify-between text-[9px] font-mono" style={{ color: 'var(--df-cockpit-text-muted)' }}>
              <span>PRESSION BOOST</span>
              <span className="text-[8px]">SPN 102</span>
            </div>
            <div className="flex items-baseline gap-1 mt-1">
              <span
                className="text-base font-mono font-bold tabular-nums"
                style={{ color: 'var(--df-cockpit-text-title)' }}
              >
                {can.boostPressureBar.toFixed(2)}
              </span>
              <span className="text-[9px] font-mono" style={{ color: 'var(--df-cockpit-text-muted)' }}>Bar</span>
            </div>
          </div>

          {/* Température d'Air Admission */}
          <div
            className="p-2 rounded-xs flex flex-col"
            style={{
              backgroundColor: 'var(--df-cockpit-sidebar-bg)',
              border: '1px solid var(--df-cockpit-border)',
            }}
          >
            <div className="flex items-center justify-between text-[9px] font-mono" style={{ color: 'var(--df-cockpit-text-muted)' }}>
              <span>AIR ADMISSION</span>
              <span className="text-[8px]">SPN 105</span>
            </div>
            <div className="flex items-baseline gap-1 mt-1">
              <span
                className="text-base font-mono font-bold tabular-nums"
                style={{ color: 'var(--df-cockpit-text-title)' }}
              >
                {can.intakeAirTempC.toFixed(1)}°C
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 3. MODULE CARBURANT & ALERTE FRAUDE CUSUM */}
      <div
        className="p-3 rounded-sm"
        style={{
          backgroundColor: 'var(--df-cockpit-card-bg)',
          border: '1px solid var(--df-cockpit-border)',
        }}
      >
        <div
          className="flex items-center justify-between pb-2 mb-2.5"
          style={{ borderBottom: '1px solid var(--df-cockpit-border)' }}
        >
          <span
            className="text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5"
            style={{ color: 'var(--df-cockpit-text-title)' }}
          >
            <IconZap size={13} className="text-blue-500" />
            Carburant & Débit Télémétrique
          </span>
          <span className="text-[9px] font-mono" style={{ color: 'var(--df-cockpit-text-muted)' }}>
            Jauge Sonde Capacitive + CAN
          </span>
        </div>

        {/* Alerte Détection Vol / Chute Brusque Carburant */}
        {can.fuelDropAnomalyDetected && (
          <div
            className="p-2 mb-2 rounded-xs text-[10px] font-mono flex items-center gap-2 animate-pulse"
            style={{
              backgroundColor: 'var(--df-status-danger-bg)',
              border: '1px solid var(--df-status-danger-border)',
              color: 'var(--df-status-danger-text)',
            }}
          >
            <IconAlertTriangle size={14} className="shrink-0 text-rose-500" />
            <div>
              <span className="font-bold">ANOMALIE CUSUM DÉTECTÉE :</span> Chute
              soudaine de niveau (&gt;35L hors consommation normale).
            </div>
          </div>
        )}

        <div className="grid grid-cols-3 gap-2 text-center">
          {/* Niveau % */}
          <div
            className="p-1.5 rounded-xs"
            style={{
              backgroundColor: 'var(--df-cockpit-sidebar-bg)',
              border: '1px solid var(--df-cockpit-border)',
            }}
          >
            <span className="text-[8px] font-mono block" style={{ color: 'var(--df-cockpit-text-muted)' }}>NIVEAU</span>
            <span className="text-base font-mono font-bold text-blue-600 dark:text-blue-400 tabular-nums">
              {can.fuelLevelPercent}%
            </span>
          </div>

          {/* Volume Restant en Litres */}
          <div
            className="p-1.5 rounded-xs"
            style={{
              backgroundColor: 'var(--df-cockpit-sidebar-bg)',
              border: '1px solid var(--df-cockpit-border)',
            }}
          >
            <span className="text-[8px] font-mono block" style={{ color: 'var(--df-cockpit-text-muted)' }}>VOLUME</span>
            <span
              className="text-base font-mono font-bold tabular-nums"
              style={{ color: 'var(--df-cockpit-text-title)' }}
            >
              {Math.round(can.fuelLiters)} <span className="text-[9px]" style={{ color: 'var(--df-cockpit-text-muted)' }}>L</span>
            </span>
          </div>

          {/* Conso Instantanée */}
          <div
            className="p-1.5 rounded-xs"
            style={{
              backgroundColor: 'var(--df-cockpit-sidebar-bg)',
              border: '1px solid var(--df-cockpit-border)',
            }}
          >
            <span className="text-[8px] font-mono block" style={{ color: 'var(--df-cockpit-text-muted)' }}>DÉBIT</span>
            <span
              className="text-base font-mono font-bold tabular-nums"
              style={{ color: 'var(--df-cockpit-text-title)' }}
            >
              {can.instantFuelConsumptionL100km.toFixed(1)}
              <span className="text-[8px] font-normal" style={{ color: 'var(--df-cockpit-text-muted)' }}> L/100</span>
            </span>
          </div>
        </div>

        {/* Jauge Visuelle de Carburant avec seuils */}
        <div className="mt-2.5">
          <div
            className="w-full rounded-xs h-2 overflow-hidden"
            style={{
              backgroundColor: 'var(--df-cockpit-border)',
              border: '1px solid var(--df-cockpit-border-strong)',
            }}
          >
            <div
              className={`h-full transition-all ${
                can.fuelLevelPercent < 20
                  ? 'bg-rose-500'
                  : can.fuelLevelPercent < 35
                  ? 'bg-amber-500'
                  : 'bg-blue-500'
              }`}
              style={{ width: `${can.fuelLevelPercent}%` }}
            />
          </div>
          <div className="flex justify-between text-[8px] font-mono mt-1" style={{ color: 'var(--df-cockpit-text-muted)' }}>
            <span>0 L</span>
            <span>200 L (50%)</span>
            <span>400 L Réservoir Principal</span>
          </div>
        </div>
      </div>
    </div>
  );
}
