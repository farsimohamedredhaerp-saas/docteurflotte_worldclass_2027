import {
  EngineRuleCategory,
  EngineRuleCode,
  EngineRuleConfigEntry,
  UpdateEngineRuleParamDto,
  FiscalRasParams,
  GuaranteeWithholdingParams,
  StampDutyParams,
  F20FranchiseParams,
  VatForfeitureParams,
  TelematicsCusumParams,
  GhostRefuelParams,
  CylinderHeadProtectionParams,
  IdleWasteParams,
  ClutchSlipParams,
  EnactaParams,
  DrivingHoursParams,
  ColdChainParams,
  ThreeWayMatchParams,
  SparePartsSerialParams,
  OdometerCheckParams,
} from '@docteurflotte/contracts';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export interface FiscalRulesSummary {
  ras: FiscalRasParams;
  guarantee: GuaranteeWithholdingParams;
  stampDuty: StampDutyParams;
  f20: F20FranchiseParams;
  vatForfeiture: VatForfeitureParams;
}

export interface TelematicsRulesSummary {
  cusum: TelematicsCusumParams;
  ghostRefuel: GhostRefuelParams;
  cylinderHead: CylinderHeadProtectionParams;
  idleWaste: IdleWasteParams;
  clutchSlip: ClutchSlipParams;
}

export interface RegulatoryRulesSummary {
  enacta: EnactaParams;
  drivingHours: DrivingHoursParams;
  coldChain: ColdChainParams;
}

export interface ProcurementRulesSummary {
  threeWayMatch: ThreeWayMatchParams;
  sparePartsSerial: SparePartsSerialParams;
  odometerCheck: OdometerCheckParams;
}

export class EngineRulesClient {
  static async listRules(
    token: string,
    category?: EngineRuleCategory,
  ): Promise<EngineRuleConfigEntry[]> {
    const url = new URL(`${API_BASE_URL}/engine-rules`);
    if (category) url.searchParams.set('category', category);

    const res = await fetch(url.toString(), {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) throw new Error('Impossible de charger les paramètres des moteurs de contrôle');
    return res.json();
  }

  static async getFiscalSummary(token: string): Promise<FiscalRulesSummary> {
    const res = await fetch(`${API_BASE_URL}/engine-rules/summary/fiscal`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) throw new Error('Impossible de charger le résumé des règles fiscales');
    return res.json();
  }

  static async getTelematicsSummary(token: string): Promise<TelematicsRulesSummary> {
    const res = await fetch(`${API_BASE_URL}/engine-rules/summary/telematics`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) throw new Error('Impossible de charger le résumé des règles télématiques');
    return res.json();
  }

  static async getRegulatorySummary(token: string): Promise<RegulatoryRulesSummary> {
    const res = await fetch(`${API_BASE_URL}/engine-rules/summary/regulatory`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) throw new Error('Impossible de charger le résumé des règles réglementaires');
    return res.json();
  }

  static async getProcurementSummary(token: string): Promise<ProcurementRulesSummary> {
    const res = await fetch(`${API_BASE_URL}/engine-rules/summary/procurement`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) throw new Error('Impossible de charger le résumé des règles achats et atelier');
    return res.json();
  }

  static async setTenantParam(
    dto: UpdateEngineRuleParamDto,
    token: string,
  ): Promise<EngineRuleConfigEntry> {
    const res = await fetch(`${API_BASE_URL}/engine-rules/tenant`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(dto),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || 'Échec de la modification du paramètre');
    }
    return res.json();
  }

  static async setSuperAdminParam(
    dto: UpdateEngineRuleParamDto & { isLockedByLaw?: boolean },
    token: string,
  ): Promise<EngineRuleConfigEntry> {
    const res = await fetch(`${API_BASE_URL}/engine-rules/superadmin`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(dto),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || 'Échec de la modification administrative');
    }
    return res.json();
  }

  static async resetTenantParam(
    ruleCode: EngineRuleCode,
    paramKey: string,
    token: string,
  ): Promise<boolean> {
    const res = await fetch(`${API_BASE_URL}/engine-rules/tenant/${ruleCode}/${paramKey}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    });
    return res.ok;
  }
}

