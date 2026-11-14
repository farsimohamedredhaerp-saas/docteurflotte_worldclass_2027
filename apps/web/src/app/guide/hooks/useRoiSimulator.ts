'use client';

import { useState, useMemo } from 'react';
import { RoiSimulatorState } from '../types';

export interface RoiMetricsParams {
  actionCost: number;
  towingCost: number;
  partReplacement: number;
  immobilizationDays: number;
  dailyLoss: number;
  failureProb: number;
}

export function calculateRoiMetrics(params: RoiMetricsParams) {
  const rawBreakdownCost =
    params.towingCost + params.partReplacement + params.immobilizationDays * params.dailyLoss;
  const totalInactionRisk = Math.round(rawBreakdownCost * (params.failureProb / 100));
  const netSavings = totalInactionRisk - params.actionCost;
  const roiRatio = params.actionCost > 0 ? (totalInactionRisk / params.actionCost).toFixed(1) : '0.0';
  return {
    rawBreakdownCost,
    totalInactionRisk,
    netSavings,
    roiRatio,
  };
}

export function useRoiSimulator(): RoiSimulatorState {
  const [actionCost, setActionCost] = useState<number>(35000); // 35 000 DZD
  const [towingCost, setTowingCost] = useState<number>(45000); // 45 000 DZD
  const [partReplacement, setPartReplacement] = useState<number>(75000); // 75 000 DZD
  const [immobilizationDays, setImmobilizationDays] = useState<number>(3); // 3 jours
  const [dailyLoss, setDailyLoss] = useState<number>(25000); // 25 000 DZD/jour
  const [failureProb, setFailureProb] = useState<number>(85); // 85%

  const metrics = useMemo(() => {
    return calculateRoiMetrics({
      actionCost,
      towingCost,
      partReplacement,
      immobilizationDays,
      dailyLoss,
      failureProb,
    });
  }, [actionCost, towingCost, partReplacement, immobilizationDays, dailyLoss, failureProb]);

  return {
    actionCost,
    setActionCost,
    towingCost,
    setTowingCost,
    partReplacement,
    setPartReplacement,
    immobilizationDays,
    setImmobilizationDays,
    dailyLoss,
    setDailyLoss,
    failureProb,
    setFailureProb,
    totalInactionRisk: metrics.totalInactionRisk,
    netSavings: metrics.netSavings,
    roiRatio: metrics.roiRatio,
  };
}
