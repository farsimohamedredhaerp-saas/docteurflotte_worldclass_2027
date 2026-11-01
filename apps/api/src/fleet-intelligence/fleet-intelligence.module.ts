import { Module } from '@nestjs/common';
import { CanJ1939DecoderService } from './services/can-j1939-decoder.service';
import { TelemetryNormalizerService } from './services/telemetry-normalizer.service';
import { TelemetryStorageService } from './services/telemetry-storage.service';
import { AlgerianRegulatoryGateService } from './services/regulatory-gate.service';
import { SubstitutionOptimizerService } from './services/substitution-optimizer.service';
import { TelemetryIngestionController } from './controllers/telemetry-ingestion.controller';
import { DispatchDecisionController } from './controllers/dispatch-decision.controller';
import { OemScraperController } from './controllers/oem-scraper.controller';
import { OemScraperService } from './services/oem-scraper.service';
import { EcoDrivingService } from './services/eco-driving.service';
import { EcoDrivingController } from './controllers/eco-driving.controller';
import { DvirService } from './services/dvir.service';
import { DvirController } from './controllers/dvir.controller';
import { ColdChainService } from './services/cold-chain.service';
import { ColdChainController } from './controllers/cold-chain.controller';
import { LocalFirstVinService } from './services/local-first-vin.service';
import { TelemetryBurstBufferService } from './services/telemetry-burst-buffer.service';
import { ExternalFailoverFirewallService } from './services/external-failover-firewall.service';
import { PhysicalPredictiveModelsService } from './services/physical-predictive-models.service';
import { FinancialArbitrageService } from './services/financial-arbitrage.service';
import { RegulatoryMissionOrderService } from './services/regulatory-mission-order.service';
import { CusumLegalClerkService } from './services/cusum-legal-clerk.service';
import { FuelTheftAuditController } from './controllers/fuel-theft-audit.controller';
import { BreakthroughInnovationsService } from './services/breakthrough-innovations.service';
import { BreakthroughInnovationsController } from './controllers/breakthrough-innovations.controller';

@Module({
  controllers: [
    TelemetryIngestionController,
    DispatchDecisionController,
    OemScraperController,
    EcoDrivingController,
    DvirController,
    ColdChainController,
    FuelTheftAuditController,
    BreakthroughInnovationsController,
  ],
  providers: [
    CanJ1939DecoderService,
    TelemetryNormalizerService,
    TelemetryStorageService,
    AlgerianRegulatoryGateService,
    SubstitutionOptimizerService,
    OemScraperService,
    EcoDrivingService,
    DvirService,
    ColdChainService,
    LocalFirstVinService,
    TelemetryBurstBufferService,
    ExternalFailoverFirewallService,
    PhysicalPredictiveModelsService,
    FinancialArbitrageService,
    RegulatoryMissionOrderService,
    CusumLegalClerkService,
    BreakthroughInnovationsService,
  ],
  exports: [
    TelemetryNormalizerService,
    TelemetryStorageService,
    AlgerianRegulatoryGateService,
    SubstitutionOptimizerService,
    OemScraperService,
    EcoDrivingService,
    DvirService,
    ColdChainService,
    LocalFirstVinService,
    TelemetryBurstBufferService,
    ExternalFailoverFirewallService,
    PhysicalPredictiveModelsService,
    FinancialArbitrageService,
    RegulatoryMissionOrderService,
    CusumLegalClerkService,
    BreakthroughInnovationsService,
  ],
})
export class FleetIntelligenceModule {}
