/**
 * Client API & Référentiel Local pour le Catalogue Universel Constructeurs OEM
 * Intègre les données consolidées de vehiclesdb, gor3a, ddpc-vehicle-specs et api-evangelist.
 */

import rawMasterCatalog from './oem_catalog_master.json';

export interface OEMBrandInfo {
  slug: string;
  name: string;
  country: string;
  isCommonDz: boolean;
}

export interface OEMModelInfo {
  slug: string;
  name: string;
  category: string; // HEAVY_TRUCK, LCV, PASSENGER_CAR, BUS, CONSTRUCTION, AGRI_TRACTOR
  bodyType: string;
  yearStart?: number;
  yearEnd?: number;
  popularityDzRank: number;
}

export interface OEMVariantInfo {
  engineCode: string;
  engineName: string;
  wmi?: string;
  displacementCc: number;
  powerHp: number;
  fuelType: string;
  tankLiters: number;
  ptacKg: number;
  curbWeightKg: number;
  consumptionMixedL100km: number;
  consumptionIdleLHour: number;
  oilCapacityLiters: number;
  oilNormSpec: string;
  coolantLiters: number;
}

export interface OEMCatalogItem {
  brand: OEMBrandInfo;
  model: OEMModelInfo;
  variant: OEMVariantInfo;
  tasksCount: number;
}

export interface RawOEMTask {
  task_code?: string;
  task_name: string;
  subsystem?: string;
  normal_km?: number;
  normal_hours?: number;
  severe_km?: number;
  severe_hours?: number;
}

export interface RawOEMCatalogEntry {
  brand: {
    slug: string;
    name: string;
    country: string;
    is_common_dz?: boolean;
  };
  model: {
    slug: string;
    name: string;
    category: string;
    body_type: string;
    year_start?: number | null;
    year_end?: number | null;
    popularity_dz_rank?: number;
  };
  variant: {
    engine_code?: string;
    engine_name?: string;
    wmi?: string;
    displacement_cc?: number;
    power_hp?: number;
    fuel_type?: string;
    tank_liters?: number;
    ptac_kg?: number;
    curb_weight_kg?: number;
    consumption_mixed_l_100km?: number;
    consumption_idle_l_hour?: number;
    oil_capacity_liters?: number;
    oil_norm_spec?: string;
    coolant_liters?: number;
  };
  tasks?: RawOEMTask[];
  tasks_count?: number;
}

export class OEMCatalogClient {
  private static cachedCatalog: OEMCatalogItem[] | null = null;

  static async loadCatalog(): Promise<OEMCatalogItem[]> {
    if (this.cachedCatalog) {
      return this.cachedCatalog;
    }

    const rawEntries = rawMasterCatalog as unknown as RawOEMCatalogEntry[];
    const items: OEMCatalogItem[] = rawEntries.map((entry) => ({
      brand: {
        slug: entry.brand.slug,
        name: entry.brand.name,
        country: entry.brand.country,
        isCommonDz: Boolean(entry.brand.is_common_dz),
      },
      model: {
        slug: entry.model.slug,
        name: entry.model.name,
        category: entry.model.category,
        bodyType: entry.model.body_type,
        yearStart: entry.model.year_start ?? undefined,
        yearEnd: entry.model.year_end ?? undefined,
        popularityDzRank: entry.model.popularity_dz_rank ?? 999,
      },
      variant: {
        engineCode: entry.variant.engine_code || 'STD',
        engineName: entry.variant.engine_name || 'Standard',
        wmi: entry.variant.wmi ?? undefined,
        displacementCc: entry.variant.displacement_cc || 2000,
        powerHp: entry.variant.power_hp || 130,
        fuelType: entry.variant.fuel_type || 'DIESEL',
        tankLiters: entry.variant.tank_liters || 80,
        ptacKg: entry.variant.ptac_kg || 3500,
        curbWeightKg: entry.variant.curb_weight_kg || 2200,
        consumptionMixedL100km: entry.variant.consumption_mixed_l_100km || 8.0,
        consumptionIdleLHour: entry.variant.consumption_idle_l_hour || 1.5,
        oilCapacityLiters: entry.variant.oil_capacity_liters || 6.0,
        oilNormSpec: entry.variant.oil_norm_spec || '5W-30',
        coolantLiters: entry.variant.coolant_liters ?? 6.0,
      },
      tasksCount: entry.tasks_count ?? (entry.tasks ? entry.tasks.length : 6),
    }));

    this.cachedCatalog = items;
    return items;
  }

