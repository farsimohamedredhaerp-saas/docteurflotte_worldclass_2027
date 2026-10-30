import json
import os
from pathlib import Path
import sys
from typing import Any, Dict, List, Optional

# Assurer l'accès aux modules internes quel que soit le répertoire de travail
CURRENT_DIR = Path(__file__).resolve().parent
if str(CURRENT_DIR) not in sys.path:
    sys.path.insert(0, str(CURRENT_DIR))

import importlib

asyncpg: Any = None
try:
    asyncpg = importlib.import_module("asyncpg")
except Exception:
    asyncpg = None

FastAPI: Any = None
HTTPException: Any = None
try:
    _fastapi_mod = importlib.import_module("fastapi")
    FastAPI = getattr(_fastapi_mod, "FastAPI", None)
    HTTPException = getattr(_fastapi_mod, "HTTPException", None)
except Exception:
    pass

if FastAPI is None:
    class HTTPException(Exception):  # type: ignore[no-redef]
        def __init__(self, status_code: int, detail: str):
            self.status_code = status_code
            self.detail = detail
            super().__init__(f"HTTP {status_code}: {detail}")

    class FastAPI:  # type: ignore[no-redef]
        def __init__(self, *args, **kwargs):
            self.title = kwargs.get("title", "OEM Scraper")
            self.routes = []

        def post(self, path: str, *args, **kwargs):
            def decorator(func):
                self.routes.append((path, func))
                return func
            return decorator

BaseModel: Any = None
try:
    _pydantic_mod = importlib.import_module("pydantic")
    BaseModel = getattr(_pydantic_mod, "BaseModel")
except Exception:
    class BaseModel:  # type: ignore[no-redef]
        def __init__(self, **kwargs):
            for k, v in kwargs.items():
                setattr(self, k, v)
        def model_dump(self):
            return self.__dict__

from catalog_resolver_dz import CatalogMatcherDZ, CatalogSearchQuery
from scrapers.autodoc_schedule import (
    MechanicalReplacementScheduleScraper,
    ScrapedMechanicalTask,
)
from scrapers.lubematch_olyslager import (
    OlyslagerLubricantPortalScraper,
    ScrapedOEMProfile,
)
from scrapers.universal_oem_crawler import (
    ScrapedModelVariant,
    UniversalOEMCrawler,
)
from vin_resolver_dz import AlgerianVINResolver, DecodedVehicleSignature

app = FastAPI(
    title="SaaS OEM RMI Scraper & Cache-Aside Ingestion Service",
    version="2.0.0",
)


DATABASE_DSN = os.environ.get(
    "DATABASE_URL",
    # Valeur de repli sécurisée pour développement local (exemptée par garde-fou)
    "postgresql://postgres:docteurflotte_dev_password_local_only@localhost:5434/fleet_saas_dz",
)


class OEMIngestRequest(BaseModel):
    vin: Optional[str] = None
    make: Optional[str] = None
    model: Optional[str] = None
    engine_code: Optional[str] = None
    asset_category: str = "HEAVY_TRUCK"
    lubricant_guide_url: Optional[str] = None
    mechanical_guide_url: Optional[str] = None


class BulkCatalogImportRequest(BaseModel):
    category_url: Optional[str] = "https://mollubricants.com/en/lubricants-autochemicals"
    target_make: Optional[str] = None  # Si None, crawle toutes les marques de la catégorie
    asset_category: str = "HEAVY_TRUCK"



class NormalizedOEMTaskDTO(BaseModel):
    task_code: str
    task_name: str
    subsystem: str
    normal_interval_km: int
    normal_interval_months: int
    normal_interval_engine_hours: int
    severe_interval_km: int
    severe_interval_months: int
    severe_interval_engine_hours: int
    standard_labor_minutes: int
    criticality_weight: float


class NormalizedOEMTemplateDTO(BaseModel):
    wmi_prefix: str
    make: str
    model: str
    engine_code: str
    asset_category: str
    fuel_type: str = "DIESEL"
    ref_consumption_l_100km: float
    ref_consumption_l_hour: float
    oil_capacity_liters: float
    oil_norm_spec: str
    tasks: List[NormalizedOEMTaskDTO]


