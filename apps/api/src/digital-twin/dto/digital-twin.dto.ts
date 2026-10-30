import { IsNumber, IsOptional } from 'class-validator';
import { DigitalTwinSimulationParams } from '@docteurflotte/contracts';

export class SimulateDigitalTwinDto implements DigitalTwinSimulationParams {
  @IsNumber()
  climateSeverityMultiplier!: number;

  @IsNumber()
  driverAggressivenessMultiplier!: number;

  @IsOptional()
  @IsNumber()
  simulatedDailyKm?: number;
}