  static async getBrands(): Promise<OEMBrandInfo[]> {
    const catalog = await this.loadCatalog();
    const map = new Map<string, OEMBrandInfo>();
    for (const item of catalog) {
      if (!map.has(item.brand.slug)) {
        map.set(item.brand.slug, item.brand);
      }
    }
    return Array.from(map.values()).sort((a, b) => {
      if (a.isCommonDz && !b.isCommonDz) return -1;
      if (!a.isCommonDz && b.isCommonDz) return 1;
      return a.name.localeCompare(b.name);
    });
  }

  static async getModelsByBrand(brandSlug: string): Promise<OEMModelInfo[]> {
    const catalog = await this.loadCatalog();
    const modelsMap = new Map<string, OEMModelInfo>();
    for (const item of catalog) {
      if (item.brand.slug === brandSlug && !modelsMap.has(item.model.slug)) {
        modelsMap.set(item.model.slug, item.model);
      }
    }
    return Array.from(modelsMap.values()).sort((a, b) => a.popularityDzRank - b.popularityDzRank);
  }

  static async getVariantsByModel(brandSlug: string, modelSlug: string): Promise<OEMVariantInfo[]> {
    const catalog = await this.loadCatalog();
    return catalog
      .filter((item) => item.brand.slug === brandSlug && item.model.slug === modelSlug)
      .map((item) => item.variant);
  }

  /**
   * Recherche floue multi-critères avec tolérance aux fautes de frappe (ex: "ranult kangoo 1.5 dci 2012")
   */
  static async searchCatalog(query: string): Promise<OEMCatalogItem[]> {
    const catalog = await this.loadCatalog();
    const q = query.trim().toLowerCase();
    if (!q) return [];

    // Table de fautes de frappe courantes
    let normalized = q;
    const typos: Record<string, string> = {
      ranult: 'renault',
      renaut: 'renault',
      renualt: 'renault',
      peugot: 'peugeot',
      pegeot: 'peugeot',
      toyta: 'toyota',
      vw: 'volkswagen',
      volks: 'volkswagen',
      kango: 'kangoo',
      cadi: 'caddy',
      mercedes: 'mercedes-benz',
      shackman: 'shacman',
    };

    for (const [typo, real] of Object.entries(typos)) {
      normalized = normalized.replace(new RegExp(`\\b${typo}\\b`, 'g'), real);
    }

    const yearMatch = normalized.match(/\b(19\d\d|20\d\d)\b/);
    const targetYear = yearMatch ? parseInt(yearMatch[1], 10) : null;
    const tokens = normalized.split(/[\s,./-]+/).filter((t) => t.length > 1 && t !== 'annee' && t !== 'année');

    return catalog
      .map((item) => {
        let score = 0;
        const bSlug = item.brand.slug.toLowerCase();
        const bName = item.brand.name.toLowerCase();
        const mSlug = item.model.slug.toLowerCase();
        const mName = item.model.name.toLowerCase();
        const vName = item.variant.engineName.toLowerCase();
        const vCode = item.variant.engineCode.toLowerCase();

        for (const tok of tokens) {
          if (bSlug === tok || bName === tok) score += 20;
          else if (bSlug.includes(tok) || bName.includes(tok)) score += 10;

          if (mSlug === tok || mName === tok) score += 25;
          else if (mSlug.includes(tok) || mName.includes(tok)) score += 15;

          if (vName.includes(tok) || vCode.includes(tok)) score += 8;
        }

        if (targetYear && item.model.yearStart && item.model.yearEnd) {
          if (item.model.yearStart <= targetYear && targetYear <= item.model.yearEnd) {
            score += 15;
          } else {
            score -= 10;
          }
        }

        return { item, score };
      })
      .filter((res) => res.score >= 10)
      .sort((a, b) => b.score - a.score)
      .map((res) => res.item);
  }
}
