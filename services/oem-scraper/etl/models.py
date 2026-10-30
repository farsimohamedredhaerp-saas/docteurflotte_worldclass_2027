from dataclasses import dataclass, field
from typing import Dict, List, Optional


@dataclass
class OEMBrandData:
    slug: str
    name: str
    country_origin: str = "GLOBAL"
    is_algeria_common: bool = False
    logo_url: Optional[str] = None


@dataclass
class OEMModelData:
    brand_slug: str
    slug: str
    name: str
    category: str  # HEAVY_TRUCK, LCV, PASSENGER_CAR, BUS, CONSTRUCTION, AGRI_TRACTOR, MOTORCYCLE
    body_type: str = "STANDARD"
    year_start: Optional[int] = None
    year_end: Optional[int] = None
    popularity_dz_rank: int = 999


@dataclass
class OEMEngineVariantData:
    brand_slug: str
    model_slug: str
    engine_code: str
    engine_name: str
    wmi_pattern: Optional[str] = None
    displacement_cc: int = 2000
    cylinders: int = 4
    power_kw: float = 100.0
    power_hp: float = 136.0
    torque_nm: float = 300.0
    fuel_type: str = "DIESEL"  # DIESEL, PETROL, HYBRID, ELECTRIC, LPG
    euro_standard: str = "EURO_3"
    fuel_tank_capacity_liters: float = 60.0
    gross_vehicle_weight_kg: float = 3500.0  # PTAC
    curb_weight_kg: float = 2000.0
    payload_capacity_kg: float = 1500.0
    ref_consumption_mixed_l_100km: float = 9.5
    ref_consumption_urban_l_100km: float = 11.5
    ref_consumption_highway_l_100km: float = 8.5
    ref_idle_consumption_l_hour: float = 1.5
    oil_capacity_liters: float = 6.0
    oil_norm_spec: str = "10W-40 ACEA E7"
    coolant_capacity_liters: float = 10.0
    transmission_oil_capacity_liters: float = 3.5


@dataclass
class OEMMaintenanceScheduleItem:
    task_code: str
    task_name: str
    subsystem: str  # ENGINE, BRAKES, TRANSMISSION, COOLING, SUSPENSION, ELECTRICAL, FILTERS
    normal_interval_km: int
    normal_interval_months: int
    normal_interval_engine_hours: int
    severe_interval_km: int
    severe_interval_months: int
    severe_interval_engine_hours: int
    standard_labor_minutes: int = 60
    criticality_weight: float = 1.0


@dataclass
class UnifiedOEMCatalogEntry:
    brand: OEMBrandData
    model: OEMModelData
    variant: OEMEngineVariantData
    tasks: List[OEMMaintenanceScheduleItem] = field(default_factory=list)