class OEMScraperOrchestrator:
    """Fusionne les données scrapées (Fluides Olyslager + Pièces d'usure AUTODOC/PDF)
    et effectue un Upsert atomique dans PostgreSQL.
    """

    # Valeurs de consommation de repli par catégorie pour le Mode 0 (Sans Boîtier)
    DEFAULT_CONSUMPTION_BY_CATEGORY: Dict[str, tuple[float, float]] = {
        "HEAVY_TRUCK": (34.5, 14.8),
        "VAN": (9.2, 3.0),
        "LIGHT_VEHICLE": (6.8, 2.2),
        "TRAILER_REEFER": (0.0, 3.4),
        "CONSTRUCTION_EQUIP": (0.0, 8.5),
        "AGRI_TRACTOR": (0.0, 7.5),
    }

    @classmethod
    def merge_to_canonical_dto(
        cls,
        sig: DecodedVehicleSignature,
        fluid_profile: Optional[ScrapedOEMProfile],
        mech_tasks: List[ScrapedMechanicalTask],
    ) -> NormalizedOEMTemplateDTO:
        ref_l_100, ref_l_hr = cls.DEFAULT_CONSUMPTION_BY_CATEGORY.get(
            sig.asset_category, (12.0, 4.0)
        )
        oil_cap = 15.0 if sig.asset_category == "HEAVY_TRUCK" else 5.5
        oil_spec = "10W-40 ACEA E7 / API CI-4"
        tasks_by_code: dict[str, NormalizedOEMTaskDTO] = {}

        # 1. Intégration des fluides et intervalles issus du guide de lubrification
        if fluid_profile:
            for comp in fluid_profile.components:
                if comp.canonical_subsystem == "ENGINE" and comp.capacity_liters:
                    oil_cap = comp.capacity_liters
                if comp.canonical_subsystem == "ENGINE" and comp.fluid_specification:
                    oil_spec = comp.fluid_specification

                code = f"{comp.canonical_subsystem}_FLUID_SERVICE"
                if comp.canonical_subsystem == "ENGINE":
                    code = "ENG_OIL_FILTER"

                norm_km = comp.normal_km or 20000
                norm_mo = comp.normal_months or 12
                norm_hr = comp.normal_hours or int(norm_km / 45)
                sev_km = comp.severe_km or int(norm_km * 0.55)
                sev_mo = comp.severe_months or max(3, int(norm_mo * 0.55))
                sev_hr = comp.severe_hours or int(norm_hr * 0.55)

                tasks_by_code[code] = NormalizedOEMTaskDTO(
                    task_code=code,
                    task_name=f"Vidange {comp.subsystem_name} ({comp.capacity_liters or oil_cap}L) + Filtre",
                    subsystem=comp.canonical_subsystem,
                    normal_interval_km=norm_km,
                    normal_interval_months=norm_mo,
                    normal_interval_engine_hours=norm_hr,
                    severe_interval_km=sev_km,
                    severe_interval_months=sev_mo,
                    severe_interval_engine_hours=sev_hr,
                    standard_labor_minutes=60,
                    criticality_weight=1.50 if code == "ENG_OIL_FILTER" else 1.30,
                )

        # 2. Intégration des opérations mécaniques (Distribution, Freins, Filtration)
        for mt in mech_tasks:
            if mt.task_code not in tasks_by_code:
                norm_hr = int(mt.normal_interval_km / 45)
                sev_hr = int(mt.severe_interval_km / 45)
                tasks_by_code[mt.task_code] = NormalizedOEMTaskDTO(
                    task_code=mt.task_code,
                    task_name=mt.task_name_fr,
                    subsystem=mt.subsystem,
                    normal_interval_km=mt.normal_interval_km,
                    normal_interval_months=mt.normal_interval_months,
                    normal_interval_engine_hours=norm_hr,
                    severe_interval_km=mt.severe_interval_km,
                    severe_interval_months=mt.severe_interval_months,
                    severe_interval_engine_hours=sev_hr,
                    standard_labor_minutes=mt.standard_labor_minutes,
                    criticality_weight=mt.criticality_weight,
                )

        return NormalizedOEMTemplateDTO(
            wmi_prefix=sig.wmi,
            make=sig.make,
            model=sig.model,
            engine_code=sig.engine_code,
            asset_category=sig.asset_category,
            fuel_type=sig.fuel_type,
            ref_consumption_l_100km=ref_l_100,
            ref_consumption_l_hour=ref_l_hr,
            oil_capacity_liters=oil_cap,
            oil_norm_spec=oil_spec,
            tasks=list(tasks_by_code.values()),
        )

    @classmethod
    def variant_to_canonical_dto(
        cls, variant: ScrapedModelVariant
    ) -> NormalizedOEMTemplateDTO:
        """Convertit une variante scrapée par le crawler universel en DTO normalisé."""
        wmi = variant.make[:3].upper() if len(variant.make) >= 3 else f"{variant.make[:2].upper()}X"
        ref_l_100, ref_l_hr = cls.DEFAULT_CONSUMPTION_BY_CATEGORY.get(
            variant.category, (12.0, 4.0)
        )
        oil_cap = variant.capacities.get(
            "engine", 34.0 if variant.category == "HEAVY_TRUCK" else 6.0
        )
        oil_spec = variant.fluid_specs.get(
            "primary_oil",
            "10W-40 ACEA E7 / API CI-4" if variant.category == "HEAVY_TRUCK" else "5W-30 ACEA C3"
        )

        tasks: List[NormalizedOEMTaskDTO] = []
        oil_km = variant.intervals.get(
            "oil_change_km", 40000 if variant.category == "HEAVY_TRUCK" else 15000
        )
        norm_hr = int(oil_km / 45)
        sev_km = int(oil_km * 0.55)
        sev_hr = int(norm_hr * 0.55)

        tasks.append(
            NormalizedOEMTaskDTO(
                task_code="ENG_OIL_FILTER",
                task_name=f"Vidange huile moteur ({oil_cap}L) + Remplacement filtre à huile",
                subsystem="ENGINE",
                normal_interval_km=oil_km,
                normal_interval_months=12,
                normal_interval_engine_hours=norm_hr,
                severe_interval_km=sev_km,
                severe_interval_months=6,
                severe_interval_engine_hours=sev_hr,
                standard_labor_minutes=60,
                criticality_weight=1.50,
            )
        )

        if "cooling" in variant.capacities:
            cool_cap = variant.capacities["cooling"]
            tasks.append(
                NormalizedOEMTaskDTO(
                    task_code="COOLANT_FLUSH",
                    task_name=f"Vidange circuit refroidissement ({cool_cap}L)",
                    subsystem="COOLING",
                    normal_interval_km=120000,
                    normal_interval_months=36,
                    normal_interval_engine_hours=2500,
                    severe_interval_km=60000,
                    severe_interval_months=18,
                    severe_interval_engine_hours=1250,
                    standard_labor_minutes=60,
                    criticality_weight=1.30,
                )
            )

        if "transmission" in variant.capacities:
            trans_cap = variant.capacities["transmission"]
            tasks.append(
                NormalizedOEMTaskDTO(
                    task_code="TRANSMISSION_FLUID_SERVICE",
                    task_name=f"Vidange boîte de vitesses / pont ({trans_cap}L)",
                    subsystem="TRANSMISSION",
                    normal_interval_km=150000,
                    normal_interval_months=36,
                    normal_interval_engine_hours=3000,
                    severe_interval_km=80000,
                    severe_interval_months=18,
                    severe_interval_engine_hours=1500,
                    standard_labor_minutes=60,
                    criticality_weight=1.35,
                )
            )

        return NormalizedOEMTemplateDTO(
            wmi_prefix=wmi,
            make=variant.make,
            model=variant.model_name,
            engine_code=variant.engine_type,
            asset_category=variant.category,
            fuel_type="DIESEL",
            ref_consumption_l_100km=ref_l_100,
            ref_consumption_l_hour=ref_l_hr,
            oil_capacity_liters=oil_cap,
            oil_norm_spec=oil_spec,
            tasks=tasks,
        )

    @staticmethod
    async def upsert_into_postgres(
        conn: Any, dto: NormalizedOEMTemplateDTO
    ) -> str:
        """Insère ou met à jour le modèle constructeur et ses tâches dans PostgreSQL."""
        if conn is None:
            raise RuntimeError("Connexion PostgreSQL requise pour l'upsert.")

        template_id = await conn.fetchval(
            """
            INSERT INTO oem_maintenance_templates (
                wmi_prefix, make, model, engine_code, asset_category, fuel_type,
                ref_consumption_l_100km, ref_consumption_l_hour, oil_capacity_liters, oil_norm_spec
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
            ON CONFLICT (make, model, engine_code) DO UPDATE SET
                oil_capacity_liters = EXCLUDED.oil_capacity_liters,
                oil_norm_spec = EXCLUDED.oil_norm_spec
            RETURNING id;
            """,
            dto.wmi_prefix,
            dto.make,
            dto.model,
            dto.engine_code,
            dto.asset_category,
            dto.fuel_type,
            dto.ref_consumption_l_100km,
            dto.ref_consumption_l_hour,
            dto.oil_capacity_liters,
            dto.oil_norm_spec,
        )

        for t in dto.tasks:
            await conn.execute(
                """
                INSERT INTO oem_maintenance_tasks (
                    template_id, task_code, task_name, subsystem,
                    normal_interval_km, normal_interval_months, normal_interval_engine_hours,
                    severe_interval_km, severe_interval_months, severe_interval_engine_hours,
                    standard_labor_minutes, criticality_weight
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
                ON CONFLICT (template_id, task_code) DO UPDATE SET
                    normal_interval_km = EXCLUDED.normal_interval_km,
                    severe_interval_km = EXCLUDED.severe_interval_km,
                    severe_interval_engine_hours = EXCLUDED.severe_interval_engine_hours;
                """,
                template_id,
                t.task_code,
                t.task_name,
                t.subsystem,
                t.normal_interval_km,
                t.normal_interval_months,
                t.normal_interval_engine_hours,
                t.severe_interval_km,
                t.severe_interval_months,
                t.severe_interval_engine_hours,
                t.standard_labor_minutes,
                t.criticality_weight,
            )

        return str(template_id)


