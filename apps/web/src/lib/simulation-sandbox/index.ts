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
