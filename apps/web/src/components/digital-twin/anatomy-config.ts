import { DigitalTwinOrganType } from '@docteurflotte/contracts';

export interface OrganHotspot {
  organKey: DigitalTwinOrganType;
  x: number;
  y: number;
  color: string;
  icon: string;
}

export interface ChassisWheel {
  x: number;
  y: number;
  width: number;
  height: number;
  rx: number;
}

export interface ChassisSection {
  x: number;
  y: number;
  width: number;
  height: number;
  rx: number;
  fill: string;
  stroke: string;
  strokeWidth: number;
  strokeDasharray?: string;
}

export interface VehicleChassisTemplate {
  category: string;
  viewBox: string;
  width: number;
  height: number;
  outline: ChassisSection;
  cab: ChassisSection;
  wheels: ChassisWheel[];
  hotspots: OrganHotspot[];
}

export const HOTSPOT_DIMENSIONS = {
  activeRadius: 22,
  inactiveRadius: 16,
} as const;

/**
 * Gabarit Châssis Utilitaire Léger (Kangoo, Partner, Berlingo)
 */
export const LIGHT_COMMERCIAL_CHASSIS: VehicleChassisTemplate = {
  category: 'LIGHT_COMMERCIAL',
  viewBox: '0 0 640 200',
  width: 640,
  height: 200,
  outline: {
    x: 80,
    y: 30,
    width: 480,
    height: 140,
    rx: 28,
    fill: 'rgba(15, 23, 42, 0.6)',
    stroke: 'rgba(56, 189, 248, 0.3)',
    strokeWidth: 2,
    strokeDasharray: '6 4',
  },
  cab: {
    x: 360,
    y: 45,
    width: 180,
    height: 110,
    rx: 14,
    fill: 'rgba(30, 41, 59, 0.4)',
    stroke: 'rgba(56, 189, 248, 0.2)',
    strokeWidth: 1.5,
  },
  wheels: [
    { x: 130, y: 10, width: 60, height: 24, rx: 6 },
    { x: 130, y: 166, width: 60, height: 24, rx: 6 },
    { x: 450, y: 10, width: 60, height: 24, rx: 6 },
    { x: 450, y: 166, width: 60, height: 24, rx: 6 },
  ],
  hotspots: [
    { organKey: 'COOLING_SYSTEM', x: 530, y: 100, color: '#38bdf8', icon: '🌡️' },
    { organKey: 'ENGINE_OIL', x: 470, y: 115, color: '#f59e0b', icon: '🛢️' },
    { organKey: 'BATTERY_CRANKING', x: 440, y: 65, color: '#10b981', icon: '🔋' },
    { organKey: 'TRANSMISSION_DRIVETRAIN', x: 345, y: 100, color: '#06b6d4', icon: '⚙️' },
    { organKey: 'BRAKE_PADS', x: 250, y: 65, color: '#ef4444', icon: '🛑' },
    { organKey: 'DPF_FILTER', x: 170, y: 115, color: '#a855f7', icon: '💨' },
  ],
};

/**
 * Gabarit Poids Lourd (MAN TGX, Mercedes Actros, Shacman 6x4)
 */
export const HEAVY_TRUCK_CHASSIS: VehicleChassisTemplate = {
  category: 'HEAVY_TRUCK',
  viewBox: '0 0 640 200',
  width: 640,
  height: 200,
  outline: {
    x: 60,
    y: 25,
    width: 520,
    height: 150,
    rx: 16,
    fill: 'rgba(15, 23, 42, 0.7)',
    stroke: 'rgba(16, 185, 129, 0.35)',
    strokeWidth: 2,
    strokeDasharray: '4 4',
  },
  cab: {
    x: 420,
    y: 35,
    width: 145,
    height: 130,
    rx: 10,
    fill: 'rgba(16, 78, 59, 0.3)',
    stroke: 'rgba(16, 185, 129, 0.3)',
    strokeWidth: 1.5,
  },
  wheels: [
    { x: 100, y: 8, width: 55, height: 22, rx: 4 },
    { x: 100, y: 170, width: 55, height: 22, rx: 4 },
    { x: 165, y: 8, width: 55, height: 22, rx: 4 },
    { x: 165, y: 170, width: 55, height: 22, rx: 4 },
    { x: 470, y: 8, width: 60, height: 24, rx: 4 },
    { x: 470, y: 168, width: 60, height: 24, rx: 4 },
  ],
  hotspots: [
    { organKey: 'COOLING_SYSTEM', x: 545, y: 100, color: '#38bdf8', icon: '🌡️' },
    { organKey: 'ENGINE_OIL', x: 485, y: 110, color: '#f59e0b', icon: '🛢️' },
    { organKey: 'BATTERY_CRANKING', x: 440, y: 60, color: '#10b981', icon: '🔋' },
    { organKey: 'TRANSMISSION_DRIVETRAIN', x: 310, y: 100, color: '#06b6d4', icon: '⚙️' },
    { organKey: 'BRAKE_PADS', x: 190, y: 65, color: '#ef4444', icon: '🛑' },
    { organKey: 'DPF_FILTER', x: 230, y: 125, color: '#a855f7', icon: '💨' },
  ],
};