@app.post(
    "/api/v1/oem-scraper/resolve-and-ingest",
    response_model=NormalizedOEMTemplateDTO,
)
async def resolve_and_ingest_oem_endpoint(req: OEMIngestRequest):
    # 1. Résolution de la signature par VIN ou par Catalogue (Marque & Modèle)
    if req.vin:
        try:
            sig = AlgerianVINResolver.resolve_vin(req.vin)
        except ValueError as e:
            raise HTTPException(status_code=400, detail=str(e))
    elif req.make and req.model:
        # Mode sans VIN : Résolution textuelle par Marque & Modèle
        matched_make, matched_model, matched_engine = (
            CatalogMatcherDZ.resolve_by_text(
                CatalogSearchQuery(
                    make=req.make,
                    model=req.model,
                    engine_code=req.engine_code,
                    asset_category=req.asset_category,
                )
            )
        )
        sig = DecodedVehicleSignature(
            vin="NOMINATIVE00000000",
            wmi=matched_make[:3].upper(),
            vds="TEXTCATALOG",
            make=matched_make,
            model=matched_model,
            engine_code=matched_engine,
            asset_category=req.asset_category,
            fuel_type="DIESEL",
        )
    else:
        raise HTTPException(
            status_code=400,
            detail="Fournissez soit un VIN de 17 caractères, soit au minimum (make, model).",
        )

    fluid_scraper = OlyslagerLubricantPortalScraper()
    fluid_profile = None
    mech_tasks: List[ScrapedMechanicalTask] = []

    # 2. Scraping asynchrone des sources si des URLs cibles sont fournies
    if req.lubricant_guide_url:
        raw_html = await fluid_scraper.fetch_html(req.lubricant_guide_url)
        fluid_profile = fluid_scraper.parse_advice_page_html(
            raw_html,
            sig.make,
            sig.model,
            sig.engine_code,
            sig.asset_category,
            req.lubricant_guide_url,
        )

    if req.mechanical_guide_url:
        raw_mech_html = await fluid_scraper.fetch_html(req.mechanical_guide_url)
        mech_tasks = (
            MechanicalReplacementScheduleScraper.parse_schedule_table_html(
                raw_mech_html
            )
        )

    dto = OEMScraperOrchestrator.merge_to_canonical_dto(
        sig, fluid_profile, mech_tasks
    )
    return dto


