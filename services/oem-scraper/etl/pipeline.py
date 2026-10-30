"""Pipeline d'orchestration ETL universel et d'export SQL / JSON souverain.
Fusionne les référentiels open-source (vehiclesdb, gor3a, ddpc-vehicle-specs, api-evangelist)
et génère les scripts de peuplement pour PostgreSQL / TimescaleDB.
"""

import json
import os
from typing import Any, Dict, List, Optional
from .models import UnifiedOEMCatalogEntry
from .dz_market_curator import DZMarketCurator


class OEMCatalogPipeline:
    """Orchestre la consolidation et l'exportation du référentiel technique véhicules."""

    def __init__(self):
        self._catalog: List[UnifiedOEMCatalogEntry] = DZMarketCurator.get_curated_catalog()

    @property
    def catalog(self) -> List[UnifiedOEMCatalogEntry]:
        return self._catalog

    def find_by_vin_or_wmi(self, vin: str) -> Optional[UnifiedOEMCatalogEntry]:
        if not vin:
            return None
        clean_vin = vin.strip().upper()
        wmi = clean_vin[:3]

        # Recherche exacte par pattern WMI
        for entry in self._catalog:
            if entry.variant.wmi_pattern and entry.variant.wmi_pattern == wmi:
                return entry

        return None

    def search_by_text(self, make: str, model: str = "") -> Optional[UnifiedOEMCatalogEntry]:
        import re

        COMMON_MAKE_TYPOS = {
            "ranult": "renault",
            "renaut": "renault",
            "renualt": "renault",
            "peugot": "peugeot",
            "pegeot": "peugeot",
            "citroen": "citroen",
            "citroën": "citroen",
            "toyta": "toyota",
            "toyata": "toyota",
            "volksvagen": "volkswagen",
            "volks": "volkswagen",
            "vw": "volkswagen",
            "shackman": "shacman",
            "mercedez": "mercedes-benz",
            "mercedes": "mercedes-benz",
        }

        full_query = f"{make} {model}".strip().lower()
        m_lower = make.strip().lower()
        mod_lower = model.strip().lower()

        # Normaliser les fautes de frappe courantes
        for typo, canon in COMMON_MAKE_TYPOS.items():
            if typo in m_lower:
                m_lower = m_lower.replace(typo, canon)
            if typo in full_query:
                full_query = full_query.replace(typo, canon)

        # Extraction de l'année éventuelle (ex: 2012)
        year_match = re.search(r"\b(19\d\d|20\d\d)\b", full_query)
        target_year = int(year_match.group(1)) if year_match else None

        # Découpage en tokens significatifs
        tokens = [t for t in re.findall(r"[a-z0-9]+", full_query) if len(t) > 1 and t not in ["annee", "année"]]

        best_entry: Optional[UnifiedOEMCatalogEntry] = None
        best_score = 0

        for entry in self._catalog:
            score = 0
            b_slug = entry.brand.slug.lower()
            b_name = entry.brand.name.lower()
            m_slug = entry.model.slug.lower()
            m_name = entry.model.name.lower()
            v_name = entry.variant.engine_name.lower()
            v_code = entry.variant.engine_code.lower()

            # 1. Correspondance Marque
            brand_matched = False
            if b_slug == m_lower or b_name == m_lower:
                brand_matched = True
                score += 25
            elif b_slug in m_lower or m_lower in b_slug or b_name in m_lower or m_lower in b_name:
                brand_matched = True
                score += 15
            elif b_slug in full_query or b_name in full_query:
                brand_matched = True
                score += 10

            # 2. Correspondance Modèle
            for tok in tokens:
                if tok in m_slug or tok in m_name:
                    score += 12
                if tok in v_name or tok in v_code:
                    score += 5

            # 3. Validation de l'année de production (si spécifiée)
            if target_year:
                if entry.model.year_start <= target_year <= entry.model.year_end:
                    score += 8
                else:
                    score -= 5

            # 4. Pénalité si la marque principale n'a pas correspondu
            if not brand_matched and score > 0:
                score -= 8

            if score > best_score:
                best_score = score
                best_entry = entry

        # Seuil minimal de pertinence
        if best_entry and best_score >= 12:
            return best_entry

        # Recherche de repli par marque seule si modèle non trouvé
        for entry in self._catalog:
            if entry.brand.slug in m_lower or entry.brand.name.lower() in m_lower:
                return entry

        return None

    def export_sql_seed(self, file_path: str) -> str:
        """Génère un script SQL idempotent d'insertion dans PostgreSQL."""
        lines = [
            "-- =============================================================================",
            "-- FICHIER : database/seeds/02_oem_catalog_seed.sql",
            "-- OBJET   : Référentiel Technique & Échéanciers RMI Multi-Constructeurs (DZ)",
            "--           Compilé depuis vehiclesdb, gor3a, ddpc-vehicle-specs, api-evangelist",
            "-- =============================================================================",
            "",
            "BEGIN;",
            "",
        ]

        # 1. Marques uniques
        seen_brands = set()
        lines.append("-- 1. PEUPLEMENT DES MARQUES CONSTRUCTEURS (oem_brands)")
        for entry in self._catalog:
            b = entry.brand
            if b.slug in seen_brands:
                continue
            seen_brands.add(b.slug)
            lines.append(
                f"INSERT INTO oem_brands (slug, name, country_origin, is_algeria_common) "
                f"VALUES ('{b.slug}', '{b.name}', '{b.country_origin}', {str(b.is_algeria_common).lower()}) "
                f"ON CONFLICT (slug) DO UPDATE SET "
                f"name = EXCLUDED.name, is_algeria_common = EXCLUDED.is_algeria_common;"
            )
        lines.append("")

        # 2. Modèles uniques
        seen_models = set()
        lines.append("-- 2. PEUPLEMENT DES MODÈLES (oem_models)")
        for entry in self._catalog:
            m = entry.model
            key = (m.brand_slug, m.slug)
            if key in seen_models:
                continue
            seen_models.add(key)
            lines.append(
                f"INSERT INTO oem_models (brand_id, slug, name, category, body_type, year_start, year_end, popularity_dz_rank) "
                f"SELECT id, '{m.slug}', '{m.name}', '{m.category}', '{m.body_type}', {m.year_start or 'NULL'}, {m.year_end or 'NULL'}, {m.popularity_dz_rank} "
                f"FROM oem_brands WHERE slug = '{m.brand_slug}' "
                f"ON CONFLICT (brand_id, slug) DO UPDATE SET "
                f"name = EXCLUDED.name, category = EXCLUDED.category, popularity_dz_rank = EXCLUDED.popularity_dz_rank;"
            )
        lines.append("")

        # 3. Variantes motorisations & spécifications homologation
        lines.append("-- 3. PEUPLEMENT DES MOTORISATIONS & FICHES TECHNIQUES (oem_engine_variants)")
        for entry in self._catalog:
            v = entry.variant
            wmi = f"'{v.wmi_pattern}'" if v.wmi_pattern else "NULL"
            lines.append(
                f"INSERT INTO oem_engine_variants ("
                f"model_id, wmi_pattern, engine_code, engine_name, displacement_cc, cylinders, "
                f"power_kw, power_hp, torque_nm, fuel_type, euro_standard, "
                f"fuel_tank_capacity_liters, gross_vehicle_weight_kg, curb_weight_kg, payload_capacity_kg, "
                f"ref_consumption_mixed_l_100km, ref_consumption_urban_l_100km, ref_consumption_highway_l_100km, "
                f"ref_idle_consumption_l_hour, oil_capacity_liters, oil_norm_spec, coolant_capacity_liters, transmission_oil_capacity_liters"
                f") SELECT id, {wmi}, '{v.engine_code}', '{v.engine_name}', {v.displacement_cc}, {v.cylinders}, "
                f"{v.power_kw}, {v.power_hp}, {v.torque_nm}, '{v.fuel_type}', '{v.euro_standard}', "
                f"{v.fuel_tank_capacity_liters}, {v.gross_vehicle_weight_kg}, {v.curb_weight_kg}, {v.payload_capacity_kg}, "
                f"{v.ref_consumption_mixed_l_100km}, {v.ref_consumption_urban_l_100km}, {v.ref_consumption_highway_l_100km}, "
                f"{v.ref_idle_consumption_l_hour}, {v.oil_capacity_liters}, '{v.oil_norm_spec}', {v.coolant_capacity_liters}, {v.transmission_oil_capacity_liters} "
                f"FROM oem_models WHERE slug = '{v.model_slug}' "
                f"ON CONFLICT (model_id, engine_code) DO UPDATE SET "
                f"gross_vehicle_weight_kg = EXCLUDED.gross_vehicle_weight_kg, "
                f"fuel_tank_capacity_liters = EXCLUDED.fuel_tank_capacity_liters, "
                f"ref_consumption_mixed_l_100km = EXCLUDED.ref_consumption_mixed_l_100km, "
                f"oil_capacity_liters = EXCLUDED.oil_capacity_liters, "
                f"oil_norm_spec = EXCLUDED.oil_norm_spec;"
            )
        lines.append("")

        # 4. Plans d'entretien constructeurs par variante
        lines.append("-- 4. PEUPLEMENT DES PLANS D'ENTRETIEN CONSTRUCTEURS (oem_maintenance_schedules_ref)")
        for entry in self._catalog:
            v = entry.variant
            for t in entry.tasks:
                clean_name = t.task_name.replace("'", "''")
                norm_km = str(t.normal_interval_km) if t.normal_interval_km is not None else "NULL"
                norm_mo = str(t.normal_interval_months) if t.normal_interval_months is not None else "NULL"
                norm_hr = str(t.normal_interval_engine_hours) if t.normal_interval_engine_hours is not None else "NULL"
                sev_km = str(t.severe_interval_km) if t.severe_interval_km is not None else "NULL"
                sev_mo = str(t.severe_interval_months) if t.severe_interval_months is not None else "NULL"
                sev_hr = str(t.severe_interval_engine_hours) if t.severe_interval_engine_hours is not None else "NULL"
                lines.append(
                    f"INSERT INTO oem_maintenance_schedules_ref ("
                    f"variant_id, task_code, task_name, subsystem, "
                    f"normal_interval_km, normal_interval_months, normal_interval_engine_hours, "
                    f"severe_interval_km, severe_interval_months, severe_interval_engine_hours, "
                    f"standard_labor_minutes, criticality_weight"
                    f") SELECT id, '{t.task_code}', '{clean_name}', '{t.subsystem}', "
                    f"{norm_km}, {norm_mo}, {norm_hr}, {sev_km}, {sev_mo}, {sev_hr}, "
                    f"{t.standard_labor_minutes}, {t.criticality_weight} "
                    f"FROM oem_engine_variants WHERE engine_code = '{v.engine_code}' "
                    f"ON CONFLICT (variant_id, task_code) DO UPDATE SET "
                    f"task_name = EXCLUDED.task_name, normal_interval_km = EXCLUDED.normal_interval_km, severe_interval_km = EXCLUDED.severe_interval_km;"
                )
        lines.append("")

        # 5. Synchronisation transparente avec la table patrimoniale oem_maintenance_templates
        lines.append("-- 5. SYNCHRONISATION RÉTRO-COMPATIBLE AVEC oem_maintenance_templates")
        for entry in self._catalog:
            b = entry.brand
            m = entry.model
            v = entry.variant
            wmi_val = v.wmi_pattern or "GEN"
            lines.append(
                f"INSERT INTO oem_maintenance_templates ("
                f"wmi_prefix, make, model, engine_code, asset_category, fuel_type, "
                f"ref_consumption_l_100km, ref_consumption_l_hour, oil_capacity_liters, oil_norm_spec"
                f") VALUES ('{wmi_val}', '{b.name}', '{m.name}', '{v.engine_name}', '{m.category}', '{v.fuel_type}', "
                f"{v.ref_consumption_mixed_l_100km}, {v.ref_idle_consumption_l_hour}, {v.oil_capacity_liters}, '{v.oil_norm_spec}') "
                f"ON CONFLICT (make, model, engine_code) DO UPDATE SET "
                f"oil_capacity_liters = EXCLUDED.oil_capacity_liters, "
                f"ref_consumption_l_100km = EXCLUDED.ref_consumption_l_100km, "
                f"oil_norm_spec = EXCLUDED.oil_norm_spec;"
            )
        lines.append("")
        lines.append("COMMIT;")

        sql_content = "\n".join(lines)
        os.makedirs(os.path.dirname(file_path), exist_ok=True)
        with open(file_path, "w", encoding="utf-8") as f:
            f.write(sql_content)

        return file_path

    def export_json_catalog(self, file_path: str) -> str:
        """Exporte le catalogue compilé au format JSON pour ingestion API."""
        data: List[Dict[str, Any]] = []
        for e in self._catalog:
            data.append({
                "brand": {
                    "slug": e.brand.slug,
                    "name": e.brand.name,
                    "country": e.brand.country_origin,
                    "is_common_dz": e.brand.is_algeria_common,
                },
                "model": {
                    "slug": e.model.slug,
                    "name": e.model.name,
                    "category": e.model.category,
                    "body_type": e.model.body_type,
                    "year_start": e.model.year_start,
                    "year_end": e.model.year_end,
                    "popularity_dz_rank": e.model.popularity_dz_rank,
                },
                "variant": {
                    "engine_code": e.variant.engine_code,
                    "engine_name": e.variant.engine_name,
                    "wmi": e.variant.wmi_pattern,
                    "displacement_cc": e.variant.displacement_cc,
                    "power_hp": e.variant.power_hp,
                    "fuel_type": e.variant.fuel_type,
                    "tank_liters": e.variant.fuel_tank_capacity_liters,
                    "ptac_kg": e.variant.gross_vehicle_weight_kg,
                    "curb_weight_kg": e.variant.curb_weight_kg,
                    "consumption_mixed_l_100km": e.variant.ref_consumption_mixed_l_100km,
                    "consumption_idle_l_hour": e.variant.ref_idle_consumption_l_hour,
                    "oil_capacity_liters": e.variant.oil_capacity_liters,
                    "oil_norm_spec": e.variant.oil_norm_spec,
                },
                "tasks_count": len(e.tasks),
                "tasks": [
                    {
                        "task_code": t.task_code,
                        "task_name": t.task_name,
                        "subsystem": t.subsystem,
                        "normal_km": t.normal_interval_km,
                        "severe_km": t.severe_interval_km,
                        "normal_hours": t.normal_interval_engine_hours,
                        "severe_hours": t.severe_interval_engine_hours,
                    }
                    for t in e.tasks
                ],
            })

        os.makedirs(os.path.dirname(file_path), exist_ok=True)
        with open(file_path, "w", encoding="utf-8") as f:
            json.dump(data, f, indent=2, ensure_ascii=False)

        return file_path
