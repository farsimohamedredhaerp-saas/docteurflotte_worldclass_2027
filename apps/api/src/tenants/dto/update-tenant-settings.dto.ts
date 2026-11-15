import {
  IsOptional,
  IsString,
  IsIn,
  IsNumber,
  IsBoolean,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import {
  EconomicRates,
  NotificationPreferences,
  OperationalThresholds,
  TenantBranding,
  UpdateTenantSettingsDto as IUpdateTenantSettingsDto,
} from '@docteurflotte/contracts';

export class BrandingDto implements Partial<TenantBranding> {
  @IsString()
  @IsOptional()
  displayName?: string;

  @IsString()
  @IsOptional()
  timezone?: string;

  @IsString()
  @IsOptional()
  dateFormat?: string;

  @IsString()
  @IsOptional()
  logoUrl?: string;
}

export class AlertThresholdsDto implements Partial<OperationalThresholds> {
  @IsNumber()
  @Min(0, { message: 'maintenanceWarningKm doit être supérieur ou égal à 0' })
  @IsOptional()
  maintenanceWarningKm?: number;

  @IsNumber()
  @Min(0, { message: 'maintenanceWarningHours doit être supérieur ou égal à 0' })
  @IsOptional()
  maintenanceWarningHours?: number;

  @IsNumber()
  @Min(0, { message: 'inspectionDaysNotice doit être supérieur ou égal à 0' })
  @IsOptional()
  inspectionDaysNotice?: number;

  @IsNumber()
  @Min(0, { message: 'odometerRollbackToleranceKm doit être supérieur ou égal à 0' })
  @IsOptional()
  odometerRollbackToleranceKm?: number;

  @IsNumber()
  @Min(0, { message: 'dailyKmExcessThreshold doit être supérieur ou égal à 0' })
  @IsOptional()
  dailyKmExcessThreshold?: number;
}

export class EconomicRatesDto implements Partial<EconomicRates> {
  @IsNumber()
  @Min(0, { message: 'hourlyLaborRate doit être supérieur ou égal à 0' })
  @IsOptional()
  hourlyLaborRate?: number;

  @IsNumber()
  @Min(0, { message: 'approvalExpenseThreshold doit être supérieur ou égal à 0' })
  @IsOptional()
  approvalExpenseThreshold?: number;

  @IsNumber()
  @Min(0, { message: 'inactionRiskMultiplier doit être supérieur ou égal à 0' })
  @IsOptional()
  inactionRiskMultiplier?: number;

  @IsNumber()
  @Min(0, { message: 'referenceFuelPricePerLiter doit être supérieur ou égal à 0' })
  @IsOptional()
  referenceFuelPricePerLiter?: number;

  @IsNumber()
  @Min(0, { message: 'towingBaseRateTellDzd doit être supérieur ou égal à 0' })
  @IsOptional()
  towingBaseRateTellDzd?: number;

  @IsNumber()
  @Min(0, { message: 'towingSurchargeSaharaDzd doit être supérieur ou égal à 0' })
  @IsOptional()
  towingSurchargeSaharaDzd?: number;

  @IsNumber()
  @Min(0, { message: 'dailyImmobilizationCostDzd doit être supérieur ou égal à 0' })
  @IsOptional()
  dailyImmobilizationCostDzd?: number;
}

export class NotificationPreferencesDto implements Partial<NotificationPreferences> {
  @IsBoolean()
  @IsOptional()
  emailNotifications?: boolean;

  @IsBoolean()
  @IsOptional()
  inAppAlerts?: boolean;

  @IsBoolean()
  @IsOptional()
  notifyOnCriticalOverdue?: boolean;

  @IsBoolean()
  @IsOptional()
  notifyOnExpenseExceeded?: boolean;
}

export class UpdateTenantSettingsDto implements IUpdateTenantSettingsDto {
  @IsString()
  @IsOptional()
  currency?: string;

  @IsIn(['METRIC', 'IMPERIAL'])
  @IsOptional()
  measurementSystem?: 'METRIC' | 'IMPERIAL';

  @ValidateNested()
  @Type(() => BrandingDto)
  @IsOptional()
  branding?: BrandingDto;

  @ValidateNested()
  @Type(() => AlertThresholdsDto)
  @IsOptional()
  alertThresholds?: AlertThresholdsDto;

  @ValidateNested()
  @Type(() => EconomicRatesDto)
  @IsOptional()
  economicRates?: EconomicRatesDto;

  @ValidateNested()
  @Type(() => NotificationPreferencesDto)
  @IsOptional()
  notificationPreferences?: NotificationPreferencesDto;
}
