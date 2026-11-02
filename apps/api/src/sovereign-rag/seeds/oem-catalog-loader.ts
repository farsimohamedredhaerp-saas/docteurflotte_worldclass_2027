// Fichier : apps/api/src/sovereign-rag/seeds/oem-catalog-loader.ts
import * as path from 'path';
import * as fs from 'fs';
import { IngestKnowledgeItemDto, KnowledgeCategory, VehicleSubsystem } from '../dto/sovereign-rag.dto';

interface MasterCatalogEntry {
  brand: {
    name: string;
    slug: string;
    country: string;
    is_common_dz: boolean;
  };
  model: {
    name: string;
    slug: string;
    category: string;
    body_type: string;
    year_start: number;
    year_end: number;
  };
  variant: {
    engine_code: string;
    engine_name: string;
    wmi: string;
    displacement_cc: number;
    power_hp: number;
    fuel_type: string;
    tank_liters: number;
    ptac_kg: number;
    curb_weight_kg: number;
    consumption_mixed_l_100km: number;
    consumption_idle_l_hour: number;
    oil_capacity_liters: number;
    oil_norm_spec: string;
  };
  tasks?: Array<{
    task_code: string;
    task_name: string;
    subsystem: string;
    normal_km: number;
    severe_km: number;
    normal_hours?: number;
    severe_hours?: number;
  }>;
}

export function loadMasterCatalogSeeds(): IngestKnowledgeItemDto[] {
  const seeds: IngestKnowledgeItemDto[] = [];

  // Cherche le fichier dans apps/web/src/lib/oem_catalog_master.json
  const possiblePaths = [
    path.resolve(process.cwd(), '../web/src/lib/oem_catalog_master.json'),
    path.resolve(process.cwd(), 'apps/web/src/lib/oem_catalog_master.json'),
    path.resolve(__dirname, '../../../../web/src/lib/oem_catalog_master.json'),
  ];

  let rawData = '';
  for (const p of possiblePaths) {
    if (fs.existsSync(p)) {
      rawData = fs.readFileSync(p, 'utf-8');
      break;
    }
  }

  if (!rawData) {
    return seeds;
  }

  try {
    const catalog: MasterCatalogEntry[] = JSON.parse(rawData);

    for (const item of catalog) {
      const brand = item.brand?.name || 'Constructeur Flotte';
      const model = item.model?.name || 'Modèle Standard';
      const variant = item.variant;

      if (!variant) continue;

      // Map subsystem
      let subsystem = VehicleSubsystem.MOTEUR;
      if (item.model.category === 'CONSTRUCTION_EQUIP') {
        subsystem = VehicleSubsystem.MOTEUR;
      }

      // Construction de la description technique détaillée
      const tasksSummary = (item.tasks || [])
        .map(
          (t) =>
            `• ${t.task_name} : Tous les ${t.normal_km?.toLocaleString('fr-DZ')} km (Usage sévère saharien: ${t.severe_km?.toLocaleString('fr-DZ')} km).`,
        )
        .join('\n');

      const content = `Spécifications techniques officielles constructeur pour ${brand} ${model} (${variant.engine_name}).
Type moteur : ${variant.engine_code || 'N/A'}, Cylindrée : ${variant.displacement_cc || 0} cc, Puissance : ${variant.power_hp || 0} Ch.
Carburant : ${variant.fuel_type || 'DIESEL'}. Capacité réservoir : ${variant.tank_liters || 0} L.
Consommation de référence : ${variant.consumption_mixed_l_100km || 0} L/100km mixte, ${variant.consumption_idle_l_hour || 0} L/h au ralenti.
Circuit de lubrification : Capacité d'huile ${variant.oil_capacity_liters || 0} Litres. Norme préconisée : ${variant.oil_norm_spec || 'Huile moteur préconisée'}.
Intervalles de révision recommandés :
${tasksSummary || 'Programme de maintenance selon carnet constructeur.'}`;

      const structuredSpecs: Record<string, unknown> = {
        oil_capacity_liters: variant.oil_capacity_liters || 0,
        oil_norm_spec: variant.oil_norm_spec || 'N/A',
        power_hp: variant.power_hp || 0,
        displacement_cc: variant.displacement_cc || 0,
        tank_liters: variant.tank_liters || 0,
        consumption_l_100km: variant.consumption_mixed_l_100km || 0,
        consumption_idle_l_h: variant.consumption_idle_l_hour || 0,
        ptac_kg: variant.ptac_kg || 0,
        wmi_prefix: variant.wmi || '',
        category: item.model.category || 'VEHICLE',
        tasks: (item.tasks || []).map((t) => ({
          code: t.task_code,
          name: t.task_name,
          normal_km: t.normal_km,
          severe_km: t.severe_km,
        })),
      };

      seeds.push({
        category: KnowledgeCategory.OEM_MANUAL,
        manufacturer: brand.toUpperCase().replace(/\s+/g, '_').replace(/[^A-Z0-9_]/g, ''),
        model_series: `${model} (${variant.engine_name})`,
        subsystem,
        section_title: `${brand} ${model} — Fiche Entretien & Lubrification ${variant.engine_name}`,
        content,
        structured_specs: structuredSpecs,
      });
    }
  } catch (err) {
    // Ignore parse error
  }

  return seeds;
}

