import { Injectable, Logger, BadRequestException, Optional } from '@nestjs/common';
import { DatabaseService } from '../../database/database.service';
import { resolveFuelPrice, NAFTAL_FUEL_PRICES_DZD } from '@docteurflotte/contracts';

export interface NaftalStatementRecord {
  lineNumber: number;
  cardNumber: string;
  transactionTimestamp: string;
  stationCode: string;
  stationName: string;
  stationWilayaCode: number;
  fuelType: 'GASOIL' | 'SIRGHAZ' | 'SANS_PLOMB';
  volumeLiters: number;
  unitPriceDzd: number;
  totalAmountDzd: number;
  declaredOdometerKm: number;
  assetRegistration: string;
  priceAnomalyDetected: boolean;
  expectedUnitPriceDzd: number;
}

export interface NaftalParserConfig {
  dynamicTariffs?: Record<string, number>;
  priceToleranceDzd?: number;
  defaultWilayaCode?: number;
}

export interface NaftalBatchParseResult {
  totalRecords: number;
  validRecords: number;
  errorRecords: number;
  totalVolumeLiters: number;
  totalAmountDzd: number;
  pricingAnomaliesCount: number;
  records: NaftalStatementRecord[];
  errors: Array<{ line: number; message: string; rawLine?: string }>;
}

@Injectable()
export class NaftalStatementParserService {
  private readonly logger = new Logger(NaftalStatementParserService.name);

  constructor(@Optional() private readonly db?: DatabaseService) {}

  /**
   * Parse un fichier de relevé de cartes carburant Naftal (format CSV avec séparateur virgule, point-virgule ou tabulation).
   * Aucune constante tarifaire ou seuil en dur : lecture via base de données ou configuration injectable.
   */
  async parseCsvStatementAsync(csvContent: string, config?: NaftalParserConfig): Promise<NaftalBatchParseResult> {
    const dynamicTariffs = config?.dynamicTariffs || (await this.fetchActiveTariffsFromDb());
    return this.parseCsvStatement(csvContent, { ...config, dynamicTariffs });
  }

