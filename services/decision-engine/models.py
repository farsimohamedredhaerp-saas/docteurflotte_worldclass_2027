from datetime import date, datetime, time
from enum import Enum
import json
from typing import Any, Dict, List, Optional, Tuple

try:
    from pydantic import BaseModel as PydanticBaseModel, Field

    class BaseModel(PydanticBaseModel):  # type: ignore[misc]
        def model_dump(self, *args, **kwargs):
            if hasattr(super(), "model_dump"):
                return super().model_dump(*args, **kwargs)
            return self.dict(*args, **kwargs)

        def json(self, *args, **kwargs) -> str:
            if hasattr(super(), "model_dump_json"):
                return super().model_dump_json(*args, **kwargs)
            return json.dumps(self.model_dump(), default=str, ensure_ascii=False)
except ImportError:
    # Stand-in résilient si pydantic n'est pas installé dans l'environnement global
    def Field(default: Any = None, **kwargs: Any) -> Any:  # type: ignore[misc]
        if "default_factory" in kwargs and callable(kwargs["default_factory"]):
            return kwargs["default_factory"]()
        return default

    def _serialize_value(val: Any) -> Any:
        if isinstance(val, BaseModel):
            return val.model_dump()
        if isinstance(val, Enum):
            return val.value
        if isinstance(val, (datetime, date, time)):
            return val.isoformat()
        if isinstance(val, (list, tuple)):
            return [_serialize_value(item) for item in val]
        if isinstance(val, dict):
            return {k: _serialize_value(v) for k, v in val.items()}
        return val

    class BaseModel:  # type: ignore[no-redef]
        def __init__(self, **data: Any):
            for cls in reversed(self.__class__.__mro__):
                if cls is object or cls is BaseModel:
                    continue
                annotations = getattr(cls, "__annotations__", {})
                for attr_name in annotations:
                    if hasattr(cls, attr_name):
                        default_val = getattr(cls, attr_name)
                        if default_val is not Ellipsis:
                            if isinstance(default_val, list):
                                setattr(self, attr_name, list(default_val))
                            elif isinstance(default_val, dict):
                                setattr(self, attr_name, dict(default_val))
                            else:
                                setattr(self, attr_name, default_val)
            for k, v in data.items():
                setattr(self, k, v)

        def model_dump(self, *args: Any, **kwargs: Any) -> Dict[str, Any]:
            return {k: _serialize_value(v) for k, v in self.__dict__.items()}

        def dict(self, *args: Any, **kwargs: Any) -> Dict[str, Any]:
            return self.model_dump(*args, **kwargs)

        def json(self, *args: Any, **kwargs: Any) -> str:
            return json.dumps(self.model_dump(), default=str, ensure_ascii=False)


class IndustrySector(str, Enum):
    TRANSPORT = "TRANSPORT"
    LOGISTICS = "LOGISTICS"
    BTP = "BTP"
    AGRICULTURE = "AGRICULTURE"
    COLD_CHAIN = "COLD_CHAIN"


class ClimateZoneDZ(str, Enum):
    TELL_URBAN = "TELL_URBAN"          # Alger, Oran, Annaba, Blida (Ralenti, embouteillages)
    HIGH_PLATEAUS = "HIGH_PLATEAUS"    # Sétif, Batna, Djelfa, Tiaret (Pentes, froid/chaud)
    SAHARA_SOUTH = "SAHARA_SOUTH"      # Ouargla, Hassi Messaoud, Adrar, Tamanrasset (>45°C, sable)


class AssetCategory(str, Enum):
    LIGHT_VEHICLE = "LIGHT_VEHICLE"              # VL < 3.5T
    VAN = "VAN"                                  # Fourgon / VUL < 3.5T
    HEAVY_TRUCK_RIGID = "HEAVY_TRUCK_RIGID"      # Camion porteur (Cat C1/C2)
    TRACTOR_TRAILER = "TRACTOR_TRAILER"          # Tracteur routier + Semi-remorque (Cat E)
    REEFER_TRUCK = "REEFER_TRUCK"                # Camion frigorifique (ATP)
    HAZMAT_TANKER = "HAZMAT_TANKER"              # Citerne hydrocarbures / GPL / Chimie (ADR)
    CONSTRUCTION_EQUIP = "CONSTRUCTION_EQUIP"    # Engin BTP (Pelle, Grue, Toupie béton)
    AGRI_TRACTOR = "AGRI_TRACTOR"                # Tracteur agricole / Moissonneuse


