import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import {
  BreakthroughInnovationsService,
  ComprehensiveBreakthroughAuditResult,
} from '../services/breakthrough-innovations.service';
import {
  HydraulicWorkAuditInput,
  HydraulicWorkAuditResult,
  ScrAdblueAuditInput,
  ScrAdblueAuditResult,
  KinematicMicroSlipInput,
  KinematicMicroSlipResult,
  BrakeEnergyPartitioningInput,
  BrakeEnergyPartitioningResult,
  CrankingCompressionInput,
  CrankingCompressionResult,
} from '@docteurflotte/contracts';

@Controller('api/v1/fleet-intelligence/breakthrough')
export class BreakthroughInnovationsController {
  constructor(private readonly service: BreakthroughInnovationsService) {}

  @Post('evaluate-hydraulic-work')
  @HttpCode(HttpStatus.OK)
  evaluateHydraulicWork(@Body() body: HydraulicWorkAuditInput): HydraulicWorkAuditResult {
    return this.service.evaluateHydraulicWork(body);
  }

  @Post('evaluate-scr-integrity')
  @HttpCode(HttpStatus.OK)
  evaluateScrIntegrity(@Body() body: ScrAdblueAuditInput): ScrAdblueAuditResult {
    return this.service.evaluateScrIntegrity(body);
  }

  @Post('evaluate-kinematic-tire')
  @HttpCode(HttpStatus.OK)
  evaluateKinematicTire(@Body() body: KinematicMicroSlipInput): KinematicMicroSlipResult {
    return this.service.evaluateKinematicTire(body);
  }

  @Post('evaluate-brake-energy')
  @HttpCode(HttpStatus.OK)
  evaluateBrakeEnergy(@Body() body: BrakeEnergyPartitioningInput): BrakeEnergyPartitioningResult {
    return this.service.evaluateBrakeEnergy(body);
  }

  @Post('evaluate-cranking-compression')
  @HttpCode(HttpStatus.OK)
  evaluateCrankingCompression(@Body() body: CrankingCompressionInput): CrankingCompressionResult {
    return this.service.evaluateCrankingCompression(body);
  }

  @Post('audit-all')
  @HttpCode(HttpStatus.OK)
  runConsolidatedAudit(
    @Body()
    body: {
      vehicleId: string;
      registrationPlate: string;
      hydraulic?: HydraulicWorkAuditInput;
      scr?: ScrAdblueAuditInput;
      tire?: KinematicMicroSlipInput;
      brake?: BrakeEnergyPartitioningInput;
      cranking?: CrankingCompressionInput;
    },
  ): ComprehensiveBreakthroughAuditResult {
    return this.service.runConsolidatedAudit(body);
  }
}

