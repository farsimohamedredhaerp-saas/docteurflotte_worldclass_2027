/**
 * Point d'entrée unique du bac à sable de simulation (Simulation Sandbox).
 * RÈGLE D'INGÉNIERIE : Ces données sont STRICTEMENT réservées au mode démonstration (isDemoMode === true).
 * En production (isDemoMode === false), aucune de ces constantes ne doit polluer le bundle principal
 * ni être renvoyée en cas d'erreur ou d'absence de données.
 */

export * from './assets.mock';
export * from './fuel-receipts.mock';
export * from './work-orders.mock';
export * from './dvir-reports.mock';
export * from './dispatch-candidates.mock';
export * from './decisions.mock';
export * from './drivers.mock';
export * from './preventive.mock';
export * from './tco.mock';
export * from './compliance.mock';
export * from './telematics.mock';
export * from './digital-twin.mock';
export * from './chantiers.mock';
export * from './cold-chain.mock';
export * from './agriculture.mock';
export * from './mining.mock';

/**
 * Chargeurs asynchrones avec dynamic import pour code-splitting optimal (Tree-Shaking garanti en production).
 */
export async function getSimulationAssets() {
  const mod = await import('./assets.mock');
  return mod.MOCK_SANDBOX_ASSETS;
}

export async function getSimulationReceipts() {
  const mod = await import('./fuel-receipts.mock');
  return mod.MOCK_SANDBOX_RECEIPTS;
}

export async function getSimulationWorkOrders() {
  const mod = await import('./work-orders.mock');
  return mod.MOCK_SANDBOX_WORK_ORDERS;
}

export async function getSimulationDvirData() {
  const mod = await import('./dvir-reports.mock');
  return {
    reports: mod.MOCK_SANDBOX_DVIR_REPORTS,
    vehicles: mod.MOCK_SANDBOX_DVIR_VEHICLES,
  };
}

export async function getSimulationDispatchCandidates(scenario?: string) {
  const mod = await import('./dispatch-candidates.mock');
  return {
    vehicles: mod.getMockSandboxDispatchVehicles(scenario),
    drivers: mod.MOCK_SANDBOX_DISPATCH_DRIVERS,
    mission: mod.getMockSandboxDispatchMission(scenario),
  };
}

export async function getSimulationDrivers() {
  const mod = await import('./drivers.mock');
  return mod.MOCK_SANDBOX_DRIVERS;
}

export async function getSimulationPreventiveDues() {
  const mod = await import('./preventive.mock');
  return mod.MOCK_SANDBOX_PREVENTIVE_DUES;
}

export async function getSimulationTco() {
  const mod = await import('./tco.mock');
  return mod.MOCK_SANDBOX_TCO;
}

export async function getSimulationCompliance() {
  const mod = await import('./compliance.mock');
  return {
    enacta: mod.MOCK_SANDBOX_ENACTA,
    insurance: mod.MOCK_SANDBOX_INSURANCE,
  };
}

export async function getSimulationTelematics() {
  const mod = await import('./telematics.mock');
  return {
    devices: mod.MOCK_SANDBOX_TELEMATICS_DEVICES,
    fleetLive: mod.MOCK_SANDBOX_FLEET_LIVE,
    gatewayHealth: mod.MOCK_SANDBOX_GATEWAY_HEALTH,
  };
}

export async function getSimulationEInvoicingReport() {
  const mod = await import('./compliance.mock');
  return mod.MOCK_SANDBOX_E_INVOICING_REPORT;
}

export async function getSimulationCostTwins() {
  const mod = await import('./tco.mock');
  return mod.MOCK_SANDBOX_COST_TWINS;
}

export async function getSimulationTrialBalance() {
  const mod = await import('./compliance.mock');
  return mod.MOCK_SANDBOX_TRIAL_BALANCE;
}

export async function getSimulationGeneralLedger() {
  const mod = await import('./compliance.mock');
  return mod.MOCK_SANDBOX_GENERAL_LEDGER;
}

export async function getSimulationEngineRules() {
  const mod = await import('./compliance.mock');
  return mod.MOCK_SANDBOX_ENGINE_RULES;
}

export async function getSimulationChantiersData() {
  const mod = await import('./chantiers.mock');
  return {
    sites: mod.MOCK_SANDBOX_SITES,
    assignments: mod.MOCK_SANDBOX_ASSIGNMENTS,
    hourLogs: mod.MOCK_SANDBOX_HOUR_LOGS,
    tanks: mod.MOCK_SANDBOX_TANKS,
    deliveries: mod.MOCK_SANDBOX_DELIVERIES,
    workSituations: mod.MOCK_SANDBOX_WORK_SITUATIONS,
  };
}

export async function getSimulationColdChainData() {
  const mod = await import('./cold-chain.mock');
  return {
    reefers: mod.MOCK_SANDBOX_REEFERS,
    certificates: mod.MOCK_SANDBOX_HACCP_CERTIFICATES,
  };
}

export async function getSimulationAgricultureData() {
  const mod = await import('./agriculture.mock');
  return {
    farms: mod.MOCK_SANDBOX_FARMS,
    pivots: mod.MOCK_SANDBOX_PIVOTS,
    telemetry: mod.MOCK_SANDBOX_PIVOT_TELEMETRY,
    harvestLogs: mod.MOCK_SANDBOX_HARVEST_LOGS,
  };
}

export async function getSimulationMiningData() {
  const mod = await import('./mining.mock');
  return {
    sites: mod.MOCK_SANDBOX_MINING_SITES,
    tires: mod.MOCK_SANDBOX_OTR_TIRES,
    cycles: mod.MOCK_SANDBOX_HAULING_CYCLES,
  };
}