class LicenseCategoryDZ(str, Enum):
    B = "B"    # Véhicules <= 3.5T
    C1 = "C1"  # Poids lourds 3.5T à 19T
    C2 = "C2"  # Poids lourds > 19T (Porteurs lourds)
    E = "E"    # Ensemble articulé / Semi-remorque > 750 kg
    D = "D"    # Transport de personnes


class DocumentTypeDZ(str, Enum):
    CONTROLE_TECHNIQUE_ENACTA = "CONTROLE_TECHNIQUE_ENACTA"
    ASSURANCE_RC_CATNAT = "ASSURANCE_RC_CATNAT"
    VIGNETTE_AUTOMOBILE = "VIGNETTE_AUTOMOBILE"
    AUTORISATION_CIRCULATION_MARCHANDISES = "AUTORISATION_CIRCULATION_MARCHANDISES"
    AGREMENT_MATIERES_DANGEREUSES_ADR = "AGREMENT_MATIERES_DANGEREUSES_ADR"
    CERTIFICAT_ATP_CHAINE_FROID = "CERTIFICAT_ATP_CHAINE_FROID"
    CERTIFICAT_ETALONNAGE_CHRONOTACHYGRAPHE = "CERTIFICAT_ETALONNAGE_CHRONOTACHYGRAPHE"
    PERMIS_CONDUIRE = "PERMIS_CONDUIRE"
    BREVET_PROFESSIONNEL_CONDUCTEUR = "BREVET_PROFESSIONNEL_CONDUCTEUR"
    HABILITATION_TRANSPORT_HYDROCARBURES = "HABILITATION_TRANSPORT_HYDROCARBURES"


class DispatchStatus(str, Enum):
    AVAILABLE = "AVAILABLE"
    IN_MISSION = "IN_MISSION"
    MAINTENANCE_WARN = "MAINTENANCE_WARN"
    BLOCKED_SAFETY = "BLOCKED_SAFETY"
    BLOCKED_REGULATORY = "BLOCKED_REGULATORY"


class RegulatoryDocument(BaseModel):
    doc_type: DocumentTypeDZ
    doc_number: str
    issued_at: date
    expires_at: date
    issuing_authority: str = "ENACTA / Ministère des Transports DZ"
    is_verified: bool = True


class SubsystemRUL(BaseModel):
    task_code: str = Field(..., description="ex: ENG_OIL_FILTER, BRAKE_PADS, COOLING_SYSTEM")
    task_name: str
    subsystem: str = Field(..., description="ENGINE, BRAKES, COOLING, FILTRATION, BATTERY, HYDRAULICS")
    wear_ratio_pct: float = Field(..., ge=0.0, le=200.0)
    rul_km: float = Field(..., description="Kilomètres restants estimés avant échéance critique")
    rul_engine_hours: float = Field(..., description="Heures moteur restantes estimées")
    rul_days: float = Field(..., description="Jours calendaires restants")
    is_critical_safety: bool = True


class ActiveDTC(BaseModel):
    code: str = Field(..., description="ex: P0217 (Surchauffe) ou J1939 SPN 110 FMI 0")
    severity: str = Field(..., description="INFO, WARNING, CRITICAL_STOP")
    description: str


class VehicleState(BaseModel):
    vehicle_id: str
    registration_plate: str = Field(..., description="Matricule Algérie ex: 00412-322-16")
    make_model: str = Field(..., description="ex: Renault Trucks T480 DXI 13")
    category: AssetCategory
    max_payload_tons: float
    gross_vehicle_weight_tons: float = Field(..., description="PTAC / PTRA en tonnes")
    fuel_type: str = Field(default="DIESEL", description="DIESEL, GASOLINE, LPG_GPL")
    ref_consumption_l_100km: float = 34.0
    has_working_reefer: bool = False
    has_working_pto: bool = False
    # Localisation & Compteurs
    current_wilaya_code: int = Field(default=16, ge=1, le=58)
    current_lat: float
    current_lon: float
    current_odometer_km: float
    current_engine_hours: float
    annual_target_km: float = 100000.0
    ytd_driven_km: float = 50000.0  # Kilométrage parcouru depuis le début de l'année
    # Santé Prédictive & Conformité
    vehicle_health_index: float = Field(..., ge=0.0, le=100.0, description="Score VHI 0-100")
    battery_soh_pct: float = 95.0
    cooling_ewma_residual_c: float = 0.0
    dispatch_status: DispatchStatus = DispatchStatus.AVAILABLE
    documents: List[RegulatoryDocument] = []
    subsystem_ruls: List[SubsystemRUL] = []
    active_dtcs: List[ActiveDTC] = []


