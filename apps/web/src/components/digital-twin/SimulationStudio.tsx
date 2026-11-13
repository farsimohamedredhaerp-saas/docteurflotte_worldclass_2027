import React from 'react';
import {
  AlgeriaWilayaProfile,
  SimulationLimits,
  SimulationPreset,
  DEFAULT_SIMULATION_LIMITS,
  DEFAULT_SIMULATION_PRESETS,
} from '@docteurflotte/contracts';
import { formatCurrency } from '../../lib/currency-formatter';
import { useI18n } from '../../lib/i18n';

export interface SimulationSelection {
  wilayaCode: number;
  isDesertTransit: boolean;
  climateMultiplier: number;
  driverMultiplier: number;
}

export interface SimulationActions {
  selectWilaya: (code: number) => void;
  toggleDesertTransit: (checked: boolean) => void;
  changeClimateMultiplier: (val: number) => void;
  changeDriverMultiplier: (val: number) => void;
  applyPreset: (preset: SimulationPreset) => void;
  runSimulation: () => void;
}

export interface SimulationStudioProps {
  wilayas: AlgeriaWilayaProfile[];
  currentWilayaProfile: AlgeriaWilayaProfile;
  selection: SimulationSelection;
  limits?: SimulationLimits;
  presets?: SimulationPreset[];
  isSimulating: boolean;
  currency?: string;
  desertTowingAmount?: number;
  actions: SimulationActions;
}

