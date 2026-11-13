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
