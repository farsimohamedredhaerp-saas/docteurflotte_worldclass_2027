import { IsArray, IsDefined, IsNumber, IsObject, IsOptional, IsString } from 'class-validator';
import {
  IndustrySector,
  ClimateZoneDZ,
  DispatchAssetCategory as AssetCategory,
  LicenseCategoryDZ,
  DocumentTypeDZ,
  DispatchStatus,
  RegulatoryDocument,
  SubsystemRUL,
  ActiveDTC,
  VehicleStateDto,
  DriverStateDto,
  MissionRequestDto,
  ViolationDetail,
  WorkOrderGenerated,
  SubstitutionCandidateScore,
  DispatchDecisionResult,
} from '@docteurflotte/contracts';

export {
  IndustrySector,
  ClimateZoneDZ,
  AssetCategory,
  LicenseCategoryDZ,
  DocumentTypeDZ,
  DispatchStatus,
};

export type {
  RegulatoryDocument,
  SubsystemRUL,
  ActiveDTC,
  VehicleStateDto,
  DriverStateDto,
  MissionRequestDto,
  ViolationDetail,
  WorkOrderGenerated,
  SubstitutionCandidateScore,
  DispatchDecisionResult,
};

export class DispatchEvaluationPayloadDto {
  @IsDefined()
  @IsObject()
  mission!: MissionRequestDto;

  @IsDefined()
  @IsArray()
  fleetVehicles!: VehicleStateDto[];

  @IsDefined()
  @IsArray()
  fleetDrivers!: DriverStateDto[];
}

export class FinancialArbitragePayloadDto {
  @IsDefined()
  @IsObject()
  vehicle!: VehicleStateDto;

  @IsDefined()
  @IsObject()
  mission!: MissionRequestDto;

  @IsOptional()
  @IsNumber()
  hourlyLaborRateDzd?: number;

  @IsOptional()
  @IsNumber()
  clientPenaltyPerHourDzd?: number;
}

export class MissionOrderIssuanceDto {
  @IsDefined()
  @IsObject()
  mission!: MissionRequestDto;

  @IsDefined()
  @IsObject()
  vehicle!: VehicleStateDto;

  @IsDefined()
  @IsObject()
  driver!: any;

  @IsOptional()
  @IsObject()
  companyInfo?: any;
}

export class VerifyMissionOrderDto {
  @IsDefined()
  @IsString()
  qrPayload!: string;

  @IsDefined()
  @IsString()
  signatureToken!: string;
}
