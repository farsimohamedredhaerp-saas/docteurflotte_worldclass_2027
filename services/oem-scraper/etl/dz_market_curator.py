"""Curateur du marché algérien pour l'intégration unifiée des 4 dépôts open-source :
- vehiclesdb/vehiclesdb (Slugs, catégories normalisées, popularité)
- gor3a/vehicle-makes-models (Arborescence marques, modèles, générations, moteurs)
- T33R0/ddpc-vehicle-specs (Spécifications homologation, PTAC, réservoirs, conso)
- api-evangelist/vehicle-databases (Échéanciers RMI, normes et volumes d'huiles)
"""

from typing import Dict, List
from .models import OEMBrandData, OEMModelData, OEMEngineVariantData, UnifiedOEMCatalogEntry
from .schedule_generator import ScheduleGenerator


class DZMarketCurator:
    """Fournit le catalogue enrichi, consolidé et dédupliqué pour l'Algérie."""

    @classmethod
    def get_curated_catalog(cls) -> List[UnifiedOEMCatalogEntry]:
        entries: List[UnifiedOEMCatalogEntry] = []

        # Définition des profils de véhicules clés
        raw_specs = [
            # =========================================================================
            # POIDS LOURDS & TRACTEURS ROUTIERS (HEAVY_TRUCK)
            # =========================================================================
            {
                "brand": OEMBrandData("renault-trucks", "Renault Trucks", "FR", True),
                "model": OEMModelData("renault-trucks", "t-k-series", "T 480 / K 480", "HEAVY_TRUCK", "TRACTOR_HEAD", 2013, 2026, 1),
                "variant": OEMEngineVariantData(
                    brand_slug="renault-trucks", model_slug="t-k-series",
                    engine_code="DTI_13_480", engine_name="DTI 13 (12.8L)",
                    wmi_pattern="VF6", displacement_cc=12777, cylinders=6,
                    power_kw=353.0, power_hp=480.0, torque_nm=2400.0, fuel_type="DIESEL", euro_standard="EURO_5",
                    fuel_tank_capacity_liters=650.0, gross_vehicle_weight_kg=44000.0, curb_weight_kg=8800.0, payload_capacity_kg=35200.0,
                    ref_consumption_mixed_l_100km=33.5, ref_consumption_urban_l_100km=38.0, ref_consumption_highway_l_100km=31.0,
                    ref_idle_consumption_l_hour=14.5, oil_capacity_liters=36.0, oil_norm_spec="10W-40 Renault Trucks RLD-3 / Volvo VDS-4.5",
                    coolant_capacity_liters=44.0, transmission_oil_capacity_liters=13.5
                )
            },
            {
                "brand": OEMBrandData("renault-trucks", "Renault Trucks", "FR", True),
                "model": OEMModelData("renault-trucks", "kerax", "Kerax 440 / K 440", "HEAVY_TRUCK", "TIPPER", 2006, 2024, 2),
                "variant": OEMEngineVariantData(
                    brand_slug="renault-trucks", model_slug="kerax",
                    engine_code="DXI_11_440", engine_name="DXi 11 Euro 3 (10.8L)",
                    wmi_pattern="VF6", displacement_cc=10837, cylinders=6,
                    power_kw=324.0, power_hp=440.0, torque_nm=2000.0, fuel_type="DIESEL", euro_standard="EURO_3",
                    fuel_tank_capacity_liters=510.0, gross_vehicle_weight_kg=40000.0, curb_weight_kg=9200.0, payload_capacity_kg=30800.0,
                    ref_consumption_mixed_l_100km=36.0, ref_consumption_urban_l_100km=42.0, ref_consumption_highway_l_100km=34.0,
                    ref_idle_consumption_l_hour=15.0, oil_capacity_liters=36.0, oil_norm_spec="15W-40 API CI-4 / RLD-2",
                    coolant_capacity_liters=40.0, transmission_oil_capacity_liters=12.0
                )
            },
            {
                "brand": OEMBrandData("shacman", "Shacman", "CN", True),
                "model": OEMModelData("shacman", "x3000-f3000", "X3000 / F3000 6x4", "HEAVY_TRUCK", "TIPPER", 2012, 2026, 3),
                "variant": OEMEngineVariantData(
                    brand_slug="shacman", model_slug="x3000-f3000",
                    engine_code="WEICHAI_WP12_430", engine_name="Weichai WP12.430E201",
                    wmi_pattern="LZG", displacement_cc=11596, cylinders=6,
                    power_kw=316.0, power_hp=430.0, torque_nm=2060.0, fuel_type="DIESEL", euro_standard="EURO_3",
                    fuel_tank_capacity_liters=400.0, gross_vehicle_weight_kg=41000.0, curb_weight_kg=12500.0, payload_capacity_kg=28500.0,
                    ref_consumption_mixed_l_100km=39.5, ref_consumption_urban_l_100km=45.0, ref_consumption_highway_l_100km=36.0,
                    ref_idle_consumption_l_hour=16.5, oil_capacity_liters=28.0, oil_norm_spec="15W-40 API CI-4 / Weichai Special HD",
                    coolant_capacity_liters=45.0, transmission_oil_capacity_liters=14.0
                )
            },
            {
                "brand": OEMBrandData("snvi", "SNVI", "DZ", True),
                "model": OEMModelData("snvi", "k66-k120", "K66 / K120", "HEAVY_TRUCK", "RIGID_TRUCK", 1985, 2026, 4),
                "variant": OEMEngineVariantData(
                    brand_slug="snvi", model_slug="k66-k120",
                    engine_code="DEUTZ_F6L912", engine_name="Deutz F6L912 (Air-Cooled)",
                    wmi_pattern="VFA", displacement_cc=5655, cylinders=6,
                    power_kw=88.0, power_hp=120.0, torque_nm=360.0, fuel_type="DIESEL", euro_standard="EURO_2",
                    fuel_tank_capacity_liters=150.0, gross_vehicle_weight_kg=12000.0, curb_weight_kg=4800.0, payload_capacity_kg=7200.0,
                    ref_consumption_mixed_l_100km=22.0, ref_consumption_urban_l_100km=25.0, ref_consumption_highway_l_100km=19.5,
                    ref_idle_consumption_l_hour=8.5, oil_capacity_liters=14.5, oil_norm_spec="15W-40 API CG-4 / Deutz DQC II (Air-Cooled)",
                    coolant_capacity_liters=0.0, transmission_oil_capacity_liters=6.5
                )
            },
            {
                "brand": OEMBrandData("snvi", "SNVI", "DZ", True),
                "model": OEMModelData("snvi", "tc-100-v8", "TC 100 V8", "HEAVY_TRUCK", "TRACTOR_HEAD", 1988, 2024, 5),
                "variant": OEMEngineVariantData(
                    brand_slug="snvi", model_slug="tc-100-v8",
                    engine_code="DEUTZ_F8L413F", engine_name="Deutz F8L413F V8 (Air-Cooled 11.3L)",
                    wmi_pattern="VFA", displacement_cc=11300, cylinders=8,
                    power_kw=188.0, power_hp=256.0, torque_nm=830.0, fuel_type="DIESEL", euro_standard="EURO_2",
                    fuel_tank_capacity_liters=350.0, gross_vehicle_weight_kg=38000.0, curb_weight_kg=7200.0, payload_capacity_kg=30800.0,
                    ref_consumption_mixed_l_100km=35.0, ref_consumption_urban_l_100km=40.0, ref_consumption_highway_l_100km=32.0,
                    ref_idle_consumption_l_hour=14.0, oil_capacity_liters=24.0, oil_norm_spec="15W-40 API CH-4",
                    coolant_capacity_liters=0.0, transmission_oil_capacity_liters=11.0
                )
            },
            {
                "brand": OEMBrandData("man", "MAN", "DE", True),
                "model": OEMModelData("man", "tgs", "TGS 33.440 / 40.440", "HEAVY_TRUCK", "TRACTOR_HEAD", 2008, 2026, 6),
                "variant": OEMEngineVariantData(
                    brand_slug="man", model_slug="tgs",
                    engine_code="MAN_D2066_LF", engine_name="D2066 LF (10.5L Euro 3/4)",
                    wmi_pattern="WMA", displacement_cc=10518, cylinders=6,
                    power_kw=324.0, power_hp=440.0, torque_nm=2100.0, fuel_type="DIESEL", euro_standard="EURO_4",
                    fuel_tank_capacity_liters=590.0, gross_vehicle_weight_kg=40000.0, curb_weight_kg=8750.0, payload_capacity_kg=31250.0,
                    ref_consumption_mixed_l_100km=36.0, ref_consumption_urban_l_100km=41.0, ref_consumption_highway_l_100km=33.5,
                    ref_idle_consumption_l_hour=15.5, oil_capacity_liters=40.0, oil_norm_spec="10W-40 MAN M 3277 / M 3477",
                    coolant_capacity_liters=42.0, transmission_oil_capacity_liters=13.0
                )
            },
            {
                "brand": OEMBrandData("mercedes-benz", "Mercedes-Benz", "DE", True),
                "model": OEMModelData("mercedes-benz", "actros", "Actros 2041 / 3344", "HEAVY_TRUCK", "TRACTOR_HEAD", 2003, 2026, 7),
                "variant": OEMEngineVariantData(
                    brand_slug="mercedes-benz", model_slug="actros",
                    engine_code="MB_OM_501_LA", engine_name="OM 501 LA V6 (11.9L)",
                    wmi_pattern="WDB", displacement_cc=11946, cylinders=6,
                    power_kw=320.0, power_hp=435.0, torque_nm=2100.0, fuel_type="DIESEL", euro_standard="EURO_4",
                    fuel_tank_capacity_liters=650.0, gross_vehicle_weight_kg=44000.0, curb_weight_kg=8600.0, payload_capacity_kg=35400.0,
                    ref_consumption_mixed_l_100km=34.5, ref_consumption_urban_l_100km=39.0, ref_consumption_highway_l_100km=32.0,
                    ref_idle_consumption_l_hour=14.8, oil_capacity_liters=38.0, oil_norm_spec="10W-40 MB-Approval 228.5 / 228.51",
                    coolant_capacity_liters=43.0, transmission_oil_capacity_liters=12.5
                )
            },
            {
                "brand": OEMBrandData("scania", "Scania", "SE", True),
                "model": OEMModelData("scania", "r-g-series", "R 450 / G 410 Streamline", "HEAVY_TRUCK", "TRACTOR_HEAD", 2013, 2026, 8),
                "variant": OEMEngineVariantData(
                    brand_slug="scania", model_slug="r-g-series",
                    engine_code="SCANIA_DC13_148", engine_name="DC13 148 (12.7L Euro 5/6)",
                    wmi_pattern="YS2", displacement_cc=12740, cylinders=6,
                    power_kw=331.0, power_hp=450.0, torque_nm=2350.0, fuel_type="DIESEL", euro_standard="EURO_5",
                    fuel_tank_capacity_liters=700.0, gross_vehicle_weight_kg=44000.0, curb_weight_kg=8400.0, payload_capacity_kg=35600.0,
                    ref_consumption_mixed_l_100km=31.5, ref_consumption_urban_l_100km=36.0, ref_consumption_highway_l_100km=29.0,
                    ref_idle_consumption_l_hour=13.5, oil_capacity_liters=38.0, oil_norm_spec="10W-40 Scania LDF-3 / LDF-4",
                    coolant_capacity_liters=45.0, transmission_oil_capacity_liters=14.0
                )
            },
            {
                "brand": OEMBrandData("volvo-trucks", "Volvo Trucks", "SE", True),
                "model": OEMModelData("volvo-trucks", "fh-fm", "FH 460 / FM 400", "HEAVY_TRUCK", "TRACTOR_HEAD", 2010, 2026, 9),
                "variant": OEMEngineVariantData(
                    brand_slug="volvo-trucks", model_slug="fh-fm",
                    engine_code="VOLVO_D13C_460", engine_name="D13C 460 (12.8L)",
                    wmi_pattern="YV2", displacement_cc=12777, cylinders=6,
                    power_kw=338.0, power_hp=460.0, torque_nm=2300.0, fuel_type="DIESEL", euro_standard="EURO_5",
                    fuel_tank_capacity_liters=690.0, gross_vehicle_weight_kg=44000.0, curb_weight_kg=8500.0, payload_capacity_kg=35500.0,
                    ref_consumption_mixed_l_100km=32.0, ref_consumption_urban_l_100km=37.0, ref_consumption_highway_l_100km=29.5,
                    ref_idle_consumption_l_hour=13.8, oil_capacity_liters=37.0, oil_norm_spec="10W-40 Volvo VDS-4 / VDS-4.5",
                    coolant_capacity_liters=44.0, transmission_oil_capacity_liters=13.5
                )
            },
            {
                "brand": OEMBrandData("sinotruk", "Sinotruk Howo", "CN", True),
                "model": OEMModelData("sinotruk", "howo-371", "HOWO 371 / A7", "HEAVY_TRUCK", "TIPPER", 2010, 2026, 10),
                "variant": OEMEngineVariantData(
                    brand_slug="sinotruk", model_slug="howo-371",
                    engine_code="SINOTRUK_WD615_47", engine_name="WD615.47 (9.7L Euro 2)",
                    wmi_pattern="LZZ", displacement_cc=9726, cylinders=6,
                    power_kw=273.0, power_hp=371.0, torque_nm=1500.0, fuel_type="DIESEL", euro_standard="EURO_2",
                    fuel_tank_capacity_liters=380.0, gross_vehicle_weight_kg=38000.0, curb_weight_kg=12200.0, payload_capacity_kg=25800.0,
                    ref_consumption_mixed_l_100km=38.5, ref_consumption_urban_l_100km=43.0, ref_consumption_highway_l_100km=35.0,
                    ref_idle_consumption_l_hour=16.0, oil_capacity_liters=26.0, oil_norm_spec="15W-40 API CF-4 / CH-4",
                    coolant_capacity_liters=40.0, transmission_oil_capacity_liters=12.0
                )
            },
            {
                "brand": OEMBrandData("isuzu", "Isuzu", "JP", True),
                "model": OEMModelData("isuzu", "npr-nqr", "NPR 71 / NQR 75", "HEAVY_TRUCK", "RIGID_TRUCK", 2007, 2026, 11),
                "variant": OEMEngineVariantData(
                    brand_slug="isuzu", model_slug="npr-nqr",
                    engine_code="ISUZU_4HK1_TCN", engine_name="4HK1-TCN (5.2L Turbo)",
                    wmi_pattern="JAA", displacement_cc=5193, cylinders=4,
                    power_kw=110.0, power_hp=150.0, torque_nm=404.0, fuel_type="DIESEL", euro_standard="EURO_3",
                    fuel_tank_capacity_liters=140.0, gross_vehicle_weight_kg=7500.0, curb_weight_kg=2850.0, payload_capacity_kg=4650.0,
                    ref_consumption_mixed_l_100km=17.5, ref_consumption_urban_l_100km=20.0, ref_consumption_highway_l_100km=15.5,
                    ref_idle_consumption_l_hour=6.2, oil_capacity_liters=13.0, oil_norm_spec="10W-40 ACEA E7 / API CI-4",
                    coolant_capacity_liters=18.0, transmission_oil_capacity_liters=5.5
                )
            },
            {
                "brand": OEMBrandData("hyundai", "Hyundai", "KR", True),
                "model": OEMModelData("hyundai", "hd65-hd72", "HD65 / HD72", "HEAVY_TRUCK", "RIGID_TRUCK", 2005, 2026, 12),
                "variant": OEMEngineVariantData(
                    brand_slug="hyundai", model_slug="hd65-hd72",
                    engine_code="HYUNDAI_D4DB", engine_name="D4DB (3.9L Turbo Intercooler)",
                    wmi_pattern="KMF", displacement_cc=3907, cylinders=4,
                    power_kw=96.0, power_hp=130.0, torque_nm=372.0, fuel_type="DIESEL", euro_standard="EURO_2",
                    fuel_tank_capacity_liters=100.0, gross_vehicle_weight_kg=6500.0, curb_weight_kg=2550.0, payload_capacity_kg=3950.0,
                    ref_consumption_mixed_l_100km=16.8, ref_consumption_urban_l_100km=19.5, ref_consumption_highway_l_100km=14.5,
                    ref_idle_consumption_l_hour=5.8, oil_capacity_liters=8.5, oil_norm_spec="15W-40 API CH-4 / CI-4",
                    coolant_capacity_liters=16.0, transmission_oil_capacity_liters=4.5
                )
            },

            # =========================================================================
            # UTILITAIRES LÉGERS (LCV / VANS & PICK-UPS)
            # =========================================================================
            {
                "brand": OEMBrandData("renault", "Renault", "FR", True),
                "model": OEMModelData("renault", "kangoo-ii", "Kangoo II / Express", "LCV", "VAN", 2008, 2021, 13),
                "variant": OEMEngineVariantData(
                    brand_slug="renault", model_slug="kangoo-ii",
                    engine_code="RENAULT_K9K_808", engine_name="1.5 dCi 85 / 90 (K9K)",
                    wmi_pattern="VF1", displacement_cc=1461, cylinders=4,
                    power_kw=66.0, power_hp=90.0, torque_nm=200.0, fuel_type="DIESEL", euro_standard="EURO_5",
                    fuel_tank_capacity_liters=60.0, gross_vehicle_weight_kg=1980.0, curb_weight_kg=1250.0, payload_capacity_kg=730.0,
                    ref_consumption_mixed_l_100km=4.7, ref_consumption_urban_l_100km=5.4, ref_consumption_highway_l_100km=4.3,
                    ref_idle_consumption_l_hour=1.1, oil_capacity_liters=4.5, oil_norm_spec="5W-30 Renault RN0720 / ACEA C4 (ou 5W-40 RN0710)",
                    coolant_capacity_liters=6.0, transmission_oil_capacity_liters=2.5
                )
            },
            {
                "brand": OEMBrandData("renault", "Renault", "FR", True),
                "model": OEMModelData("renault", "kangoo-ii-75", "Kangoo II Express 1.5 dCi 75", "LCV", "VAN", 2008, 2021, 13),
                "variant": OEMEngineVariantData(
                    brand_slug="renault", model_slug="kangoo-ii-75",
                    engine_code="RENAULT_K9K_802", engine_name="1.5 dCi 75 (K9K)",
                    wmi_pattern="VF1", displacement_cc=1461, cylinders=4,
                    power_kw=55.0, power_hp=75.0, torque_nm=180.0, fuel_type="DIESEL", euro_standard="EURO_5",
                    fuel_tank_capacity_liters=60.0, gross_vehicle_weight_kg=1950.0, curb_weight_kg=1230.0, payload_capacity_kg=720.0,
                    ref_consumption_mixed_l_100km=4.9, ref_consumption_urban_l_100km=5.6, ref_consumption_highway_l_100km=4.5,
                    ref_idle_consumption_l_hour=1.1, oil_capacity_liters=4.5, oil_norm_spec="5W-30 Renault RN0720 / ACEA C4",
                    coolant_capacity_liters=6.0, transmission_oil_capacity_liters=2.5
                )
            },
            {
                "brand": OEMBrandData("renault", "Renault", "FR", True),
                "model": OEMModelData("renault", "kangoo-ii-110", "Kangoo II Express 1.5 dCi 110", "LCV", "VAN", 2008, 2021, 13),
                "variant": OEMEngineVariantData(
                    brand_slug="renault", model_slug="kangoo-ii-110",
                    engine_code="RENAULT_K9K_804", engine_name="1.5 dCi 110 (K9K)",
                    wmi_pattern="VF1", displacement_cc=1461, cylinders=4,
                    power_kw=81.0, power_hp=110.0, torque_nm=240.0, fuel_type="DIESEL", euro_standard="EURO_5",
                    fuel_tank_capacity_liters=60.0, gross_vehicle_weight_kg=2050.0, curb_weight_kg=1280.0, payload_capacity_kg=770.0,
                    ref_consumption_mixed_l_100km=4.6, ref_consumption_urban_l_100km=5.2, ref_consumption_highway_l_100km=4.2,
                    ref_idle_consumption_l_hour=1.2, oil_capacity_liters=4.5, oil_norm_spec="5W-30 Renault RN0720 / ACEA C4",
                    coolant_capacity_liters=6.0, transmission_oil_capacity_liters=2.5
                )
            },
            {
                "brand": OEMBrandData("renault", "Renault", "FR", True),
                "model": OEMModelData("renault", "master-iii", "Master III", "LCV", "VAN", 2010, 2024, 14),
                "variant": OEMEngineVariantData(
                    brand_slug="renault", model_slug="master-iii",
                    engine_code="RENAULT_M9T_704", engine_name="2.3 dCi M9T 135/150",
                    wmi_pattern="VF1", displacement_cc=2299, cylinders=4,
                    power_kw=110.0, power_hp=150.0, torque_nm=385.0, fuel_type="DIESEL", euro_standard="EURO_5",
                    fuel_tank_capacity_liters=80.0, gross_vehicle_weight_kg=3500.0, curb_weight_kg=1950.0, payload_capacity_kg=1550.0,
                    ref_consumption_mixed_l_100km=9.8, ref_consumption_urban_l_100km=11.5, ref_consumption_highway_l_100km=8.5,
                    ref_idle_consumption_l_hour=3.2, oil_capacity_liters=8.9, oil_norm_spec="5W-30 Renault RN0720 / ACEA C4",
                    coolant_capacity_liters=11.0, transmission_oil_capacity_liters=3.2
                )
            },
            {
                "brand": OEMBrandData("renault", "Renault", "FR", True),
                "model": OEMModelData("renault", "trafic-iii", "Trafic II / III", "LCV", "VAN", 2006, 2024, 15),
                "variant": OEMEngineVariantData(
                    brand_slug="renault", model_slug="trafic-iii",
                    engine_code="RENAULT_R9M_450", engine_name="1.6 dCi 125 / 2.0 dCi",
                    wmi_pattern="VF1", displacement_cc=1598, cylinders=4,
                    power_kw=92.0, power_hp=125.0, torque_nm=320.0, fuel_type="DIESEL", euro_standard="EURO_5",
                    fuel_tank_capacity_liters=80.0, gross_vehicle_weight_kg=2900.0, curb_weight_kg=1750.0, payload_capacity_kg=1150.0,
                    ref_consumption_mixed_l_100km=6.5, ref_consumption_urban_l_100km=7.8, ref_consumption_highway_l_100km=5.8,
                    ref_idle_consumption_l_hour=1.8, oil_capacity_liters=6.0, oil_norm_spec="5W-30 Renault RN0720 / ACEA C4",
                    coolant_capacity_liters=8.5, transmission_oil_capacity_liters=2.7
                )
            },
            {
                "brand": OEMBrandData("renault", "Renault", "FR", True),
                "model": OEMModelData("renault", "clio-iv", "Clio IV / Clio Campus", "PASSENGER_CAR", "SEDAN", 2006, 2020, 16),
                "variant": OEMEngineVariantData(
                    brand_slug="renault", model_slug="clio-iv",
                    engine_code="RENAULT_K9K_608", engine_name="1.5 dCi 85 / 90 (K9K)",
                    wmi_pattern="VF1", displacement_cc=1461, cylinders=4,
                    power_kw=66.0, power_hp=90.0, torque_nm=220.0, fuel_type="DIESEL", euro_standard="EURO_5",
                    fuel_tank_capacity_liters=45.0, gross_vehicle_weight_kg=1650.0, curb_weight_kg=1100.0, payload_capacity_kg=550.0,
                    ref_consumption_mixed_l_100km=3.8, ref_consumption_urban_l_100km=4.4, ref_consumption_highway_l_100km=3.4,
                    ref_idle_consumption_l_hour=0.9, oil_capacity_liters=4.5, oil_norm_spec="5W-30 RN0720 / ACEA C4",
                    coolant_capacity_liters=5.5, transmission_oil_capacity_liters=2.0
                )
            },
            {
                "brand": OEMBrandData("toyota", "Toyota", "JP", True),
                "model": OEMModelData("toyota", "hilux", "Hilux 4x4 Double Cabine", "LCV", "PICKUP", 2015, 2026, 17),
                "variant": OEMEngineVariantData(
                    brand_slug="toyota", model_slug="hilux",
                    engine_code="TOYOTA_2GD_FTV", engine_name="2.4 D-4D (2GD-FTV)",
                    wmi_pattern="AHT", displacement_cc=2393, cylinders=4,
                    power_kw=110.0, power_hp=150.0, torque_nm=400.0, fuel_type="DIESEL", euro_standard="EURO_5",
                    fuel_tank_capacity_liters=80.0, gross_vehicle_weight_kg=3000.0, curb_weight_kg=1975.0, payload_capacity_kg=1025.0,
                    ref_consumption_mixed_l_100km=8.8, ref_consumption_urban_l_100km=10.2, ref_consumption_highway_l_100km=7.8,
                    ref_idle_consumption_l_hour=2.8, oil_capacity_liters=7.5, oil_norm_spec="5W-30 ACEA C2 / Toyota Genuine DL-1",
                    coolant_capacity_liters=9.5, transmission_oil_capacity_liters=3.0
                )
            },
            {
                "brand": OEMBrandData("toyota", "Toyota", "JP", True),
                "model": OEMModelData("toyota", "land-cruiser-hzj79", "Land Cruiser HZJ79 Pick-up / HZJ76", "LCV", "PICKUP", 1999, 2026, 18),
                "variant": OEMEngineVariantData(
                    brand_slug="toyota", model_slug="land-cruiser-hzj79",
                    engine_code="TOYOTA_1HZ", engine_name="1HZ 4.2L 6-Cylindres Atmosphérique",
                    wmi_pattern="JTE", displacement_cc=4164, cylinders=6,
                    power_kw=96.0, power_hp=130.0, torque_nm=285.0, fuel_type="DIESEL", euro_standard="EURO_2",
                    fuel_tank_capacity_liters=130.0, gross_vehicle_weight_kg=3200.0, curb_weight_kg=2150.0, payload_capacity_kg=1050.0,
                    ref_consumption_mixed_l_100km=12.5, ref_consumption_urban_l_100km=15.0, ref_consumption_highway_l_100km=11.0,
                    ref_idle_consumption_l_hour=3.8, oil_capacity_liters=9.3, oil_norm_spec="15W-40 API CF / CI-4",
                    coolant_capacity_liters=12.0, transmission_oil_capacity_liters=4.2
                )
            },
            {
                "brand": OEMBrandData("peugeot", "Peugeot", "FR", True),
                "model": OEMModelData("peugeot", "partner", "Partner / Partner Tepee", "LCV", "VAN", 2008, 2024, 19),
                "variant": OEMEngineVariantData(
                    brand_slug="peugeot", model_slug="partner",
                    engine_code="PSA_DV6DTED", engine_name="1.6 HDi 92 (DV6DTED)",
                    wmi_pattern="VF3", displacement_cc=1560, cylinders=4,
                    power_kw=68.0, power_hp=92.0, torque_nm=230.0, fuel_type="DIESEL", euro_standard="EURO_5",
                    fuel_tank_capacity_liters=60.0, gross_vehicle_weight_kg=1950.0, curb_weight_kg=1320.0, payload_capacity_kg=630.0,
                    ref_consumption_mixed_l_100km=5.6, ref_consumption_urban_l_100km=6.8, ref_consumption_highway_l_100km=4.9,
                    ref_idle_consumption_l_hour=1.4, oil_capacity_liters=3.75, oil_norm_spec="5W-30 PSA B71 2290 / ACEA C2",
                    coolant_capacity_liters=6.5, transmission_oil_capacity_liters=1.9
                )
            },
            {
                "brand": OEMBrandData("peugeot", "Peugeot", "FR", True),
                "model": OEMModelData("peugeot", "301", "301 / 208", "PASSENGER_CAR", "SEDAN", 2012, 2024, 20),
                "variant": OEMEngineVariantData(
                    brand_slug="peugeot", model_slug="301",
                    engine_code="PSA_DV6_92", engine_name="1.6 HDi 92 (DV6)",
                    wmi_pattern="VF3", displacement_cc=1560, cylinders=4,
                    power_kw=68.0, power_hp=92.0, torque_nm=230.0, fuel_type="DIESEL", euro_standard="EURO_5",
                    fuel_tank_capacity_liters=50.0, gross_vehicle_weight_kg=1590.0, curb_weight_kg=1090.0, payload_capacity_kg=500.0,
                    ref_consumption_mixed_l_100km=4.1, ref_consumption_urban_l_100km=4.9, ref_consumption_highway_l_100km=3.6,
                    ref_idle_consumption_l_hour=1.0, oil_capacity_liters=3.75, oil_norm_spec="5W-30 PSA B71 2290 / ACEA C2",
                    coolant_capacity_liters=5.5, transmission_oil_capacity_liters=1.9
                )
            },
            {
                "brand": OEMBrandData("citroen", "Citroën", "FR", True),
                "model": OEMModelData("citroen", "berlingo-ii", "Berlingo II / Multispace", "LCV", "VAN", 2008, 2020, 21),
                "variant": OEMEngineVariantData(
                    brand_slug="citroen", model_slug="berlingo-ii",
                    engine_code="PSA_DV6D_90", engine_name="1.6 HDi 90 / 92",
                    wmi_pattern="VF7", displacement_cc=1560, cylinders=4,
                    power_kw=68.0, power_hp=92.0, torque_nm=230.0, fuel_type="DIESEL", euro_standard="EURO_5",
                    fuel_tank_capacity_liters=60.0, gross_vehicle_weight_kg=1960.0, curb_weight_kg=1330.0, payload_capacity_kg=630.0,
                    ref_consumption_mixed_l_100km=5.6, ref_consumption_urban_l_100km=6.8, ref_consumption_highway_l_100km=4.9,
                    ref_idle_consumption_l_hour=1.4, oil_capacity_liters=3.75, oil_norm_spec="5W-30 PSA B71 2290 / Total Quartz Ineo ECS",
                    coolant_capacity_liters=6.5, transmission_oil_capacity_liters=1.9
                )
            },
            {
                "brand": OEMBrandData("volkswagen", "Volkswagen", "DE", True),
                "model": OEMModelData("volkswagen", "caddy-iii-iv", "Caddy III / IV Maxi", "LCV", "VAN", 2004, 2020, 22),
                "variant": OEMEngineVariantData(
                    brand_slug="volkswagen", model_slug="caddy-iii-iv",
                    engine_code="VW_CAYD_16TDI", engine_name="1.6 TDI 102 (CAYD)",
                    wmi_pattern="WV1", displacement_cc=1598, cylinders=4,
                    power_kw=75.0, power_hp=102.0, torque_nm=250.0, fuel_type="DIESEL", euro_standard="EURO_5",
                    fuel_tank_capacity_liters=60.0, gross_vehicle_weight_kg=2180.0, curb_weight_kg=1420.0, payload_capacity_kg=760.0,
                    ref_consumption_mixed_l_100km=5.2, ref_consumption_urban_l_100km=6.1, ref_consumption_highway_l_100km=4.6,
                    ref_idle_consumption_l_hour=1.2, oil_capacity_liters=4.3, oil_norm_spec="5W-30 VW 504.00 / 507.00 LongLife III",
                    coolant_capacity_liters=7.0, transmission_oil_capacity_liters=2.0
                )
            },
            {
                "brand": OEMBrandData("volkswagen", "Volkswagen", "DE", True),
                "model": OEMModelData("volkswagen", "golf-vii", "Golf VII / Golf VI", "PASSENGER_CAR", "SEDAN", 2008, 2020, 23),
                "variant": OEMEngineVariantData(
                    brand_slug="volkswagen", model_slug="golf-vii",
                    engine_code="VW_CRBC_20TDI", engine_name="2.0 TDI 110 / 150 (CRBC)",
                    wmi_pattern="WVW", displacement_cc=1968, cylinders=4,
                    power_kw=110.0, power_hp=150.0, torque_nm=340.0, fuel_type="DIESEL", euro_standard="EURO_6",
                    fuel_tank_capacity_liters=50.0, gross_vehicle_weight_kg=1850.0, curb_weight_kg=1350.0, payload_capacity_kg=500.0,
                    ref_consumption_mixed_l_100km=4.4, ref_consumption_urban_l_100km=5.2, ref_consumption_highway_l_100km=3.9,
                    ref_idle_consumption_l_hour=1.1, oil_capacity_liters=4.7, oil_norm_spec="5W-30 VW 507.00 / ACEA C3",
                    coolant_capacity_liters=6.5, transmission_oil_capacity_liters=2.2
                )
            },
            {
                "brand": OEMBrandData("hyundai", "Hyundai", "KR", True),
                "model": OEMModelData("hyundai", "accent", "Accent / i20", "PASSENGER_CAR", "SEDAN", 2006, 2022, 24),
                "variant": OEMEngineVariantData(
                    brand_slug="hyundai", model_slug="accent",
                    engine_code="HYUNDAI_D4FB_16CRDI", engine_name="1.6 CRDi 128 (D4FB)",
                    wmi_pattern="KMH", displacement_cc=1582, cylinders=4,
                    power_kw=94.0, power_hp=128.0, torque_nm=260.0, fuel_type="DIESEL", euro_standard="EURO_5",
                    fuel_tank_capacity_liters=43.0, gross_vehicle_weight_kg=1610.0, curb_weight_kg=1180.0, payload_capacity_kg=430.0,
                    ref_consumption_mixed_l_100km=4.6, ref_consumption_urban_l_100km=5.6, ref_consumption_highway_l_100km=4.0,
                    ref_idle_consumption_l_hour=1.1, oil_capacity_liters=5.3, oil_norm_spec="5W-30 ACEA C3 / API CH-4",
                    coolant_capacity_liters=6.0, transmission_oil_capacity_liters=1.9
                )
            },
            {
                "brand": OEMBrandData("hyundai", "Hyundai", "KR", True),
                "model": OEMModelData("hyundai", "h100-bongo", "H100 / Porter II", "LCV", "PICKUP", 2004, 2024, 25),
                "variant": OEMEngineVariantData(
                    brand_slug="hyundai", model_slug="h100-bongo",
                    engine_code="HYUNDAI_D4CB_25CRDI", engine_name="2.5 CRDi 130 (D4CB)",
                    wmi_pattern="KMF", displacement_cc=2497, cylinders=4,
                    power_kw=96.0, power_hp=130.0, torque_nm=255.0, fuel_type="DIESEL", euro_standard="EURO_4",
                    fuel_tank_capacity_liters=65.0, gross_vehicle_weight_kg=3050.0, curb_weight_kg=1650.0, payload_capacity_kg=1400.0,
                    ref_consumption_mixed_l_100km=8.5, ref_consumption_urban_l_100km=10.2, ref_consumption_highway_l_100km=7.5,
                    ref_idle_consumption_l_hour=2.2, oil_capacity_liters=7.4, oil_norm_spec="10W-40 / 15W-40 API CH-4 / CI-4",
                    coolant_capacity_liters=9.0, transmission_oil_capacity_liters=2.5
                )
            },
            {
                "brand": OEMBrandData("kia", "Kia", "KR", True),
                "model": OEMModelData("kia", "k2700-k2500", "K2700 / K2500 Bongo", "LCV", "PICKUP", 2004, 2024, 26),
                "variant": OEMEngineVariantData(
                    brand_slug="kia", model_slug="k2700-k2500",
                    engine_code="KIA_J2_27D", engine_name="2.7 D J2 Atmosphérique",
                    wmi_pattern="KNE", displacement_cc=2665, cylinders=4,
                    power_kw=61.0, power_hp=83.0, torque_nm=175.0, fuel_type="DIESEL", euro_standard="EURO_2",
                    fuel_tank_capacity_liters=60.0, gross_vehicle_weight_kg=2980.0, curb_weight_kg=1580.0, payload_capacity_kg=1400.0,
                    ref_consumption_mixed_l_100km=9.2, ref_consumption_urban_l_100km=11.0, ref_consumption_highway_l_100km=8.2,
                    ref_idle_consumption_l_hour=2.4, oil_capacity_liters=6.5, oil_norm_spec="15W-40 API CF-4 / CI-4",
                    coolant_capacity_liters=8.5, transmission_oil_capacity_liters=2.3
                )
            },
            {
                "brand": OEMBrandData("kia", "Kia", "KR", True),
                "model": OEMModelData("kia", "picanto", "Picanto / Rio", "PASSENGER_CAR", "SEDAN", 2011, 2024, 27),
                "variant": OEMEngineVariantData(
                    brand_slug="kia", model_slug="picanto",
                    engine_code="KIA_G4LA_12", engine_name="1.2 MPI 85 ch (G4LA)",
                    wmi_pattern="KN3", displacement_cc=1248, cylinders=4,
                    power_kw=63.0, power_hp=85.0, torque_nm=120.0, fuel_type="PETROL", euro_standard="EURO_5",
                    fuel_tank_capacity_liters=35.0, gross_vehicle_weight_kg=1370.0, curb_weight_kg=960.0, payload_capacity_kg=410.0,
                    ref_consumption_mixed_l_100km=4.8, ref_consumption_urban_l_100km=5.9, ref_consumption_highway_l_100km=4.1,
                    ref_idle_consumption_l_hour=0.8, oil_capacity_liters=3.5, oil_norm_spec="5W-30 API SN / ACEA A5",
                    coolant_capacity_liters=4.5, transmission_oil_capacity_liters=1.8
                )
            },
            {
                "brand": OEMBrandData("fiat", "Fiat", "IT", True),
                "model": OEMModelData("fiat", "ducato", "Ducato / Boxer", "LCV", "VAN", 2014, 2026, 28),
                "variant": OEMEngineVariantData(
                    brand_slug="fiat", model_slug="ducato",
                    engine_code="FIAT_22_MULTIJET", engine_name="2.2 MultiJet3 140",
                    wmi_pattern="ZFA", displacement_cc=2184, cylinders=4,
                    power_kw=103.0, power_hp=140.0, torque_nm=350.0, fuel_type="DIESEL", euro_standard="EURO_6",
                    fuel_tank_capacity_liters=90.0, gross_vehicle_weight_kg=3500.0, curb_weight_kg=1900.0, payload_capacity_kg=1600.0,
                    ref_consumption_mixed_l_100km=8.9, ref_consumption_urban_l_100km=10.5, ref_consumption_highway_l_100km=7.9,
                    ref_idle_consumption_l_hour=2.6, oil_capacity_liters=6.5, oil_norm_spec="0W-30 / 5W-30 Fiat 9.55535-DS1",
                    coolant_capacity_liters=10.0, transmission_oil_capacity_liters=2.8
                )
            },
            {
                "brand": OEMBrandData("dacia", "Dacia", "RO", True),
                "model": OEMModelData("dacia", "dokker", "Dokker / Lodgy", "LCV", "VAN", 2012, 2021, 29),
                "variant": OEMEngineVariantData(
                    brand_slug="dacia", model_slug="dokker",
                    engine_code="RENAULT_K9K_612", engine_name="1.5 dCi 85 / 90 (K9K)",
                    wmi_pattern="UU1", displacement_cc=1461, cylinders=4,
                    power_kw=66.0, power_hp=90.0, torque_nm=200.0, fuel_type="DIESEL", euro_standard="EURO_5",
                    fuel_tank_capacity_liters=50.0, gross_vehicle_weight_kg=1850.0, curb_weight_kg=1230.0, payload_capacity_kg=620.0,
                    ref_consumption_mixed_l_100km=4.9, ref_consumption_urban_l_100km=5.7, ref_consumption_highway_l_100km=4.4,
                    ref_idle_consumption_l_hour=1.1, oil_capacity_liters=4.5, oil_norm_spec="5W-30 RN0720 / ACEA C4",
                    coolant_capacity_liters=6.0, transmission_oil_capacity_liters=2.0
                )
            },
            {
                "brand": OEMBrandData("dacia", "Dacia", "RO", True),
                "model": OEMModelData("dacia", "duster-logan", "Duster / Logan / Sandero", "PASSENGER_CAR", "SEDAN", 2010, 2026, 30),
                "variant": OEMEngineVariantData(
                    brand_slug="dacia", model_slug="duster-logan",
                    engine_code="RENAULT_K9K_858", engine_name="1.5 dCi 110 (K9K)",
                    wmi_pattern="UU1", displacement_cc=1461, cylinders=4,
                    power_kw=81.0, power_hp=110.0, torque_nm=240.0, fuel_type="DIESEL", euro_standard="EURO_5",
                    fuel_tank_capacity_liters=50.0, gross_vehicle_weight_kg=1750.0, curb_weight_kg=1250.0, payload_capacity_kg=500.0,
                    ref_consumption_mixed_l_100km=5.2, ref_consumption_urban_l_100km=6.1, ref_consumption_highway_l_100km=4.7,
                    ref_idle_consumption_l_hour=1.2, oil_capacity_liters=4.5, oil_norm_spec="5W-30 RN0720 / ACEA C4",
                    coolant_capacity_liters=6.0, transmission_oil_capacity_liters=2.0
                )
            },
            {
                "brand": OEMBrandData("iveco", "Iveco", "IT", True),
                "model": OEMModelData("iveco", "daily", "Daily 35S / 50C", "LCV", "VAN", 2006, 2024, 31),
                "variant": OEMEngineVariantData(
                    brand_slug="iveco", model_slug="daily",
                    engine_code="IVECO_F1A_23", engine_name="2.3 HPI 130 / 140 (F1A)",
                    wmi_pattern="ZFC", displacement_cc=2287, cylinders=4,
                    power_kw=100.0, power_hp=136.0, torque_nm=350.0, fuel_type="DIESEL", euro_standard="EURO_5",
                    fuel_tank_capacity_liters=70.0, gross_vehicle_weight_kg=3500.0, curb_weight_kg=2100.0, payload_capacity_kg=1400.0,
                    ref_consumption_mixed_l_100km=8.8, ref_consumption_urban_l_100km=10.5, ref_consumption_highway_l_100km=7.8,
                    ref_idle_consumption_l_hour=2.4, oil_capacity_liters=6.5, oil_norm_spec="5W-30 Urania Daily LS / ACEA C2",
                    coolant_capacity_liters=9.5, transmission_oil_capacity_liters=2.8
                )
            },
            {
                "brand": OEMBrandData("jac", "JAC Motors", "CN", True),
                "model": OEMModelData("jac", "1040k", "1040K / HFC 1045", "HEAVY_TRUCK", "RIGID_TRUCK", 2008, 2026, 32),
                "variant": OEMEngineVariantData(
                    brand_slug="jac", model_slug="1040k",
                    engine_code="JAC_HFC4DA1", engine_name="2.8 Turbo Diesel (HFC4DA1)",
                    wmi_pattern="LJ1", displacement_cc=2771, cylinders=4,
                    power_kw=80.0, power_hp=108.0, torque_nm=240.0, fuel_type="DIESEL", euro_standard="EURO_2",
                    fuel_tank_capacity_liters=80.0, gross_vehicle_weight_kg=4500.0, curb_weight_kg=2200.0, payload_capacity_kg=2300.0,
                    ref_consumption_mixed_l_100km=13.5, ref_consumption_urban_l_100km=15.5, ref_consumption_highway_l_100km=12.0,
                    ref_idle_consumption_l_hour=3.5, oil_capacity_liters=6.0, oil_norm_spec="15W-40 API CF-4 / CI-4",
                    coolant_capacity_liters=10.0, transmission_oil_capacity_liters=3.0
                )
            },

            # =========================================================================
            # ENGINS BTP / MINES & AGRICOLE (CONSTRUCTION & AGRI_TRACTOR)
            # =========================================================================
            {
                "brand": OEMBrandData("caterpillar", "Caterpillar", "US", True),
                "model": OEMModelData("caterpillar", "cat-320d-336d", "Pelle Hydraulique 320D / 336D", "CONSTRUCTION", "EXCAVATOR", 2008, 2026, 19),
                "variant": OEMEngineVariantData(
                    brand_slug="caterpillar", model_slug="cat-320d-336d",
                    engine_code="CAT_C64_ACERT", engine_name="Cat C6.4 Acert (6.4L Turbo)",
                    wmi_pattern="CAT", displacement_cc=6400, cylinders=6,
                    power_kw=110.0, power_hp=148.0, torque_nm=700.0, fuel_type="DIESEL", euro_standard="STAGE_3A",
                    fuel_tank_capacity_liters=410.0, gross_vehicle_weight_kg=22000.0, curb_weight_kg=22000.0, payload_capacity_kg=0.0,
                    ref_consumption_mixed_l_100km=0.0, ref_consumption_urban_l_100km=0.0, ref_consumption_highway_l_100km=0.0,
                    ref_idle_consumption_l_hour=18.5, oil_capacity_liters=30.0, oil_norm_spec="15W-40 Cat ECF-2 / API CI-4",
                    coolant_capacity_liters=30.0, transmission_oil_capacity_liters=180.0
                )
            },
            {
                "brand": OEMBrandData("caterpillar", "Caterpillar", "US", True),
                "model": OEMModelData("caterpillar", "cat-966h", "Chargeuse sur Pneus 966H", "CONSTRUCTION", "EXCAVATOR", 2006, 2024, 20),
                "variant": OEMEngineVariantData(
                    brand_slug="caterpillar", model_slug="cat-966h",
                    engine_code="CAT_C11_ACERT", engine_name="Cat C11 Acert (11.1L)",
                    wmi_pattern="CAT", displacement_cc=11100, cylinders=6,
                    power_kw=195.0, power_hp=262.0, torque_nm=1250.0, fuel_type="DIESEL", euro_standard="STAGE_3A",
                    fuel_tank_capacity_liters=380.0, gross_vehicle_weight_kg=24000.0, curb_weight_kg=24000.0, payload_capacity_kg=6000.0,
                    ref_consumption_mixed_l_100km=0.0, ref_consumption_urban_l_100km=0.0, ref_consumption_highway_l_100km=0.0,
                    ref_idle_consumption_l_hour=22.0, oil_capacity_liters=36.0, oil_norm_spec="15W-40 Cat ECF-3 / API CJ-4",
                    coolant_capacity_liters=42.0, transmission_oil_capacity_liters=45.0
                )
            },
            {
                "brand": OEMBrandData("jcb", "JCB", "UK", True),
                "model": OEMModelData("jcb", "3cx-4cx", "Chargeuse-Pelleteuse 3CX / 4CX", "CONSTRUCTION", "EXCAVATOR", 2005, 2026, 21),
                "variant": OEMEngineVariantData(
                    brand_slug="jcb", model_slug="3cx-4cx",
                    engine_code="JCB_DIESELMAX_444", engine_name="JCB Dieselmax 444 (4.4L Turbo)",
                    wmi_pattern="JCB", displacement_cc=4400, cylinders=4,
                    power_kw=68.0, power_hp=92.0, torque_nm=416.0, fuel_type="DIESEL", euro_standard="STAGE_3A",
                    fuel_tank_capacity_liters=160.0, gross_vehicle_weight_kg=8500.0, curb_weight_kg=8070.0, payload_capacity_kg=1500.0,
                    ref_consumption_mixed_l_100km=0.0, ref_consumption_urban_l_100km=0.0, ref_consumption_highway_l_100km=0.0,
                    ref_idle_consumption_l_hour=8.5, oil_capacity_liters=15.0, oil_norm_spec="15W-40 API CI-4 / CH-4",
                    coolant_capacity_liters=18.5, transmission_oil_capacity_liters=16.0
                )
            },
            {
                "brand": OEMBrandData("cirta", "Cirta", "DZ", True),
                "model": OEMModelData("cirta", "c-6807", "Tracteur Agricole C 6807", "AGRI_TRACTOR", "STANDARD", 1980, 2026, 22),
                "variant": OEMEngineVariantData(
                    brand_slug="cirta", model_slug="c-6807",
                    engine_code="DEUTZ_F4L912", engine_name="Deutz F4L912 (Air-Cooled 3.8L)",
                    wmi_pattern="VFA", displacement_cc=3770, cylinders=4,
                    power_kw=50.0, power_hp=68.0, torque_nm=240.0, fuel_type="DIESEL", euro_standard="EURO_1",
                    fuel_tank_capacity_liters=80.0, gross_vehicle_weight_kg=3500.0, curb_weight_kg=3100.0, payload_capacity_kg=0.0,
                    ref_consumption_mixed_l_100km=0.0, ref_consumption_urban_l_100km=0.0, ref_consumption_highway_l_100km=0.0,
                    ref_idle_consumption_l_hour=6.5, oil_capacity_liters=11.0, oil_norm_spec="15W-40 API CD / CF",
                    coolant_capacity_liters=0.0, transmission_oil_capacity_liters=35.0
                )
            },

            # =========================================================================
            # EXTENSION DU PARC : TRACTEURS ROUTIERS & POIDS LOURDS ADDITIONNELS
            # =========================================================================
            {
                "brand": OEMBrandData("daf", "DAF", "NL", True),
                "model": OEMModelData("daf", "xf-105-460", "XF 105.460 / XF 460", "HEAVY_TRUCK", "TRACTOR_HEAD", 2006, 2024, 8),
                "variant": OEMEngineVariantData(
                    brand_slug="daf", model_slug="xf-105-460",
                    engine_code="DAF_MX13_340", engine_name="PACCAR MX-13 460 (12.9L Euro 5)",
                    wmi_pattern="XLR", displacement_cc=12902, cylinders=6,
                    power_kw=340.0, power_hp=460.0, torque_nm=2300.0, fuel_type="DIESEL", euro_standard="EURO_5",
                    fuel_tank_capacity_liters=850.0, gross_vehicle_weight_kg=44000.0, curb_weight_kg=8600.0, payload_capacity_kg=35400.0,
                    ref_consumption_mixed_l_100km=33.0, ref_consumption_urban_l_100km=38.0, ref_consumption_highway_l_100km=30.0,
                    ref_idle_consumption_l_hour=14.0, oil_capacity_liters=40.0, oil_norm_spec="10W-40 DAF Extended Drain / ACEA E6",
                    coolant_capacity_liters=48.0, transmission_oil_capacity_liters=14.5
                )
            },
            {
                "brand": OEMBrandData("iveco", "Iveco", "IT", True),
                "model": OEMModelData("iveco", "stralis-440-480", "Stralis 440 / 480 Active Time/Space", "HEAVY_TRUCK", "TRACTOR_HEAD", 2004, 2022, 9),
                "variant": OEMEngineVariantData(
                    brand_slug="iveco", model_slug="stralis-440-480",
                    engine_code="IVECO_CURSOR_13", engine_name="Cursor 13 F3B (12.9L Euro 3/5)",
                    wmi_pattern="WJM", displacement_cc=12882, cylinders=6,
                    power_kw=324.0, power_hp=440.0, torque_nm=2100.0, fuel_type="DIESEL", euro_standard="EURO_3",
                    fuel_tank_capacity_liters=600.0, gross_vehicle_weight_kg=44000.0, curb_weight_kg=8400.0, payload_capacity_kg=35600.0,
                    ref_consumption_mixed_l_100km=34.0, ref_consumption_urban_l_100km=39.5, ref_consumption_highway_l_100km=31.0,
                    ref_idle_consumption_l_hour=14.5, oil_capacity_liters=35.0, oil_norm_spec="15W-40 / 10W-40 Petronas Urania LD 7 / ACEA E7",
                    coolant_capacity_liters=38.0, transmission_oil_capacity_liters=13.0
                )
            },
            {
                "brand": OEMBrandData("mercedes-benz", "Mercedes-Benz", "DE", True),
                "model": OEMModelData("mercedes-benz", "atego-1218-1518", "Atego 1218 / 1518 Distribution", "HEAVY_TRUCK", "RIGID_TRUCK", 2004, 2026, 10),
                "variant": OEMEngineVariantData(
                    brand_slug="mercedes-benz", model_slug="atego-1218-1518",
                    engine_code="MB_OM_904_LA", engine_name="OM 904 LA (4.25L Turbo 177ch)",
                    wmi_pattern="WDB", displacement_cc=4249, cylinders=4,
                    power_kw=130.0, power_hp=177.0, torque_nm=675.0, fuel_type="DIESEL", euro_standard="EURO_4",
                    fuel_tank_capacity_liters=180.0, gross_vehicle_weight_kg=15000.0, curb_weight_kg=5100.0, payload_capacity_kg=9900.0,
                    ref_consumption_mixed_l_100km=21.0, ref_consumption_urban_l_100km=24.5, ref_consumption_highway_l_100km=18.5,
                    ref_idle_consumption_l_hour=7.5, oil_capacity_liters=15.8, oil_norm_spec="10W-40 MB-Approval 228.3 / 228.5",
                    coolant_capacity_liters=20.0, transmission_oil_capacity_liters=6.0
                )
            },
            {
                "brand": OEMBrandData("fuso", "Fuso", "JP", True),
                "model": OEMModelData("fuso", "canter-3-0", "Canter 6C15 / 7C15", "HEAVY_TRUCK", "RIGID_TRUCK", 2011, 2026, 11),
                "variant": OEMEngineVariantData(
                    brand_slug="fuso", model_slug="canter-3-0",
                    engine_code="FUSO_4P10_150", engine_name="4P10-T4 3.0L Common Rail 150ch",
                    wmi_pattern="TYB", displacement_cc=2998, cylinders=4,
                    power_kw=110.0, power_hp=150.0, torque_nm=370.0, fuel_type="DIESEL", euro_standard="EURO_5",
                    fuel_tank_capacity_liters=100.0, gross_vehicle_weight_kg=6500.0, curb_weight_kg=2600.0, payload_capacity_kg=3900.0,
                    ref_consumption_mixed_l_100km=15.5, ref_consumption_urban_l_100km=18.0, ref_consumption_highway_l_100km=13.5,
                    ref_idle_consumption_l_hour=4.8, oil_capacity_liters=6.5, oil_norm_spec="5W-30 / 10W-40 ACEA E7/E9 / MB 228.3",
                    coolant_capacity_liters=11.0, transmission_oil_capacity_liters=4.0
                )
            },
            {
                "brand": OEMBrandData("faw", "FAW Jiefang", "CN", True),
                "model": OEMModelData("faw", "j6p-390-420", "J6P 390 / 420 6x4", "HEAVY_TRUCK", "TIPPER", 2012, 2026, 12),
                "variant": OEMEngineVariantData(
                    brand_slug="faw", model_slug="j6p-390-420",
                    engine_code="FAW_CA6DL2_39", engine_name="CA6DL2-39E3 / CA6DM2 (11.0L Euro 3)",
                    wmi_pattern="LFP", displacement_cc=11050, cylinders=6,
                    power_kw=287.0, power_hp=390.0, torque_nm=1750.0, fuel_type="DIESEL", euro_standard="EURO_3",
                    fuel_tank_capacity_liters=400.0, gross_vehicle_weight_kg=40000.0, curb_weight_kg=12600.0, payload_capacity_kg=27400.0,
                    ref_consumption_mixed_l_100km=38.0, ref_consumption_urban_l_100km=44.0, ref_consumption_highway_l_100km=35.0,
                    ref_idle_consumption_l_hour=16.0, oil_capacity_liters=28.0, oil_norm_spec="15W-40 API CI-4 / FAW Heavy Duty",
                    coolant_capacity_liters=42.0, transmission_oil_capacity_liters=13.0
                )
            },

            # =========================================================================
            # EXTENSION DU PARC : AUTOCARS & MINIBUS INTER-WILAYAS (BUS)
            # =========================================================================
            {
                "brand": OEMBrandData("toyota", "Toyota", "JP", True),
                "model": OEMModelData("toyota", "coaster-1hz", "Coaster Minibus 30-Places", "BUS", "MINIBUS", 1993, 2026, 13),
                "variant": OEMEngineVariantData(
                    brand_slug="toyota", model_slug="coaster-1hz",
                    engine_code="TOYOTA_1HZ_BUS", engine_name="1HZ 4.2L 6-Cylindres Diesel Atmosphérique",
                    wmi_pattern="JTE", displacement_cc=4164, cylinders=6,
                    power_kw=96.0, power_hp=130.0, torque_nm=285.0, fuel_type="DIESEL", euro_standard="EURO_2",
                    fuel_tank_capacity_liters=95.0, gross_vehicle_weight_kg=5500.0, curb_weight_kg=3350.0, payload_capacity_kg=2150.0,
                    ref_consumption_mixed_l_100km=13.8, ref_consumption_urban_l_100km=16.5, ref_consumption_highway_l_100km=12.0,
                    ref_idle_consumption_l_hour=3.8, oil_capacity_liters=9.8, oil_norm_spec="15W-40 API CF / CI-4 Toyota Genuine",
                    coolant_capacity_liters=12.5, transmission_oil_capacity_liters=4.5
                )
            },
            {
                "brand": OEMBrandData("hyundai", "Hyundai", "KR", True),
                "model": OEMModelData("hyundai", "county-minibus", "County Minibus 29-Places", "BUS", "MINIBUS", 2004, 2026, 14),
                "variant": OEMEngineVariantData(
                    brand_slug="hyundai", model_slug="county-minibus",
                    engine_code="HYUNDAI_D4DB_COUNTY", engine_name="D4DB (3.9L Turbo Intercooler 130ch)",
                    wmi_pattern="KMF", displacement_cc=3907, cylinders=4,
                    power_kw=96.0, power_hp=130.0, torque_nm=372.0, fuel_type="DIESEL", euro_standard="EURO_2",
                    fuel_tank_capacity_liters=95.0, gross_vehicle_weight_kg=6670.0, curb_weight_kg=4100.0, payload_capacity_kg=2570.0,
                    ref_consumption_mixed_l_100km=15.2, ref_consumption_urban_l_100km=17.8, ref_consumption_highway_l_100km=13.5,
                    ref_idle_consumption_l_hour=4.2, oil_capacity_liters=9.5, oil_norm_spec="15W-40 API CH-4 / CI-4",
                    coolant_capacity_liters=14.0, transmission_oil_capacity_liters=4.5
                )
            },
            {
                "brand": OEMBrandData("snvi", "SNVI", "DZ", True),
                "model": OEMModelData("snvi", "safir-100l6", "Autocar Safir / 100 L6", "BUS", "INTERCITY_BUS", 1998, 2024, 15),
                "variant": OEMEngineVariantData(
                    brand_slug="snvi", model_slug="safir-100l6",
                    engine_code="CUMMINS_6BT_59", engine_name="Cummins 6BT 5.9L Turbo Intercooler",
                    wmi_pattern="VFA", displacement_cc=5883, cylinders=6,
                    power_kw=132.0, power_hp=180.0, torque_nm=580.0, fuel_type="DIESEL", euro_standard="EURO_2",
                    fuel_tank_capacity_liters=200.0, gross_vehicle_weight_kg=12000.0, curb_weight_kg=7200.0, payload_capacity_kg=4800.0,
                    ref_consumption_mixed_l_100km=24.0, ref_consumption_urban_l_100km=28.0, ref_consumption_highway_l_100km=21.0,
                    ref_idle_consumption_l_hour=8.0, oil_capacity_liters=16.5, oil_norm_spec="15W-40 API CI-4 / Cummins CES 20076",
                    coolant_capacity_liters=24.0, transmission_oil_capacity_liters=7.0
                )
            },

            # =========================================================================
            # EXTENSION DU PARC : UTILITAIRES LÉGERS & PICK-UPS (LCV)
            # =========================================================================
            {
                "brand": OEMBrandData("toyota", "Toyota", "JP", True),
                "model": OEMModelData("toyota", "hiace-2kd", "HiAce Commuter / Fourgon", "LCV", "VAN", 2004, 2024, 16),
                "variant": OEMEngineVariantData(
                    brand_slug="toyota", model_slug="hiace-2kd",
                    engine_code="TOYOTA_2KD_FTV", engine_name="2.5 D-4D 102ch (2KD-FTV)",
                    wmi_pattern="JTF", displacement_cc=2494, cylinders=4,
                    power_kw=75.0, power_hp=102.0, torque_nm=260.0, fuel_type="DIESEL", euro_standard="EURO_4",
                    fuel_tank_capacity_liters=70.0, gross_vehicle_weight_kg=3000.0, curb_weight_kg=1850.0, payload_capacity_kg=1150.0,
                    ref_consumption_mixed_l_100km=8.5, ref_consumption_urban_l_100km=10.2, ref_consumption_highway_l_100km=7.5,
                    ref_idle_consumption_l_hour=2.1, oil_capacity_liters=6.9, oil_norm_spec="5W-30 / 10W-40 API CF-4 / ACEA B3/B4",
                    coolant_capacity_liters=9.8, transmission_oil_capacity_liters=2.8
                )
            },
            {
                "brand": OEMBrandData("mitsubishi", "Mitsubishi", "JP", True),
                "model": OEMModelData("mitsubishi", "l200-4d56", "L200 Double Cabine 4x4", "LCV", "PICKUP", 2006, 2022, 17),
                "variant": OEMEngineVariantData(
                    brand_slug="mitsubishi", model_slug="l200-4d56",
                    engine_code="MITSUBISHI_4D56_CR", engine_name="2.5 DI-D Common Rail 136ch (4D56)",
                    wmi_pattern="MMC", displacement_cc=2477, cylinders=4,
                    power_kw=100.0, power_hp=136.0, torque_nm=314.0, fuel_type="DIESEL", euro_standard="EURO_4",
                    fuel_tank_capacity_liters=75.0, gross_vehicle_weight_kg=2850.0, curb_weight_kg=1860.0, payload_capacity_kg=990.0,
                    ref_consumption_mixed_l_100km=8.9, ref_consumption_urban_l_100km=10.6, ref_consumption_highway_l_100km=7.8,
                    ref_idle_consumption_l_hour=2.4, oil_capacity_liters=6.5, oil_norm_spec="5W-30 / 10W-40 API CF / ACEA B3/B4",
                    coolant_capacity_liters=8.2, transmission_oil_capacity_liters=2.8
                )
            },
            {
                "brand": OEMBrandData("dfsk", "DFSK (Dongfeng Sokon)", "CN", True),
                "model": OEMModelData("dfsk", "k01-c31", "K01 / K02 / C31 Mini-Camion", "LCV", "PICKUP", 2008, 2026, 18),
                "variant": OEMEngineVariantData(
                    brand_slug="dfsk", model_slug="k01-c31",
                    engine_code="DFSK_DK12", engine_name="DK12 1.2L 16V EFI Essence (88ch)",
                    wmi_pattern="LVT", displacement_cc=1240, cylinders=4,
                    power_kw=65.0, power_hp=88.0, torque_nm=115.0, fuel_type="PETROL", euro_standard="EURO_4",
                    fuel_tank_capacity_liters=40.0, gross_vehicle_weight_kg=1990.0, curb_weight_kg=990.0, payload_capacity_kg=1000.0,
                    ref_consumption_mixed_l_100km=6.8, ref_consumption_urban_l_100km=8.2, ref_consumption_highway_l_100km=5.9,
                    ref_idle_consumption_l_hour=1.2, oil_capacity_liters=4.2, oil_norm_spec="10W-40 API SN / SM",
                    coolant_capacity_liters=5.2, transmission_oil_capacity_liters=1.3
                )
            },
            {
                "brand": OEMBrandData("volkswagen", "Volkswagen", "DE", True),
                "model": OEMModelData("volkswagen", "crafter-20tdi", "Crafter Grand Fourgon 2.0 TDI", "LCV", "VAN", 2011, 2024, 19),
                "variant": OEMEngineVariantData(
                    brand_slug="volkswagen", model_slug="crafter-20tdi",
                    engine_code="VW_CKUB_20TDI", engine_name="2.0 TDI BiTurbo 163ch (CKUB)",
                    wmi_pattern="WV1", displacement_cc=1968, cylinders=4,
                    power_kw=120.0, power_hp=163.0, torque_nm=400.0, fuel_type="DIESEL", euro_standard="EURO_5",
                    fuel_tank_capacity_liters=75.0, gross_vehicle_weight_kg=3500.0, curb_weight_kg=2150.0, payload_capacity_kg=1350.0,
                    ref_consumption_mixed_l_100km=8.2, ref_consumption_urban_l_100km=9.8, ref_consumption_highway_l_100km=7.3,
                    ref_idle_consumption_l_hour=2.2, oil_capacity_liters=8.4, oil_norm_spec="5W-30 VW 504.00 / 507.00 LongLife III",
                    coolant_capacity_liters=9.5, transmission_oil_capacity_liters=2.5
                )
            },
            {
                "brand": OEMBrandData("isuzu", "Isuzu", "JP", True),
                "model": OEMModelData("isuzu", "d-max", "D-Max Double Cab 4x4", "LCV", "PICKUP", 2007, 2024, 20),
                "variant": OEMEngineVariantData(
                    brand_slug="isuzu", model_slug="d-max",
                    engine_code="ISUZU_4JK1_TCX", engine_name="2.5 Ddi Turbo Intercooler 136ch (4JK1-TCX)",
                    wmi_pattern="MP1", displacement_cc=2499, cylinders=4,
                    power_kw=100.0, power_hp=136.0, torque_nm=320.0, fuel_type="DIESEL", euro_standard="EURO_4",
                    fuel_tank_capacity_liters=76.0, gross_vehicle_weight_kg=2950.0, curb_weight_kg=1880.0, payload_capacity_kg=1070.0,
                    ref_consumption_mixed_l_100km=8.4, ref_consumption_urban_l_100km=10.0, ref_consumption_highway_l_100km=7.4,
                    ref_idle_consumption_l_hour=2.3, oil_capacity_liters=7.0, oil_norm_spec="10W-40 ACEA E7 / API CI-4",
                    coolant_capacity_liters=8.8, transmission_oil_capacity_liters=2.7
                )
            },

            # =========================================================================
            # EXTENSION DU PARC : ENGINS TP, BTP & CARRIÈRES (CONSTRUCTION)
            # =========================================================================
            {
                "brand": OEMBrandData("komatsu", "Komatsu", "JP", True),
                "model": OEMModelData("komatsu", "pc200-8", "Pelle Hydraulique PC200-8 / PC220-8", "CONSTRUCTION", "EXCAVATOR", 2007, 2026, 21),
                "variant": OEMEngineVariantData(
                    brand_slug="komatsu", model_slug="pc200-8",
                    engine_code="KOMATSU_SAA6D107E_1", engine_name="SAA6D107E-1 (6.69L Turbo 150ch)",
                    wmi_pattern="KM1", displacement_cc=6690, cylinders=6,
                    power_kw=110.0, power_hp=150.0, torque_nm=720.0, fuel_type="DIESEL", euro_standard="STAGE_3A",
                    fuel_tank_capacity_liters=400.0, gross_vehicle_weight_kg=20900.0, curb_weight_kg=20900.0, payload_capacity_kg=0.0,
                    ref_consumption_mixed_l_100km=0.0, ref_consumption_urban_l_100km=0.0, ref_consumption_highway_l_100km=0.0,
                    ref_idle_consumption_l_hour=16.5, oil_capacity_liters=23.1, oil_norm_spec="15W-40 API CI-4 / JASO DH-1",
                    coolant_capacity_liters=26.0, transmission_oil_capacity_liters=239.0
                )
            },
            {
                "brand": OEMBrandData("sdlg", "SDLG (Shandong Lingong)", "CN", True),
                "model": OEMModelData("sdlg", "lg956l", "Chargeuse sur Pneus LG956L / LG958L", "CONSTRUCTION", "EXCAVATOR", 2011, 2026, 22),
                "variant": OEMEngineVariantData(
                    brand_slug="sdlg", model_slug="lg956l",
                    engine_code="WEICHAI_WD10G220", engine_name="Weichai WD10G220E23 (9.7L 220ch)",
                    wmi_pattern="LDC", displacement_cc=9726, cylinders=6,
                    power_kw=162.0, power_hp=220.0, torque_nm=860.0, fuel_type="DIESEL", euro_standard="STAGE_2",
                    fuel_tank_capacity_liters=300.0, gross_vehicle_weight_kg=17500.0, curb_weight_kg=17500.0, payload_capacity_kg=5000.0,
                    ref_consumption_mixed_l_100km=0.0, ref_consumption_urban_l_100km=0.0, ref_consumption_highway_l_100km=0.0,
                    ref_idle_consumption_l_hour=19.0, oil_capacity_liters=20.0, oil_norm_spec="15W-40 API CH-4 / CI-4 Weichai Special",
                    coolant_capacity_liters=35.0, transmission_oil_capacity_liters=45.0
                )
            },
            {
                "brand": OEMBrandData("liugong", "LiuGong", "CN", True),
                "model": OEMModelData("liugong", "clg856", "Chargeuse sur Pneus CLG856", "CONSTRUCTION", "EXCAVATOR", 2008, 2026, 23),
                "variant": OEMEngineVariantData(
                    brand_slug="liugong", model_slug="clg856",
                    engine_code="CUMMINS_6CTA83", engine_name="Cummins 6CTA8.3 (8.3L Turbo 215ch)",
                    wmi_pattern="LG1", displacement_cc=8300, cylinders=6,
                    power_kw=160.0, power_hp=215.0, torque_nm=900.0, fuel_type="DIESEL", euro_standard="STAGE_2",
                    fuel_tank_capacity_liters=300.0, gross_vehicle_weight_kg=17100.0, curb_weight_kg=17100.0, payload_capacity_kg=5000.0,
                    ref_consumption_mixed_l_100km=0.0, ref_consumption_urban_l_100km=0.0, ref_consumption_highway_l_100km=0.0,
                    ref_idle_consumption_l_hour=18.5, oil_capacity_liters=24.0, oil_norm_spec="15W-40 API CI-4 / Cummins CES 20078",
                    coolant_capacity_liters=38.0, transmission_oil_capacity_liters=42.0
                )
            },
        ]

        for item in raw_specs:
            b: OEMBrandData = item["brand"]
            m: OEMModelData = item["model"]
            v: OEMEngineVariantData = item["variant"]
            tasks = ScheduleGenerator.generate_schedules_for_variant(m.category, v.fuel_type)
            entries.append(UnifiedOEMCatalogEntry(brand=b, model=m, variant=v, tasks=tasks))

        return entries