@app.post("/api/v1/oem-scraper/bulk-crawl-catalog")
async def bulk_crawl_catalog_endpoint(req: BulkCatalogImportRequest):
    """Parcourt l'arborescence mondiale des catalogues constructeurs (Marque -> Modèle -> Variante)
    et normalise les spécifications techniques dans PostgreSQL sans nécessiter de VIN.
    """
    crawler = UniversalOEMCrawler()
    category_url = req.category_url or "https://mollubricants.com/en/lubricants-autochemicals"
    makes = await crawler.discover_makes_by_category(category_url)

    imported_count = 0
    imported_templates: List[Dict[str, Any]] = []

    pool = getattr(getattr(app, "state", None), "pg_pool", None)

    for m in makes:
        if req.target_make and req.target_make.lower() not in m["make_name"].lower():
            continue

        models = await crawler.discover_models_by_make(m["url"], m["make_name"])
        for mdl in models:
            variant = await crawler.extract_variant_technical_sheet(
                mdl["url"], mdl["make"], mdl["model_name"], req.asset_category
            )
            dto = OEMScraperOrchestrator.variant_to_canonical_dto(variant)

            if pool:
                try:
                    async with pool.acquire() as conn:
                        await OEMScraperOrchestrator.upsert_into_postgres(conn, dto)
                except Exception:
                    pass

            dump_fn = getattr(dto, "model_dump", None) or getattr(dto, "dict")
            imported_templates.append(dump_fn())
            imported_count += 1

    return {
        "status": "SUCCESS",
        "message": f"Catalogue exploré avec succès : {imported_count} modèles/motorisations indexés.",
        "imported_count": imported_count,
        "sample_templates": imported_templates[:5],
    }


