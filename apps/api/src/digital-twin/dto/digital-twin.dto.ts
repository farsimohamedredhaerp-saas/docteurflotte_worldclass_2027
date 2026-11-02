import { IsNumber, IsOptional, IsBoolean } from 'class-validator';
import { DigitalTwinSimulationParams } from '@docteurflotte/contracts';

export class SimulateDigitalTwinDto implements DigitalTwinSimulationParams {
  @IsNumber()
  climateSeverityMultiplier!: number;

  @IsNumber()
  driverAggressivenessMultiplier!: number;

  @IsOptional()
  @IsNumber()
  wilayaCode?: number;

  @IsOptional()
  @IsNumber()
  simulatedDailyKm?: number;

  @IsOptional()
  @IsNumber()
  ambientTempOverrideC?: number;

  @IsOptional()
  @IsBoolean()
  isDesertTransitScenario?: boolean;
}