class DriverState(BaseModel):
    driver_id: str
    full_name: str
    phone_dz: str
    license_categories: List[LicenseCategoryDZ]
    has_brevet_professionnel: bool = True
    has_adr_hazmat_cert: bool = False
    current_wilaya_code: int = 16
    # Temps de conduite (Conformité décret exécutif temps de conduite/repos)
    continuous_driving_hours: float = 0.0
    daily_driving_hours_today: float = 0.0
    rest_hours_last_24h: float = 11.0
    safety_score: float = Field(default=92.0, ge=0.0, le=100.0)
    is_available: bool = True
    documents: List[RegulatoryDocument] = []


class WilayaTimeRestriction(BaseModel):
    wilaya_code: int
    wilaya_name: str
    max_allowed_gvwr_tons: float = Field(..., description="PTAC au-delà duquel la restriction s'applique")
    restricted_windows: List[Tuple[time, time]] = Field(
        ..., description="Plages horaires d'interdiction (ex: pointe matin et soir)"
    )
    bypass_ring_road_name: str
    bypass_polygon_geojson: Dict[str, object]


class MissionRequest(BaseModel):
    mission_id: str
    tenant_id: str
    industry_sector: IndustrySector = IndustrySector.TRANSPORT
    requested_vehicle_id: str
    requested_driver_id: str
    # Origine / Destination / Transit
    origin_name: str
    origin_wilaya_code: int
    origin_lat: float
    origin_lon: float
    destination_name: str
    destination_wilaya_code: int
    transit_wilaya_codes: List[int] = []
    # Caractéristiques de la mission
    planned_departure_utc: datetime
    route_distance_km: float = Field(..., gt=0)
    estimated_driving_hours: float = Field(..., gt=0)
    required_payload_tons: float = Field(..., ge=0)
    target_climate_zone: ClimateZoneDZ = ClimateZoneDZ.TELL_URBAN
    requires_reefer_cold_chain: bool = False
    requires_hazmat_adr: bool = False
    requires_pto_hydraulics: bool = False


class ViolationDetail(BaseModel):
    code: str
    gate: str = Field(..., description="REGULATORY, WILAYA_RESTRICTION, PREDICTIVE_VHI_RUL, CAPACITY_MATCH")
    severity: str = Field(..., description="HARD_BLOCK, SOFT_WARNING_ADJUSTABLE")
    message_fr: str
    blocking_entity_id: str


class WorkOrderGenerated(BaseModel):
    work_order_id: str
    vehicle_id: str
    registration_plate: str
    priority: str = Field(..., description="URGENT_IMMOBILIZATION, HIGH_PREVENTIVE, ADMINISTRATIVE_RENEWAL")
    category: str = Field(..., description="MECHANICAL_PREDICTIVE, REGULATORY_ENACTA_INSURANCE")
    title: str
    tasks_to_perform: List[str]
    estimated_downtime_hours: float
    created_at_utc: datetime


class SubstitutionCandidateScore(BaseModel):
    vehicle_id: str
    registration_plate: str
    make_model: str
    driver_id: str
    driver_name: str
    total_score_100: float
    vhi_score_component: float
    fuel_cost_component: float
    approach_distance_component: float
    fleet_balancing_component: float
    approach_distance_km: float
    estimated_fuel_cost_dzd: float
    audit_justification: str


class DispatchDecisionResult(BaseModel):
    mission_id: str
    decision_timestamp_utc: datetime
    decision_outcome: str = Field(
        ...,
        description="APPROVED_AS_REQUESTED, APPROVED_WITH_ETD_OR_ROUTE_SHIFT, SUBSTITUTED_AUTOMATICALLY, REJECTED_NO_ELIGIBLE_ASSET",
    )
    assigned_vehicle_id: Optional[str]
    assigned_registration_plate: Optional[str]
    assigned_driver_id: Optional[str]
    assigned_driver_name: Optional[str]
    # Ajustements opérationnels (Arrêtés de Wilaya)
    original_etd_utc: datetime
    recommended_etd_utc: datetime
    valhalla_avoid_polygons: List[Dict[str, object]] = []
    route_advisory_notes: List[str] = []
    # Audit des blocages et actions automatiques déclenchées
    violations_detected: List[ViolationDetail] = []
    generated_work_orders: List[WorkOrderGenerated] = []
    ranked_substitutions: List[SubstitutionCandidateScore] = []
