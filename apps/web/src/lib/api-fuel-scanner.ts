import {
  FuelReceiptScanResult,
  FuelReceiptScanRequestDto,
  BilingualLegalAuditReport,
  PreComputedContextGraphPayload,
  FuelIncidentEvaluationInput,
} from '@docteurflotte/contracts';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export class FuelScannerClient {
  private static async request<T>(
    endpoint: string,
    token?: string,
    options: RequestInit = {}
  ): Promise<T> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const res = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
    });

    if (!res.ok) {
      let errorMsg = 'Erreur lors du traitement de la requête carburant.';
      try {
        const errorData = await res.json();
        errorMsg = errorData.message || errorMsg;
      } catch {
        // Fallback
      }
      throw new Error(errorMsg);
    }

    return res.json();
  }

  static async scanReceipt(
    dto: FuelReceiptScanRequestDto,
    token: string
  ): Promise<FuelReceiptScanResult> {
    return this.request<FuelReceiptScanResult>('/fuel-scanner/scan', token, {
      method: 'POST',
      body: JSON.stringify(dto),
    });
  }

  static async listRecentReceipts(
    token?: string
  ): Promise<FuelReceiptScanResult[]> {
    return this.request<FuelReceiptScanResult[]>('/fuel-scanner/receipts', token);
  }

  static async listReceipts(
    token?: string
  ): Promise<FuelReceiptScanResult[]> {
    return this.listRecentReceipts(token);
  }

  /**
   * Évalue un incident de carburant avec correction de dévers Valhalla et génère un PV bilingue opposable
   */
  static async evaluateFuelIncident(
    payload: FuelIncidentEvaluationInput,
    token?: string
  ): Promise<BilingualLegalAuditReport> {
    return this.request<BilingualLegalAuditReport>(
      '/api/v1/fleet-intelligence/fuel-theft/evaluate',
      token,
      {
        method: 'POST',
        body: JSON.stringify(payload),
      }
    );
  }

  /**
   * Génère le Pre-Computed Context Graph déterministe
   */
  static async getPreComputedGraph(
    payload: FuelIncidentEvaluationInput,
    token?: string
  ): Promise<PreComputedContextGraphPayload> {
    return this.request<PreComputedContextGraphPayload>(
      '/api/v1/fleet-intelligence/fuel-theft/graph',
      token,
      {
        method: 'POST',
        body: JSON.stringify(payload),
      }
    );
  }

  /**
   * Liste l'ensemble des rapports d'audit juridique CUSUM générés
   */
  static async listLegalReports(
    token?: string
  ): Promise<BilingualLegalAuditReport[]> {
    return this.request<BilingualLegalAuditReport[]>(
      '/api/v1/fleet-intelligence/fuel-theft/reports',
      token
    );
  }

  /**
   * Récupère un rapport spécifique par son ID
   */
  static async getLegalReportById(
    reportId: string,
    token?: string
  ): Promise<BilingualLegalAuditReport> {
    return this.request<BilingualLegalAuditReport>(
      `/api/v1/fleet-intelligence/fuel-theft/reports/${encodeURIComponent(reportId)}`,
      token
    );
  }
}

export default FuelScannerClient;
