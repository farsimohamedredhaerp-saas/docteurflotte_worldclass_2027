import {
  FuelReceiptScanResult,
  FuelReceiptScanRequestDto,
} from '@docteurflotte/contracts';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export class FuelScannerClient {
  private static async request<T>(
    endpoint: string,
    token: string,
    options: RequestInit = {}
  ): Promise<T> {
    const res = await fetch(`${API_BASE_URL}/fuel-scanner${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
        ...options.headers,
      },
    });

    if (!res.ok) {
      let errorMsg = 'Erreur lors du scan du reçu de carburant.';
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
    return this.request<FuelReceiptScanResult>('/scan', token, {
      method: 'POST',
      body: JSON.stringify(dto),
    });
  }

  static async listRecentReceipts(
    token: string
  ): Promise<FuelReceiptScanResult[]> {
    return this.request<FuelReceiptScanResult[]>('/receipts', token);
  }
}