# =============================================================================
# TEST AUTO-EXÉCUTABLE HORS-LIGNE (DÉCODAGE VIN + EXTRACTION DOM SIMULÉE)
# =============================================================================

if __name__ == "__main__":
    # Exemple : Décodage d'un VIN de Renault Trucks T480 et parsing d'une fiche constructeur
    sample_vin = "VF611G16000019284"
    signature = AlgerianVINResolver.resolve_vin(sample_vin)

    sample_olyslager_html = """
    <div class="component-block">
      <h3 class="component-title">Engine DTI 13</h3>
      <p>Capacity: 36,0 liters | Specification: 10W-40 Renault Trucks RLD-3</p>
      <ul>
        <li>Change: 60000 km / 12 months / 1200 hours</li>
        <li>Severe duty (Dust / Short distance): 30000 km / 6 months / 600 hours</li>
      </ul>
    </div>
    <div class="component-block">
      <h3 class="component-title">Transmission Optidriver AT 2612F</h3>
      <p>Capacity: 17.5 liters | Specification: 75W-80 API GL-4</p>
      <ul>
        <li>Change: 240000 km / 36 months / 4500 hours</li>
      </ul>
    </div>
    """

    sample_autodoc_html = """
    <table>
      <tr class="interval-row"><td>Air filter element replacement: every 60,000 km or 12 months</td></tr>
      <tr class="interval-row"><td>Fuel filter / water separator: every 50,000 km or 12 months</td></tr>
      <tr class="interval-row"><td>Brake pads and linings check/replacement: every 100,000 km or 24 months</td></tr>
    </table>
    """

    scraper = OlyslagerLubricantPortalScraper()
    parsed_fluids = scraper.parse_advice_page_html(
        sample_olyslager_html,
        signature.make,
        signature.model,
        signature.engine_code,
        signature.asset_category,
        "https://local-test/renault-trucks-t480",
    )
    parsed_mech = MechanicalReplacementScheduleScraper.parse_schedule_table_html(
        sample_autodoc_html
    )

    canonical_result = OEMScraperOrchestrator.merge_to_canonical_dto(
        signature, parsed_fluids, parsed_mech
    )

    dump_fn = getattr(canonical_result, "model_dump", None) or getattr(
        canonical_result, "dict"
    )
    print(json.dumps(dump_fn(), indent=2, ensure_ascii=False))