export const SimulationStudio: React.FC<SimulationStudioProps> = ({
  wilayas,
  currentWilayaProfile,
  selection,
  limits = DEFAULT_SIMULATION_LIMITS,
  presets = DEFAULT_SIMULATION_PRESETS,
  isSimulating,
  currency = 'DZD',
  desertTowingAmount,
  actions,
}) => {
  const { t, locale } = useI18n();
  const wilayasCount = wilayas.length;

  const bioclimaticCards = [
    {
      label: t('digitalTwin.simulation.bioZone'),
      value: currentWilayaProfile?.zoneLabel ?? 'N/A',
      color: '#38bdf8',
    },
    {
      label: t('digitalTwin.simulation.summerTempMax'),
      value: `${currentWilayaProfile?.ambientTempSummerC ?? 0} °C`,
      color: '#f8fafc',
    },
    {
      label: t('digitalTwin.simulation.silicaDust'),
      value: `x${currentWilayaProfile?.dustSilicaFactor ?? 1}`,
      color: '#f8fafc',
    },
    {
      label: t('digitalTwin.simulation.oilArrhenius'),
      value: `x${currentWilayaProfile?.oilArrheniusFactor ?? 1}`,
      color: '#f59e0b',
    },
    {
      label: t('digitalTwin.simulation.brakeGradient'),
      value: `x${currentWilayaProfile?.brakeGradientFactor ?? 1}`,
      color: '#10b981',
    },
  ];

  return (
    <div
      style={{
        background: 'linear-gradient(180deg, rgba(20, 29, 47, 0.9) 0%, rgba(12, 17, 29, 0.95) 100%)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        borderRadius: '20px',
        padding: '24px',
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          flexWrap: 'wrap',
          gap: '12px',
          marginBottom: '16px',
        }}
      >
        <div>
          <h4 style={{ fontSize: '18px', fontWeight: 700, margin: '0 0 4px', color: '#f8fafc' }}>
            {t('digitalTwin.simulation.title', { wilayasCount })}
          </h4>
          <p style={{ margin: 0, fontSize: '12px', color: '#94a3b8' }}>
            {t('digitalTwin.simulation.subtitle', { wilayasCount })}
          </p>
        </div>

        {/* Presets dynamiques */}
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
          {presets.map((preset) => {
            const isActive =
              selection.wilayaCode === preset.wilayaCode &&
              Math.abs(selection.driverMultiplier - preset.driverMultiplier) < 0.01;
            return (
              <button
                key={preset.id}
                type="button"
                aria-pressed={isActive}
                onClick={() => actions.applyPreset(preset)}
                style={{
                  background: isActive ? 'rgba(56, 189, 248, 0.2)' : 'rgba(255, 255, 255, 0.06)',
                  border: isActive ? '1px solid #38bdf8' : '1px solid rgba(255, 255, 255, 0.1)',
                  color: isActive ? '#38bdf8' : '#fff',
                  borderRadius: '8px',
                  padding: '5px 10px',
                  fontSize: '11px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                }}
              >
                {preset.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Profil Wilaya Sélecteur Card */}
      <div
        style={{
          background: 'rgba(15, 23, 42, 0.7)',
          border: '1px solid rgba(56, 189, 248, 0.2)',
          borderRadius: '14px',
          padding: '14px',
          marginBottom: '16px',
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '12px',
            marginBottom: '12px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <label htmlFor="sim-wilaya-select" style={{ fontSize: '13px', fontWeight: 700, color: '#f8fafc' }}>
              {t('digitalTwin.simulation.wilayaSelect', { wilayasCount })}
            </label>
            <select
              id="sim-wilaya-select"
              value={selection.wilayaCode}
              onChange={(e) => actions.selectWilaya(parseInt(e.target.value, 10))}
              style={{
                background: '#0f172a',
                border: '1px solid #38bdf8',
                color: '#38bdf8',
                borderRadius: '8px',
                padding: '5px 10px',
                fontSize: '13px',
                fontWeight: 700,
                cursor: 'pointer',
                outline: 'none',
              }}
            >
              {wilayas.map((w) => (
                <option key={w.code} value={w.code}>
                  {w.code.toString().padStart(2, '0')} - {w.name}
                  {w.nameAr ? ` (${w.nameAr})` : ''} • {w.zoneLabel}
                </option>
              ))}
            </select>
          </div>

          <label
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              cursor: 'pointer',
              fontSize: '12px',
              fontWeight: 600,
              color: '#f8fafc',
            }}
          >
            <input
              type="checkbox"
              checked={selection.isDesertTransit}
              onChange={(e) => actions.toggleDesertTransit(e.target.checked)}
              style={{ accentColor: '#f59e0b', width: '15px', height: '15px', cursor: 'pointer' }}
            />
            <span>
              {desertTowingAmount !== undefined
                ? t('digitalTwin.simulation.desertTransitCheckbox', {
                    amount: formatCurrency(desertTowingAmount, currency, locale),
                  })
                : 'Transit Désertique'}
            </span>
          </label>
        </div>

        {/* Fiches physiques de contraintes bioclimatiques */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '8px' }}>
          {bioclimaticCards.map((card, i) => (
            <div
              key={i}
              style={{
                background: 'rgba(255, 255, 255, 0.03)',
                borderRadius: '8px',
                padding: '6px 10px',
                border: '1px solid rgba(255, 255, 255, 0.06)',
              }}
            >
              <div style={{ fontSize: '10px', color: '#94a3b8' }}>{card.label}</div>
              <div style={{ fontSize: '13px', fontWeight: 700, color: card.color }}>
                {card.value}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Sliders Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(210px, 100%), 1fr))', gap: '14px', marginBottom: '18px' }}>
        {/* Climate Slider */}
        <div style={{ background: 'rgba(15, 23, 42, 0.6)', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '12px', padding: '14px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
            <label htmlFor="sim-climate-slider" style={{ fontSize: '12px', fontWeight: 700, color: '#f8fafc' }}>
              {t('digitalTwin.simulation.climateSliderLabel')}
            </label>
            <span style={{ fontSize: '14px', fontWeight: 800, color: '#38bdf8' }}>
              x{selection.climateMultiplier.toFixed(2)}
            </span>
          </div>
          <input
            id="sim-climate-slider"
            type="range"
            min={limits.climate.min}
            max={limits.climate.max}
            step={limits.climate.step}
            value={selection.climateMultiplier}
            aria-valuetext={`x${selection.climateMultiplier.toFixed(2)}`}
            aria-label={t('digitalTwin.simulation.climateSliderLabel')}
            onChange={(e) => actions.changeClimateMultiplier(parseFloat(e.target.value))}
            style={{ width: '100%', accentColor: '#38bdf8', cursor: 'pointer' }}
          />
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: '#64748b', marginTop: '4px' }}>
            <span>{t(limits.climate.minLabelKey)}</span>
            <span>{t(limits.climate.maxLabelKey)}</span>
          </div>
        </div>

        {/* Driver Slider */}
        <div style={{ background: 'rgba(15, 23, 42, 0.6)', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '12px', padding: '14px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
            <label htmlFor="sim-driver-slider" style={{ fontSize: '12px', fontWeight: 700, color: '#f8fafc' }}>
              {t('digitalTwin.simulation.driverSliderLabel')}
            </label>
            <span style={{ fontSize: '14px', fontWeight: 800, color: '#f59e0b' }}>
              x{selection.driverMultiplier.toFixed(2)}
            </span>
          </div>
          <input
            id="sim-driver-slider"
            type="range"
            min={limits.driver.min}
            max={limits.driver.max}
            step={limits.driver.step}
            value={selection.driverMultiplier}
            aria-valuetext={`x${selection.driverMultiplier.toFixed(2)}`}
            aria-label={t('digitalTwin.simulation.driverSliderLabel')}
            onChange={(e) => actions.changeDriverMultiplier(parseFloat(e.target.value))}
            style={{ width: '100%', accentColor: '#f59e0b', cursor: 'pointer' }}
          />
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: '#64748b', marginTop: '4px' }}>
            <span>{t(limits.driver.minLabelKey)}</span>
            <span>{t(limits.driver.maxLabelKey)}</span>
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <button
          type="button"
          onClick={actions.runSimulation}
          disabled={isSimulating}
          style={{
            background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
            color: '#fff',
            border: 'none',
            borderRadius: '10px',
            padding: '10px 22px',
            fontSize: '14px',
            fontWeight: 700,
            cursor: isSimulating ? 'wait' : 'pointer',
            boxShadow: '0 4px 16px rgba(2, 132, 199, 0.4)',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          {isSimulating
            ? t('digitalTwin.simulation.recalculatingBtn')
            : t('digitalTwin.simulation.recalculateBtn')}
        </button>
      </div>
    </div>
  );
};
