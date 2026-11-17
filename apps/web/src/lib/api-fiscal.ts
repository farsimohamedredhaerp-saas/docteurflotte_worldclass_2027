import {
  TenantFiscalProfile,
  UpdateTenantFiscalProfileDto,
  TenantCnrcActivity,
  CreateTenantCnrcActivityDto,
  FiscalDocument,
  CreateFiscalDocumentDto,
  FiscalDeclarationDraft,
  FiscalAuditSeal,
  AssetFiscalSummary,
  Tableau9Scf,
  EInvoicingReadinessReport,
  PartnerAccountingExport,
  LedgerEntry,
  ScfTrialBalance,
  AccountingJournalCode,
} from '@docteurflotte/contracts';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export class FiscalClient {
  static async getProfile(token: string): Promise<TenantFiscalProfile | null> {
    const res = await fetch(`${API_BASE_URL}/fiscal/profile`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.status === 404) return null;
    if (!res.ok) throw new Error('Impossible de charger le profil fiscal');
    return res.json();
  }

  static async updateProfile(dto: UpdateTenantFiscalProfileDto, token: string): Promise<TenantFiscalProfile> {
    const res = await fetch(`${API_BASE_URL}/fiscal/profile`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(dto),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || 'Échec de mise à jour du profil fiscal');
    }
    return res.json();
  }

  static async getCnrcActivities(token: string): Promise<TenantCnrcActivity[]> {
    const res = await fetch(`${API_BASE_URL}/fiscal/cnrc-activities`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) throw new Error('Impossible de charger les activités CNRC');
    return res.json();
  }

  static async createCnrcActivity(dto: CreateTenantCnrcActivityDto, token: string): Promise<TenantCnrcActivity> {
    const res = await fetch(`${API_BASE_URL}/fiscal/cnrc-activities`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(dto),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || 'Échec de l\'ajout de l\'activité CNRC');
    }
    return res.json();
  }

  static async deleteCnrcActivity(id: string, token: string): Promise<boolean> {
    const res = await fetch(`${API_BASE_URL}/fiscal/cnrc-activities/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    });
    return res.ok;
  }

  static async listDocuments(
    token: string,
    params?: { assetId?: string; periodYear?: number; periodMonth?: number },
  ): Promise<FiscalDocument[]> {
    const url = new URL(`${API_BASE_URL}/fiscal/documents`);
    if (params?.assetId) url.searchParams.set('assetId', params.assetId);
    if (params?.periodYear) url.searchParams.set('periodYear', String(params.periodYear));
    if (params?.periodMonth) url.searchParams.set('periodMonth', String(params.periodMonth));

    const res = await fetch(url.toString(), {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) throw new Error('Impossible de charger les documents fiscaux');
    return res.json();
  }

  static async ingestDocument(dto: CreateFiscalDocumentDto, token: string): Promise<FiscalDocument> {
    const res = await fetch(`${API_BASE_URL}/fiscal/documents`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(dto),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || 'Échec de l’ingestion du document fiscal');
    }
    return res.json();
  }

  static async getAssetFiscalSummary(assetId: string, token: string): Promise<AssetFiscalSummary> {
    const res = await fetch(`${API_BASE_URL}/fiscal/assets/${assetId}/summary`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) throw new Error('Impossible de charger le résumé fiscal de l’actif');
    return res.json();
  }

  static async getDeclarationDraft(year: number, month: number, token: string): Promise<FiscalDeclarationDraft> {
    const res = await fetch(`${API_BASE_URL}/fiscal/declarations/draft?year=${year}&month=${month}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || 'Impossible de générer le brouillon G50');
    }
    return res.json();
  }

  static async sealDeclaration(year: number, month: number, token: string): Promise<FiscalAuditSeal> {
    const res = await fetch(`${API_BASE_URL}/fiscal/declarations/seal`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ periodYear: year, periodMonth: month }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || 'Échec du scellement de la déclaration G50');
    }
    return res.json();
  }

  static async listSeals(token: string): Promise<FiscalAuditSeal[]> {
    const res = await fetch(`${API_BASE_URL}/fiscal/audit/seals`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) throw new Error('Impossible de charger le journal des scellés');
    return res.json();
  }

  static async verifySeal(
    declarationId: string,
    token: string,
  ): Promise<{ isValid: boolean; sealedAt?: string; sha256Checksum?: string }> {
    const res = await fetch(`${API_BASE_URL}/fiscal/audit/verify/${declarationId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) throw new Error('Échec de la vérification d’intégrité du scellé');
    return res.json();
  }

  static async getTableau9(year: number, token: string): Promise<Tableau9Scf> {
    const res = await fetch(`${API_BASE_URL}/fiscal/liasse/tableau-9?year=${year}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || 'Impossible de générer le Tableau 9 SCF');
    }
    return res.json();
  }

  static async getEInvoicingReadiness(token: string): Promise<EInvoicingReadinessReport> {
    const res = await fetch(`${API_BASE_URL}/fiscal/e-invoicing/readiness`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || 'Impossible de charger l\'audit de préparation e-facturation 2027');
    }
    return res.json();
  }

  static async exportPartnerAccounting(
    format: 'PC_COMPTA_DGI' | 'ODOO_ALMAWARID_JSON' | 'SAGE_CSV',
    year: number,
    month: number | undefined,
    token: string,
  ): Promise<PartnerAccountingExport> {
    let url = `${API_BASE_URL}/fiscal/partner-export?format=${format}&year=${year}`;
    if (month) url += `&month=${month}`;
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || 'Échec de la génération de l\'export comptable partenaire');
    }
    return res.json();
  }

  static async getGeneralLedger(
    token: string,
    params?: { journal?: AccountingJournalCode; assetId?: string; year?: number; month?: number },
  ): Promise<LedgerEntry[]> {
    const url = new URL(`${API_BASE_URL}/fiscal/ledger`);
    if (params?.journal) url.searchParams.set('journal', params.journal);
    if (params?.assetId) url.searchParams.set('assetId', params.assetId);
    if (params?.year) url.searchParams.set('year', String(params.year));
    if (params?.month) url.searchParams.set('month', String(params.month));

    const res = await fetch(url.toString(), {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) throw new Error('Impossible de charger le Grand Livre SCF');
    return res.json();
  }

  static async getTrialBalance(
    year: number,
    token: string,
    month?: number,
  ): Promise<ScfTrialBalance> {
    const url = new URL(`${API_BASE_URL}/fiscal/ledger/balance`);
    url.searchParams.set('year', String(year));
    if (month) url.searchParams.set('month', String(month));

    const res = await fetch(url.toString(), {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) throw new Error('Impossible de charger la Balance Générale SCF');
    return res.json();
  }

  static async getAssetLedger(
    assetId: string,
    year: number,
    token: string,
  ): Promise<{
    assetId: string;
    year: number;
    revenueDzd: number;
    expenseDzd: number;
    netOperatingMarginDzd: number;
    entriesCount: number;
    entries: LedgerEntry[];
  }> {
    const res = await fetch(`${API_BASE_URL}/fiscal/ledger/asset/${assetId}?year=${year}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) throw new Error('Impossible de charger le compte d\'exploitation de l\'actif');
    return res.json();
  }

  static async postDocumentToLedger(documentId: string, token: string): Promise<LedgerEntry[]> {
    const res = await fetch(`${API_BASE_URL}/fiscal/ledger/post-document/${documentId}`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || 'Échec de la comptabilisation au Grand Livre');
    }
    return res.json();
  }
}
