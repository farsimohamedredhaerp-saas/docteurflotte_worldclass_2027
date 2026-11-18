import { ConsumableType } from '@docteurflotte/contracts';

export const CONSUMABLE_CONFIG: Record<
  ConsumableType,
  { label: string; badgeClass: string; barColor: string }
> = {
  [ConsumableType.GASOIL]: {
    label: 'Gasoil',
    badgeClass: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30',
    barColor: 'bg-amber-500',
  },
  [ConsumableType.SIRGHAZ_GPL]: {
    label: 'Sirghaz GPLc',
    badgeClass: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30',
    barColor: 'bg-emerald-500',
  },
  [ConsumableType.ESSENCE_SP]: {
    label: 'Sans Plomb SP95',
    badgeClass: 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/30',
    barColor: 'bg-red-500',
  },
  [ConsumableType.HUILE_HYDRAULIQUE_ISO46]: {
    label: 'Huile Hydr. ISO 46',
    badgeClass: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/30',
    barColor: 'bg-purple-500',
  },
  [ConsumableType.HUILE_HYDRAULIQUE_ISO68]: {
    label: 'Huile Hydr. ISO 68',
    badgeClass: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/30',
    barColor: 'bg-purple-500',
  },
  [ConsumableType.HUILE_MOTEUR_15W40]: {
    label: 'Huile Moteur 15W40',
    badgeClass: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/30',
    barColor: 'bg-blue-500',
  },
  [ConsumableType.HUILE_PONT_80W90]: {
    label: 'Huile Pont 80W90',
    badgeClass: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/30',
    barColor: 'bg-indigo-500',
  },
  [ConsumableType.ADBLUE]: {
    label: 'AdBlue DEF',
    badgeClass: 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border-cyan-500/30',
    barColor: 'bg-cyan-500',
  },
  [ConsumableType.LIQUIDE_REFROIDISSEMENT]: {
    label: 'Liquide Refroidissement',
    badgeClass: 'bg-teal-500/10 text-teal-600 dark:text-teal-400 border-teal-500/30',
    barColor: 'bg-teal-500',
  },
  [ConsumableType.GRAISSE]: {
    label: 'Graisse HP',
    badgeClass: 'bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/30',
    barColor: 'bg-orange-500',
  },
};

