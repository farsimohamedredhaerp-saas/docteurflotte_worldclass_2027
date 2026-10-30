import unittest
from pathlib import Path
import sys

CURRENT_DIR = Path(__file__).resolve().parent
if str(CURRENT_DIR) not in sys.path:
    sys.path.insert(0, str(CURRENT_DIR))

from catalog_resolver_dz import CatalogMatcherDZ, CatalogSearchQuery
from vin_resolver_dz import AlgerianVINResolver
from scrapers.lubematch_olyslager import OlyslagerLubricantPortalScraper
from scrapers.autodoc_schedule import MechanicalReplacementScheduleScraper
from pipeline_orchestrator import OEMScraperOrchestrator


class TestOEMScraperService(unittest.TestCase):

    def test_algerian_vin_resolver_core_fleet(self):
        """Vérifie la résolution déterministe hors-ligne des VINs prioritaires en Algérie."""
        test_cases = [
            ("VF611G16000019284", "Renault Trucks", "T 480 / K 480", "DTI 13 (12.8L)", "HEAVY_TRUCK"),
            ("WMA26S90000123456", "MAN", "TGS 33.440 / 40.440", "D2066 LF (10.5L)", "HEAVY_TRUCK"),
            ("WDB93400000123456", "Mercedes-Benz", "Actros 2041 / 3344", "OM 501 LA V6 (11.9L)", "HEAVY_TRUCK"),
            ("LZGJL400000123456", "Shacman", "X3000 / F3000 6x4", "Weichai WP12.430E201", "HEAVY_TRUCK"),
            ("VFAK6600000123456", "SNVI", "K66 / K120", "Deutz F6L912 (Air-Cooled)", "HEAVY_TRUCK"),
            ("JAANPR00000123456", "Isuzu", "NPR 71 / NQR 75", "4HK1-TCN (5.2L)", "HEAVY_TRUCK"),
            ("VF1MA000000123456", "Renault", "Master III", "2.3 dCi M9T", "VAN"),
            ("VF37B900000123456", "Peugeot", "Partner / Doblo", "1.6 HDi 92 (DV6DTED)", "VAN"),
            ("AHTFR200000123456", "Toyota", "Hilux 4x4 Double Cab", "2.4 D-4D (2GD-FTV)", "LIGHT_VEHICLE"),
            ("UU1HSD00000123456", "Dacia", "Duster / Logan", "1.5 dCi (K9K)", "LIGHT_VEHICLE"),
        ]

        for vin, expected_make, expected_model, expected_engine, expected_cat in test_cases:
            sig = AlgerianVINResolver.resolve_vin(vin)
            self.assertEqual(sig.make, expected_make, f"Échec marque pour {vin}")
            self.assertEqual(sig.model, expected_model, f"Échec modèle pour {vin}")
            self.assertEqual(sig.engine_code, expected_engine, f"Échec moteur pour {vin}")
            self.assertEqual(sig.asset_category, expected_cat, f"Échec catégorie pour {vin}")

    def test_vin_resolver_invalid_format(self):
        """Vérifie le rejet strict des VINs corrompus ou hors standard 17 caractères."""
        with self.assertRaises(ValueError):
            AlgerianVINResolver.resolve_vin("VF611G")
        with self.assertRaises(ValueError):
            AlgerianVINResolver.resolve_vin("VF611G16000019284999")

    def test_olyslager_interval_and_capacity_parsing(self):
        """Vérifie l'extraction regex des capacités et intervalles multilingues."""
        scraper = OlyslagerLubricantPortalScraper()
        
        # Test parsing d'intervalles
        res1 = scraper.parse_interval_string("Change: 60000 km / 12 months / 1200 hours")
        self.assertEqual(res1["km"], 60000)
        self.assertEqual(res1["months"], 12)
        self.assertEqual(res1["hours"], 1200)

        res2 = scraper.parse_interval_string("Severe: 30000 km / 6 mois / 600 h")
        self.assertEqual(res2["km"], 30000)
        self.assertEqual(res2["months"], 6)
        self.assertEqual(res2["hours"], 600)

        # Test mapping des organes
        self.assertEqual(scraper.map_subsystem("Engine Oil Carter"), "ENGINE")
        self.assertEqual(scraper.map_subsystem("Boîte de vitesses manuelle"), "TRANSMISSION")
        self.assertEqual(scraper.map_subsystem("Circuit de refroidissement"), "COOLING")
        self.assertEqual(scraper.map_subsystem("Freinage hydraulique"), "BRAKES")

    def test_autodoc_schedule_parsing(self):
        """Vérifie la normalisation des tâches mécaniques et barèmes d'usure."""
        html = """
        <table>
          <tr><td>Timing belt replacement: every 160,000 km or 5 years</td></tr>
          <tr><td>Fuel filter replacement: every 40,000 km or 12 months</td></tr>
          <tr><td>Coolant flush and bleed: every 100,000 km or 36 months</td></tr>
        </table>
        """
        tasks = MechanicalReplacementScheduleScraper.parse_schedule_table_html(html)
        task_codes = {t.task_code for t in tasks}

        self.assertIn("TIMING_BELT_KIT", task_codes)
        self.assertIn("FUEL_FILTER_SYSTEM", task_codes)
        self.assertIn("COOLANT_FLUSH", task_codes)

        timing_task = next(t for t in tasks if t.task_code == "TIMING_BELT_KIT")
        self.assertEqual(timing_task.normal_interval_km, 160000)
        self.assertEqual(timing_task.normal_interval_months, 60)
        self.assertEqual(timing_task.severe_interval_km, 104000)  # 160000 * 0.65

    def test_canonical_dto_merging(self):
        """Vérifie la fusion canonique d'un véhicule complet dans le DTO OEM."""
        sig = AlgerianVINResolver.resolve_vin("LZGJL400000123456")
        dto = OEMScraperOrchestrator.merge_to_canonical_dto(sig, None, [])

        self.assertEqual(dto.make, "Shacman")
        self.assertEqual(dto.model, "X3000 / F3000 6x4")
        self.assertEqual(dto.engine_code, "Weichai WP12.430E201")
        self.assertEqual(dto.asset_category, "HEAVY_TRUCK")
        self.assertEqual(dto.ref_consumption_l_100km, 34.5)
        self.assertEqual(dto.ref_consumption_l_hour, 14.8)

    def test_catalog_matcher_without_vin(self):
        """Vérifie la résolution textuelle (sans VIN) par Marque et Modèle."""
        make, model, engine = CatalogMatcherDZ.resolve_by_text(
            CatalogSearchQuery(make="renault trucks", model="t480")
        )
        self.assertEqual(make, "Renault Trucks")
        self.assertEqual(model, "T 480 / K 480")
        self.assertEqual(engine, "DTI 13 (12.8L)")

        make_shac, model_shac, engine_shac = CatalogMatcherDZ.resolve_by_text(
            CatalogSearchQuery(make="shacman", model="x3000")
        )
        self.assertEqual(make_shac, "Shacman")
        self.assertEqual(model_shac, "X3000 / F3000 6x4")
        self.assertEqual(engine_shac, "Weichai WP12.430E201")

        make_snvi, model_snvi, engine_snvi = CatalogMatcherDZ.resolve_by_text(
            CatalogSearchQuery(make="snvi", model="k66")
        )
        self.assertEqual(make_snvi, "SNVI")
        self.assertEqual(model_snvi, "K66 / K120")
        self.assertEqual(engine_snvi, "Deutz F6L912 (Air-Cooled)")

    def test_universal_crawler_world_catalog_discovery(self):
        """Vérifie le crawling universel multi-niveaux sans VIN (Scania, Volvo, Caterpillar)."""
        import asyncio
        from scrapers.universal_oem_crawler import UniversalOEMCrawler, ScrapedModelVariant

        crawler = UniversalOEMCrawler()

        # 1. Découverte des marques
        makes = asyncio.run(crawler.discover_makes_by_category("https://portal/trucks-buses"))
        make_names = [m["make_name"] for m in makes]
        self.assertIn("Scania", make_names)
        self.assertIn("Volvo Trucks", make_names)

        # 2. Découverte des modèles pour Scania
        scania_models = asyncio.run(crawler.discover_models_by_make("https://portal/trucks/scania", "Scania"))
        scania_model_names = [m["model_name"] for m in scania_models]
        self.assertTrue(any("R 450" in name for name in scania_model_names))

        # 3. Extraction d'une fiche technique Scania
        variant = asyncio.run(crawler.extract_variant_technical_sheet(
            "https://portal/trucks/scania/r450", "Scania", "R 450 / R 500", "HEAVY_TRUCK"
        ))
        self.assertEqual(variant.make, "Scania")
        self.assertIn("DC13", variant.engine_type)
        self.assertEqual(variant.capacities["engine"], 38.0)
        self.assertEqual(variant.intervals["oil_change_km"], 60000)

        # 4. Conversion en DTO canonique SaaS
        dto = OEMScraperOrchestrator.variant_to_canonical_dto(variant)
        self.assertEqual(dto.make, "Scania")
        self.assertEqual(dto.wmi_prefix, "SCA")
        self.assertEqual(dto.oil_capacity_liters, 38.0)
        task_codes = [t.task_code for t in dto.tasks]
        self.assertIn("ENG_OIL_FILTER", task_codes)
        self.assertIn("COOLANT_FLUSH", task_codes)

    def test_universal_crawler_custom_html_tree_parsing(self):
        """Vérifie l'analyseur DOM du crawler sur une page HTML personnalisée d'équipements BTP."""
        from scrapers.universal_oem_crawler import UniversalOEMCrawler, ScrapedModelVariant, HTMLParser

        custom_html = """
        <div class="product-header">
            <h1 class="engine-title">Caterpillar C13 ACERT (12.5L Turbo Diesel)</h1>
        </div>
        <div class="compartment">
            <h3>Engine Oil Carter</h3>
            <p>Capacity: 34.0 liters | Specification: 15W-40 Cat ECF-3 / API CK-4</p>
            <span>Standard interval: 40,000 km</span>
        </div>
        <div class="compartment">
            <h3>Cooling System</h3>
            <p>Capacity: 45.0 litres | Cat ELC Premix</p>
        </div>
        """
        crawler = UniversalOEMCrawler()
        tree = HTMLParser(custom_html)
        variant = ScrapedModelVariant(
            make="Caterpillar",
            model_name="Cat 740B (Tombereau)",
            engine_type="Standard Engine",
            category="CONSTRUCTION_EQUIP",
            target_url="https://crawler-test/caterpillar",
        )
        parsed_variant = crawler.parse_variant_from_html_tree(tree, variant)
        self.assertIn("C13 ACERT", parsed_variant.engine_type)
        self.assertEqual(parsed_variant.capacities.get("engine"), 34.0)
        self.assertEqual(parsed_variant.capacities.get("cooling"), 45.0)
        self.assertEqual(parsed_variant.intervals.get("oil_change_km"), 40000)

    def test_unit_converters_and_severity(self):
        """Vérifie les conversions d'unités physiques et l'application des règles de sévérité DZ."""
        from etl.converters import UnitConverters, AlgeriaSeverityMatrix

        # 1. Conversions métriques
        l100 = UnitConverters.mpg_to_l_100km(25.0)
        self.assertAlmostEqual(l100, 9.41, places=2)

        liters = UnitConverters.gallons_to_liters(100.0)
        self.assertEqual(liters, 378.5)

        kg = UnitConverters.lbs_to_kg(80000.0)
        self.assertAlmostEqual(kg, 36287.4, places=1)

        # 2. Sévérité climat chaud / désertique
        s_km, s_mo, s_hr = AlgeriaSeverityMatrix.compute_severe_intervals(40000, 12, 1000, "HEAVY_TRUCK")
        self.assertEqual(s_km, 24000)
        self.assertEqual(s_mo, 7)
        self.assertEqual(s_hr, 600)

    def test_unified_etl_catalog_pipeline(self):
        """Vérifie le catalogue unifié compilé depuis vehiclesdb, gor3a, ddpc et api-evangelist."""
        from etl import OEMCatalogPipeline

        pipeline = OEMCatalogPipeline()
        self.assertGreaterEqual(len(pipeline.catalog), 20)

        # Test recherche VIN Renault Trucks
        entry_vin = pipeline.find_by_vin_or_wmi("VF611G16000019284")
        self.assertIsNotNone(entry_vin)
        self.assertEqual(entry_vin.brand.name, "Renault Trucks")
        self.assertEqual(entry_vin.variant.gross_vehicle_weight_kg, 44000.0)
        self.assertEqual(entry_vin.variant.fuel_tank_capacity_liters, 650.0)

        # Test recherche par texte Shacman
        entry_shac = pipeline.search_by_text("Shacman", "X3000")
        self.assertIsNotNone(entry_shac)
        self.assertEqual(entry_shac.variant.engine_code, "WEICHAI_WP12_430")
        self.assertEqual(entry_shac.variant.gross_vehicle_weight_kg, 41000.0)
        self.assertGreater(len(entry_shac.tasks), 3)

        # Test résolution complète via CatalogMatcherDZ
        full_specs = CatalogMatcherDZ.resolve_full_specs("Toyota", "Hilux")
        self.assertIsNotNone(full_specs)
        self.assertEqual(full_specs["brand"], "Toyota")
        self.assertEqual(full_specs["ptac_kg"], 3000.0)
        self.assertEqual(full_specs["tank_liters"], 80.0)
        self.assertEqual(full_specs["oil_capacity_liters"], 7.5)

        # Test recherche textuelle spécifique Kangoo 1.5 dCi année 2012 (avec tolérance faute de frappe "ranult")
        entry_kangoo = pipeline.search_by_text("ranult", "kangoo 1.5 dci 2012")
        self.assertIsNotNone(entry_kangoo, "Échec recherche typo ranult kangoo 2012")
        self.assertEqual(entry_kangoo.brand.name, "Renault")
        self.assertIn("Kangoo", entry_kangoo.model.name)
        self.assertEqual(entry_kangoo.variant.oil_capacity_liters, 4.5)
        self.assertEqual(entry_kangoo.variant.fuel_tank_capacity_liters, 60.0)
        self.assertIn(entry_kangoo.variant.gross_vehicle_weight_kg, [1950.0, 1980.0, 2050.0])
        self.assertTrue(entry_kangoo.model.year_start <= 2012 <= entry_kangoo.model.year_end)

        # Test CatalogMatcherDZ pour Kangoo
        make_k, model_k, eng_k = CatalogMatcherDZ.resolve_by_text(
            CatalogSearchQuery(make="ranult", model="kangoo 1.5 dci 2012")
        )
        self.assertEqual(make_k, "Renault")
        self.assertIn("Kangoo", model_k)
        self.assertIn("1.5 dCi", eng_k)


if __name__ == "__main__":
    unittest.main()