/**
 * Gabarit Engin de Chantier & Minier (Caterpillar, Liebherr, Komatsu)
 */
export const OFF_ROAD_BTP_CHASSIS: VehicleChassisTemplate = {
  category: 'OFF_ROAD_BTP',
  viewBox: '0 0 640 200',
  width: 640,
  height: 200,
  outline: {
    x: 90,
    y: 35,
    width: 460,
    height: 130,
    rx: 20,
    fill: 'rgba(30, 27, 20, 0.7)',
    stroke: 'rgba(245, 158, 11, 0.4)',
    strokeWidth: 2,
    strokeDasharray: '8 4',
  },
  cab: {
    x: 240,
    y: 45,
    width: 140,
    height: 110,
    rx: 12,
    fill: 'rgba(69, 45, 10, 0.4)',
    stroke: 'rgba(245, 158, 11, 0.3)',
    strokeWidth: 1.5,
  },
  wheels: [
    { x: 110, y: 12, width: 80, height: 26, rx: 6 },
    { x: 110, y: 162, width: 80, height: 26, rx: 6 },
    { x: 440, y: 12, width: 80, height: 26, rx: 6 },
    { x: 440, y: 162, width: 80, height: 26, rx: 6 },
  ],
  hotspots: [
    { organKey: 'COOLING_SYSTEM', x: 515, y: 100, color: '#38bdf8', icon: '🌡️' },
    { organKey: 'ENGINE_OIL', x: 450, y: 115, color: '#f59e0b', icon: '🛢️' },
    { organKey: 'BATTERY_CRANKING', x: 360, y: 65, color: '#10b981', icon: '🔋' },
    { organKey: 'TRANSMISSION_DRIVETRAIN', x: 270, y: 100, color: '#06b6d4', icon: '⚙️' },
    { organKey: 'BRAKE_PADS', x: 180, y: 65, color: '#ef4444', icon: '🛑' },
    { organKey: 'DPF_FILTER', x: 140, y: 115, color: '#a855f7', icon: '💨' },
  ],
};

export const CHASSIS_TEMPLATES: Record<string, VehicleChassisTemplate> = {
  LIGHT_COMMERCIAL: LIGHT_COMMERCIAL_CHASSIS,
  HEAVY_TRUCK: HEAVY_TRUCK_CHASSIS,
  OFF_ROAD_BTP: OFF_ROAD_BTP_CHASSIS,
  ROAD_VEHICLE: LIGHT_COMMERCIAL_CHASSIS,
};

/**
 * Résout le gabarit en fonction de la catégorie de l'actif
 */
export function getChassisTemplate(category?: string): VehicleChassisTemplate {
  if (!category) return LIGHT_COMMERCIAL_CHASSIS;
  const upper = category.toUpperCase();
  if (upper.includes('TRUCK') || upper.includes('MAN') || upper.includes('POIDS') || upper.includes('ACTROS')) {
    return HEAVY_TRUCK_CHASSIS;
  }
  if (upper.includes('BTP') || upper.includes('CAT') || upper.includes('ENGIN') || upper.includes('EXCAVATOR')) {
    return OFF_ROAD_BTP_CHASSIS;
  }
  return CHASSIS_TEMPLATES[upper] || LIGHT_COMMERCIAL_CHASSIS;
}