  /**
   * Parse synchrone avec configuration dynamique injectée
   */
  parseCsvStatement(csvContent: string, config?: NaftalParserConfig): NaftalBatchParseResult {
    if (!csvContent || !csvContent.trim()) {
      throw new BadRequestException('Le contenu du fichier de relevé Naftal est vide.');
    }

    const lines = csvContent.split(/\r?\n/).filter((l) => l.trim().length > 0);
    if (lines.length < 2) {
      throw new BadRequestException('Le fichier doit contenir au moins une ligne d en-tête et une ligne de données.');
    }

    const delimiter = this.detectDelimiter(lines[0]);
    const headers = lines[0].split(delimiter).map((h) => this.normalizeHeader(h));
    const headerMap = this.mapHeaderColumns(headers);

    const records: NaftalStatementRecord[] = [];
    const errors: Array<{ line: number; message: string; rawLine?: string }> = [];

    let totalVolumeLiters = 0;
    let totalAmountDzd = 0;
    let pricingAnomaliesCount = 0;

    const toleranceDzd = config?.priceToleranceDzd ?? 1.5;

    for (let i = 1; i < lines.length; i++) {
      const lineText = lines[i];
      const cols = lineText.split(delimiter).map((c) => c.trim().replace(/^["']|["']$/g, ''));

      if (cols.length < 5) {
        errors.push({ line: i + 1, message: 'Nombre de colonnes insuffisant', rawLine: lineText });
        continue;
      }

      try {
        const rawCard = this.getColumnValue(cols, headerMap.cardNumber, 0);
        const rawDate = this.getColumnValue(cols, headerMap.transactionTimestamp, 1);
        const rawStation = this.getColumnValue(cols, headerMap.stationName, 2);
        const rawWilaya = this.getColumnValue(cols, headerMap.stationWilayaCode, 3);
        const rawProduct = this.getColumnValue(cols, headerMap.fuelType, 4);
        const rawVolume = this.getColumnValue(cols, headerMap.volumeLiters, 5);
        const rawUnitPrice = this.getColumnValue(cols, headerMap.unitPriceDzd, 6);
        const rawTotal = this.getColumnValue(cols, headerMap.totalAmountDzd, 7);
        const rawOdo = this.getColumnValue(cols, headerMap.declaredOdometerKm, 8);
        const rawPlate = this.getColumnValue(cols, headerMap.assetRegistration, 9);

        const volume = parseFloat(rawVolume.replace(',', '.'));
        if (isNaN(volume) || volume <= 0) {
          throw new Error(`Litrage invalide: "${rawVolume}"`);
        }

        const fuelType = this.normalizeFuelType(rawProduct);
        const expectedPrice = this.getDynamicNaftalPrice(fuelType, config?.dynamicTariffs);
        const unitPrice = rawUnitPrice ? parseFloat(rawUnitPrice.replace(',', '.')) : expectedPrice;
        const totalAmount = rawTotal
          ? parseFloat(rawTotal.replace(',', '.'))
          : Math.round(volume * unitPrice * 100) / 100;
        const odoKm = rawOdo ? parseFloat(rawOdo.replace(',', '.')) : 0;
        const wilayaCode = this.parseWilayaCode(rawWilaya, config?.defaultWilayaCode);

        const priceAnomaly = Math.abs(unitPrice - expectedPrice) > toleranceDzd;
        if (priceAnomaly) {
          pricingAnomaliesCount++;
        }

        const record: NaftalStatementRecord = {
          lineNumber: i + 1,
          cardNumber: rawCard || 'CARTE-NAFTAL',
          transactionTimestamp: this.parseTimestamp(rawDate),
          stationCode: this.extractStationCode(rawStation),
          stationName: rawStation || 'Station Naftal',
          stationWilayaCode: wilayaCode,
          fuelType,
          volumeLiters: volume,
          unitPriceDzd: unitPrice,
          totalAmountDzd: totalAmount,
          declaredOdometerKm: odoKm,
          assetRegistration: rawPlate || '',
          priceAnomalyDetected: priceAnomaly,
          expectedUnitPriceDzd: expectedPrice,
        };

        records.push(record);
        totalVolumeLiters += volume;
        totalAmountDzd += totalAmount;
      } catch (err: any) {
        errors.push({ line: i + 1, message: err.message || 'Erreur de parsing', rawLine: lineText });
      }
    }

    return {
      totalRecords: lines.length - 1,
      validRecords: records.length,
      errorRecords: errors.length,
      totalVolumeLiters: Math.round(totalVolumeLiters * 100) / 100,
      totalAmountDzd: Math.round(totalAmountDzd * 100) / 100,
      pricingAnomaliesCount,
      records,
      errors,
    };
  }

  /**
   * Fallback: Parse du texte brut extrait via OCR d'un ticket Naftal froissé ou d'un rapport papier.
   */
  parseOcrReceiptText(ocrText: string, config?: NaftalParserConfig): Partial<NaftalStatementRecord> {
    if (!ocrText || !ocrText.trim()) {
      throw new BadRequestException('Le texte OCR est vide.');
    }

    const clean = ocrText.toUpperCase();
    const volumeMatch =
      clean.match(/VOL(?:UME)?\s*[:=]?\s*(\d+[.,]\d+)/i) ||
      clean.match(/(\d+[.,]\d+)\s*(?:L|LITRE|VOL)/i);
    const amountMatch =
      clean.match(/TOTAL\s*[:=]?\s*(\d+[.,]\d+)/i) ||
      clean.match(/MONTANT\s*[:=]?\s*(\d+[.,]\d+)/i) ||
      clean.match(/(\d+[.,]\d+)\s*(?:DA|DZD|DINAR)/i);
    const odoMatch = clean.match(/(?:KM|ODO|COMPTEUR)\s*[:=]?\s*(\d+)/i);
    const dateMatch = clean.match(/(\d{2}[\/-]\d{2}[\/-]\d{4})/);

    const volume = volumeMatch ? parseFloat(volumeMatch[1].replace(',', '.')) : 0;
    const total = amountMatch ? parseFloat(amountMatch[1].replace(',', '.')) : 0;
    const odo = odoMatch ? parseFloat(odoMatch[1]) : 0;

    let fuelType: 'GASOIL' | 'SIRGHAZ' | 'SANS_PLOMB' = 'GASOIL';
    if (clean.includes('SIRGHAZ') || clean.includes('GPL')) {
      fuelType = 'SIRGHAZ';
    } else if (clean.includes('SANS PLOMB') || clean.includes('ESSENCE') || clean.includes('SUPER')) {
      fuelType = 'SANS_PLOMB';
    }

    const expectedPrice = this.getDynamicNaftalPrice(fuelType, config?.dynamicTariffs);
    const unitPrice = volume > 0 && total > 0 ? Math.round((total / volume) * 100) / 100 : expectedPrice;
    const toleranceDzd = config?.priceToleranceDzd ?? 1.5;

    return {
      fuelType,
      volumeLiters: volume,
      totalAmountDzd: total,
      unitPriceDzd: unitPrice,
      declaredOdometerKm: odo,
      transactionTimestamp: dateMatch ? new Date(dateMatch[1]).toISOString() : new Date().toISOString(),
      expectedUnitPriceDzd: expectedPrice,
      priceAnomalyDetected: Math.abs(unitPrice - expectedPrice) > toleranceDzd,
    };
  }

  private detectDelimiter(headerLine: string): string {
    const counts = {
      ';': (headerLine.match(/;/g) || []).length,
      ',': (headerLine.match(/,/g) || []).length,
      '\t': (headerLine.match(/\t/g) || []).length,
    };
    if (counts[';'] >= counts[','] && counts[';'] >= counts['\t']) return ';';
    if (counts['\t'] > counts[',']) return '\t';
    return ',';
  }

  private normalizeHeader(header: string): string {
    return header
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]/g, '');
  }

  private mapHeaderColumns(headers: string[]): Record<string, number> {
    const map: Record<string, number> = {};
    headers.forEach((h, idx) => {
      if (h.includes('carte') || h.includes('card')) map.cardNumber = idx;
      else if (h.includes('date') || h.includes('time') || h.includes('heure')) map.transactionTimestamp = idx;
      else if (h.includes('station') || h.includes('relais') || h.includes('lieu')) map.stationName = idx;
      else if (h.includes('wilaya')) map.stationWilayaCode = idx;
      else if (h.includes('produit') || h.includes('carburant') || h.includes('fuel')) map.fuelType = idx;
      else if (h.includes('volume') || h.includes('litre') || h.includes('qte')) map.volumeLiters = idx;
      else if (h.includes('prix') || h.includes('tarif') || h.includes('pu')) map.unitPriceDzd = idx;
      else if (h.includes('total') || h.includes('montant')) map.totalAmountDzd = idx;
      else if (h.includes('km') || h.includes('odo') || h.includes('compteur')) map.declaredOdometerKm = idx;
      else if (h.includes('immat') || h.includes('plaque') || h.includes('vehicule') || h.includes('matricule'))
        map.assetRegistration = idx;
    });
    return map;
  }

  private getColumnValue(cols: string[], mappedIdx: number | undefined, defaultIdx: number): string {
    const idx = mappedIdx !== undefined && mappedIdx >= 0 && mappedIdx < cols.length ? mappedIdx : defaultIdx;
    return cols[idx] !== undefined ? cols[idx].trim() : '';
  }

  private normalizeFuelType(rawProduct: string): 'GASOIL' | 'SIRGHAZ' | 'SANS_PLOMB' {
    const p = rawProduct.toUpperCase();
    if (p.includes('SIRGHAZ') || p.includes('GPL') || p.includes('LPG')) return 'SIRGHAZ';
    if (p.includes('PLOMB') || p.includes('ESSENCE') || p.includes('SUPER')) return 'SANS_PLOMB';
    return 'GASOIL';
  }

  private getDynamicNaftalPrice(
    fuelType: 'GASOIL' | 'SIRGHAZ' | 'SANS_PLOMB',
    dynamicTariffs?: Record<string, number>,
  ): number {
    return resolveFuelPrice(fuelType, dynamicTariffs);
  }

  private async fetchActiveTariffsFromDb(): Promise<Record<string, number> | undefined> {
    if (!this.db) return undefined;
    const pool = this.db.getPool();
    if (!pool) return undefined;

    try {
      const res = await pool.query<{ fuel_type: string; price_per_liter_dzd: string }>(
        `SELECT fuel_type, price_per_liter_dzd 
         FROM platform_fiscal_fuel_prices 
         WHERE is_active = TRUE 
         ORDER BY effective_date DESC`,
      );
      if (res.rows.length === 0) return undefined;

      const tariffs: Record<string, number> = {};
      for (const row of res.rows) {
        tariffs[row.fuel_type] = parseFloat(row.price_per_liter_dzd);
      }
      return tariffs;
    } catch {
      return undefined;
    }
  }

  private parseWilayaCode(rawWilaya: string, defaultCode = 16): number {
    const num = parseInt(rawWilaya, 10);
    if (!isNaN(num) && num >= 1 && num <= 58) {
      return num;
    }
    return defaultCode;
  }

  private parseTimestamp(rawDate: string): string {
    if (!rawDate) return new Date().toISOString();
    const d = new Date(rawDate);
    if (!isNaN(d.getTime())) return d.toISOString();
    return new Date().toISOString();
  }

  private extractStationCode(stationName: string): string {
    const match = stationName.match(/(\d{3,6})/);
    return match ? `ST-${match[1]}` : `ST-${stationName.substring(0, 8).replace(/\s+/g, '').toUpperCase()}`;
  }
}
