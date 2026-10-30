import { Injectable, Logger, Optional } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import { LocalOemResolverService as CoreResolver } from '@docteurflotte/contracts';
import { DatabaseService } from '../../database/database.service';

export interface DecodedVinResult {
  vin: string;
  make: string;
  model: string;
  year: number;
  vehicleType: string;
  engineDisplacementL?: number;
  fuelType?: string;
  gvwr?: string;
  source: 'LOCAL_POSTGRES' | 'LOCAL_FILE_CACHE' | 'NHTSA_VPIC_API' | 'OFFLINE_HEURISTIC';
}

@Injectable()
export class LocalFirstVinService {
  private readonly logger = new Logger(LocalFirstVinService.name);
  private readonly cacheFilePath = path.resolve(process.cwd(), 'data/local-cache/vin_decode_cache.json');

  constructor(@Optional() private readonly databaseService?: DatabaseService) {}

  /**
   * Décode un VIN selon l'architecture Local-First / 100% Offline :
   * 1. Vérification dans la table PostgreSQL `oem_vehicle_catalogs`
   * 2. Vérification dans le cache disque local `data/local-cache/vin_decode_cache.json`
   * 3. Interrogation NHTSA vPIC API si connecté
   * 4. Persistance locale automatique
   * 5. Repli heuristique déterministe hors-ligne si réseau inaccessible
   */
  async decodeVin(vin: string): Promise<DecodedVinResult> {
    const cleanVin = vin.trim().toUpperCase();

    // 1. Vérification PostgreSQL
    try {
      const pool = this.databaseService?.getPool();
      if (pool) {
        const res = await pool.query(
          `SELECT make, model, year, vehicle_type, engine_displacement_l, fuel_type, gvwr
           FROM oem_vehicle_catalogs
           WHERE $1 LIKE CONCAT(SUBSTRING(make, 1, 3), '%') OR id::text = $1
           LIMIT 1`,
          [cleanVin]
        );
        if (res.rows && res.rows.length > 0) {
          const row = res.rows[0];
          return {
            vin: cleanVin,
            make: row.make,
            model: row.model,
            year: Number(row.year) || 2024,
            vehicleType: row.vehicle_type,
            engineDisplacementL: row.engine_displacement_l ? Number(row.engine_displacement_l) : undefined,
            fuelType: row.fuel_type,
            gvwr: row.gvwr,
            source: 'LOCAL_POSTGRES',
          };
        }
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      this.logger.debug(`PostgreSQL non disponible pour décodage VIN (${msg}), passage au cache fichier.`);
    }

    // 2. Vérification Cache Fichier Local (100% Offline-First)
    const fileCache = this.loadFileCache();
    if (fileCache[cleanVin]) {
      return {
        ...fileCache[cleanVin],
        source: 'LOCAL_FILE_CACHE',
      };
    }

    // 3. Appel NHTSA vPIC si en ligne
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 4000);
      const url = `https://vpic.nhtsa.dot.gov/api/vehicles/DecodeVinValues/${cleanVin}?format=json`;

      const res = await fetch(url, {
        signal: controller.signal,
        headers: { 'User-Agent': 'DocteurFlotte-VIN-Decoder/2.0' },
      });
      clearTimeout(timeout);

      if (res.ok) {
        const data = await res.json();
        const item = data.Results?.[0];
        if (item && item.Make) {
          const result: DecodedVinResult = {
            vin: cleanVin,
            make: item.Make || 'Inconnu',
            model: item.Model || 'Modèle standard',
            year: Number(item.ModelYear) || new Date().getFullYear(),
            vehicleType: item.VehicleType || 'Truck / Commercial',
            engineDisplacementL: item.DisplacementL ? Number(item.DisplacementL) : undefined,
            fuelType: item.FuelTypePrimary || 'DIESEL',
            gvwr: item.GVWR || 'Class 8 (PTAC > 15t)',
            source: 'NHTSA_VPIC_API',
          };

          // Sauvegarde dans le cache local
          this.saveToFileCache(cleanVin, result);
          await this.persistToPostgres(result);

          return result;
        }
      }
    } catch {
      this.logger.debug(`NHTSA vPIC inaccessible pour ${cleanVin}, activation du repli heuristique WMI.`);
    }

    // 4. Repli Heuristique Déterministe WMI (World Manufacturer Identifier)
    const heuristic = this.decodeHeuristic(cleanVin);
    this.saveToFileCache(cleanVin, heuristic);
    return heuristic;
  }

  private decodeHeuristic(vin: string): DecodedVinResult {
    const profile = CoreResolver.decodeVin(vin);
    const displacement =
      profile.assetCategory === 'HEAVY_TRUCK'
        ? 12.8
        : profile.assetCategory === 'LIGHT_COMMERCIAL'
        ? 2.3
        : profile.assetCategory === 'AGRICULTURAL_MACHINERY'
        ? 4.4
        : 9.3;

    const gvwr =
      profile.assetCategory === 'HEAVY_TRUCK'
        ? 'Class 8 (PTAC > 15t)'
        : profile.assetCategory === 'LIGHT_COMMERCIAL'
        ? 'Class 2-3 (PTAC <= 3.5t)'
        : 'Special Machinery / Heavy Duty';

    return {
      vin,
      make: profile.make,
      model: profile.model,
      year: profile.modelYear,
      vehicleType: profile.assetCategory,
      engineDisplacementL: displacement,
      fuelType: 'DIESEL',
      gvwr,
      source: 'OFFLINE_HEURISTIC',
    };
  }

  private loadFileCache(): Record<string, DecodedVinResult> {
    try {
      if (fs.existsSync(this.cacheFilePath)) {
        return JSON.parse(fs.readFileSync(this.cacheFilePath, 'utf-8'));
      }
    } catch {
      // Ignorer si corrompu
    }
    return {};
  }

  private saveToFileCache(vin: string, result: DecodedVinResult): void {
    try {
      const cache = this.loadFileCache();
      cache[vin] = result;
      const dir = path.dirname(this.cacheFilePath);
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
      fs.writeFileSync(this.cacheFilePath, JSON.stringify(cache, null, 2), 'utf-8');
    } catch {
      // Ignorer en environnement restreint
    }
  }

  private async persistToPostgres(result: DecodedVinResult): Promise<void> {
    try {
      const pool = this.databaseService?.getPool();
      if (pool) {
        await pool.query(
          `INSERT INTO oem_vehicle_catalogs (make, model, year, vehicle_type, engine_displacement_l, fuel_type, gvwr, source_repo)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
           ON CONFLICT DO NOTHING`,
          [
            result.make,
            result.model,
            result.year,
            result.vehicleType,
            result.engineDisplacementL || null,
            result.fuelType || null,
            result.gvwr || null,
            result.source,
          ]
        );
      }
    } catch {
      // Non bloquant
    }
  }
}
