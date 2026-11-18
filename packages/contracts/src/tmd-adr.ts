/**
 * =============================================================================
 * Contrats TypeScript pour Transport de Matières Dangereuses (TMD / ADR) & Citernes Hydrocarbures
 * SOUVERAINETÉ : Dépôts Naftal / Sonatrach, Décret Exécutif 04-415,
 *               Brevets TMD Chauffeur (Ministère des Transports), Épreuves APAVE triennales,
 *               Sécurité Vannes & Détection Dépotage Hors-Zone.
 * =============================================================================
 */

export enum HazardClass {
  CLASS_3_HYDROCARBONS = 'CLASS_3_HYDROCARBONS',
  CLASS_2_GASES = 'CLASS_2_GASES',
  CLASS_8_CORROSIVES = 'CLASS_8_CORROSIVES',
  CLASS_9_MISC = 'CLASS_9_MISC',
}

export enum TankerProductType {
  GASOIL = 'GASOIL',
  SUPER_SANS_PLOMB = 'SUPER_SANS_PLOMB',
  SIRGHAZ_GPL = 'SIRGHAZ_GPL',
  FUEL_LOURD = 'FUEL_LOURD',
  KEROSENE_JET_A1 = 'KEROSENE_JET_A1',
}

export enum ValveStatus {
  CLOSED = 'CLOSED',
  OPEN = 'OPEN',
}

export enum TmdMissionStatus {
  AUTHORIZED = 'AUTHORIZED',
  BLOCKED_NON_COMPLIANT = 'BLOCKED_NON_COMPLIANT',
  IN_TRANSIT = 'IN_TRANSIT',
  DELIVERED = 'DELIVERED',
}

export interface TmdDriverCertification {
  id: string;
  tenantId: string;
  driverName: string;
  driverLicenseNumber: string;
  tmdCertificateNumber: string;
  hazardClasses: string;
  issuingAuthority: string;
  issueDate: string;
  expiryDate: string;
  isValid: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateTmdDriverCertificationDto {
  driverName: string;
  driverLicenseNumber: string;
  tmdCertificateNumber: string;
  hazardClasses?: string;
  issuingAuthority?: string;
  issueDate: string;
  expiryDate: string;
}

export interface FuelTankerCompartment {
  id: string;
  tenantId: string;
  assetId: string;
  tankerCode: string;
  compartmentNumber: number;
  capacityLiters: number;
  currentProductType: TankerProductType;
  currentVolumeLiters: number;
  bottomValveStatus: ValveStatus;
  apaveHydrostaticTestDate: string;
  apaveTestExpiryDate: string;
  isAdrCompliant: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateFuelTankerCompartmentDto {
  assetId: string;
  tankerCode: string;
  compartmentNumber: number;
  capacityLiters: number;
  currentProductType?: TankerProductType;
  currentVolumeLiters?: number;
  apaveHydrostaticTestDate: string;
  apaveTestExpiryDate: string;
}

export interface UpdateCompartmentTelemetryDto {
  compartmentId: string;
  volumeLiters?: number;
  bottomValveStatus?: ValveStatus;
}

export interface TmdTransportMission {
  id: string;
  tenantId: string;
  missionCode: string;
  assetId: string;
  driverCertificationId: string;
  originDepotName: string;
  destinationStationName: string;
  authorizedRoute?: string;
  totalVolumeLiters: number;
  fireExtinguishersChecked: boolean;
  groundingBraidConnected: boolean;
  status: TmdMissionStatus;
  unauthorizedValveOpened: boolean;
  departureTime?: string;
  arrivalTime?: string;
  sha256AuditSeal: string;
  createdAt: string;
}

export interface CreateTmdTransportMissionDto {
  missionCode: string;
  assetId: string;
  driverCertificationId: string;
  originDepotName: string;
  destinationStationName: string;
  authorizedRoute?: string;
  totalVolumeLiters: number;
  fireExtinguishersChecked?: boolean;
  groundingBraidConnected?: boolean;
}

