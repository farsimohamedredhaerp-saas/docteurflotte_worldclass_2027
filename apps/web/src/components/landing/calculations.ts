// apps/web/src/components/landing/calculations.ts
// Moteur actuariel déterministe de calcul du ROI pour la vitrine DocteurFlotte
// Supporte les parcs de 5 à 1 000 actifs avec dégressivité grand compte

import type { FleetSector } from './constants';
import { SECTORS } from './constants';

export interface RoiResult {
  annualLitersSaved: number;
  fuelSavingsDzd: number;
  breakdownSavingsDzd: number;
  downtimeSavingsDzd: number;
  totalSavingsDzd: number;
  daysDowntimeSaved: number;
  criticalBreakdownsAvoidedPerYear: number;
  platformAnnualCostDzd: number;
  netRoiRatio: number;
  fuelExplanationFr: string;
  fuelExplanationAr: string;
  breakdownExplanationFr: string;
  breakdownExplanationAr: string;
  downtimeExplanationFr: string;
  downtimeExplanationAr: string;
}

export function computeRoi(fleetSize: number, monthlyKm: number, fleetSector: FleetSector): RoiResult {
  const sector = SECTORS.find((s) => s.id === fleetSector);
  const fuelRatePer100Km = sector ? sector.fuelRate : 31;
  const nationalFuelCostDzd = 31.0; // Barème national administré Gasoil (31 DA / L)

  // 1. Économie carburant & siphonnage (réduction de 8.5% du litrage via CUSUM + suppression du ralenti abusif)
  const annualLiters = (fleetSize * monthlyKm * 12 * fuelRatePer100Km) / 100;
  const annualLitersSaved = Math.round(annualLiters * 0.085);
  const fuelSavingsDzd = Math.round(annualLitersSaved * nationalFuelCostDzd);

  // 2. Économie sur casses mécaniques et voilages culasse évités (modèle thermique EWMA & Arrhenius)
  const criticalBreakdownsAvoidedPerYear = Math.max(1, Math.round(fleetSize * 0.14));
  const avgEngineRepairDzd = 480_000; // Coût moyen d'une casse lourde (culasse, turbo, injection)
  const breakdownSavingsDzd = criticalBreakdownsAvoidedPerYear * avgEngineRepairDzd;

  // 3. Économie sur immobilisations (4.5 jours d'arrêt évités par panne au coût d'exploitation de référence 25 000 DZD/j)
  const daysDowntimeSaved = Math.round(criticalBreakdownsAvoidedPerYear * 4.5);
  const downtimeSavingsDzd = Math.round(daysDowntimeSaved * 25_000);

  // 4. Économie totale annuelle nette
  const totalSavingsDzd = fuelSavingsDzd + breakdownSavingsDzd + downtimeSavingsDzd;

  // 5. Coût d'abonnement plateforme (avec barème grand compte dégressif au-delà de 200 et 500 véhicules)
  const monthlyRatePerAsset = fleetSize >= 500 ? 1100 : fleetSize >= 200 ? 1300 : 1500;
  const platformAnnualCostDzd = fleetSize * monthlyRatePerAsset * 12;
  const netRoiRatio = +(totalSavingsDzd / platformAnnualCostDzd).toFixed(1);

  return {
    annualLitersSaved,
    fuelSavingsDzd,
    breakdownSavingsDzd,
    downtimeSavingsDzd,
    totalSavingsDzd,
    daysDowntimeSaved,
    criticalBreakdownsAvoidedPerYear,
    platformAnnualCostDzd,
    netRoiRatio,
    fuelExplanationFr:
      "-8,5 % de litrage évité via contrôle CUSUM anti-siphonnage et régulation du ralenti abusif (tarif national administré Gasoil 31 DZD/L).",
    fuelExplanationAr:
      "وفر 8.5% من الحجم الإجمالي عبر كشف السحب غير المشروع CUSUM وضبط السكون المفرط (السعر الوطني للمازوت 31 دج/ل).",
    breakdownExplanationFr:
      "Protection culasse, turbo et injection par anticipation thermique différentielle EWMA (base unitaire 480 000 DZD par casse lourde).",
    breakdownExplanationAr:
      "حماية رأس الأسطوانة والتوربو بالرصد الحراري التفاضلي EWMA وعمر الزيت Arrhenius (معيار 480 000 دج لكل عطب جسيم).",
    downtimeExplanationFr:
      "Continuité d'exploitation : 4,5 jours d'arrêt d'atelier épargnés par panne évitée (forfait d'immobilisation 25 000 DZD/jour).",
    downtimeExplanationAr:
      "استرجاع الجاهزية التشغيلية : تفادي 4.5 يوم توقف ورشة لكل عطب على أساس تكلفة استغلال معيارية 25 000 دج/يوم.",
  };
}
