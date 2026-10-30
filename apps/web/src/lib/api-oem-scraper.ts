export interface NormalizedOEMTask {
  task_code: string;
  task_name: string;
  subsystem: string;
  normal_interval_km: number;
  normal_interval_months: number;
  normal_interval_engine_hours: number;
  severe_interval_km: number;
  severe_interval_months: number;
  severe_interval_engine_hours: number;
  standard_labor_minutes: number;
  criticality_weight: number;
}

export interface ScraperTraceStep {
  step: number;
  phase: string;
  timestamp: string;
  level: 'INFO' | 'MATCH' | 'WARNING' | 'REJECT' | 'FALLBACK';
  message: string;
  details?: Record<string, any>;
}

export interface NormalizedOEMTemplate {
  wmi_prefix: string;
  make: string;
  model: string;
  engine_code: string;
  asset_category: string;
  fuel_type: string;
  ref_consumption_l_100km: number;
  ref_consumption_l_hour: number;
  oil_capacity_liters: number;
  oil_norm_spec: string;
  tasks: NormalizedOEMTask[];
  execution_trace?: ScraperTraceStep[];
}

export interface OEMIngestRequest {
  vin?: string;
  make?: string;
  model?: string;
  engine_code?: string;
  asset_category?: string;
  lubricant_guide_url?: string;
  mechanical_guide_url?: string;
  pdf_manual_notes?: string;
}

export class OEMScraperClient {
  static async resolveAndScrape(req: OEMIngestRequest): Promise<NormalizedOEMTemplate> {
    const res = await fetch('/api/oem-scraper', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(req),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || 'Échec de la résolution du VIN et du scraping OEM.');
    }

    return res.json();
  }

  static async resolveAndIngestViaNest(req: OEMIngestRequest): Promise<any> {
    const apiBase = process.env.NEXT_PUBLIC_NEST_API_URL || 'http://localhost:3001';
    const res = await fetch(`${apiBase}/api/v1/oem-scraper/resolve-and-ingest`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        vin: req.vin,
        make: req.make,
        model: req.model,
        engineCode: req.engine_code,
        assetCategory: req.asset_category,
        lubricantGuideUrl: req.lubricant_guide_url,
        mechanicalGuideUrl: req.mechanical_guide_url,
      }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || 'Échec de la résolution via Nest API.');
    }

    return res.json();
  }

  static async bulkCrawlCatalog(req: {
    category_url?: string;
    target_make?: string;
    asset_category?: string;
  }): Promise<any> {
    const apiBase = process.env.NEXT_PUBLIC_NEST_API_URL || 'http://localhost:3001';
    try {
      const res = await fetch(`${apiBase}/api/v1/oem-scraper/bulk-crawl-catalog`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          categoryUrl: req.category_url,
          targetMake: req.target_make,
          assetCategory: req.asset_category,
        }),
      });

      if (res.ok) {
        return res.json();
      }
    } catch {
      // repli local si NestJS distant n'est pas joignable directement
    }

    const resLocal = await fetch('/api/oem-scraper', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        bulk_crawl: true,
        category_url: req.category_url,
        make: req.target_make,
        asset_category: req.asset_category,
      }),
    });

    if (!resLocal.ok) {
      const err = await resLocal.json().catch(() => ({}));
      throw new Error(err.message || 'Échec du crawl universel de catalogue.');
    }

    return resLocal.json();
  }
}

