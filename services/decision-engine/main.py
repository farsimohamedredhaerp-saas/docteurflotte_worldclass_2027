from datetime import date, datetime, timezone
import json
from typing import List
try:
    from fastapi import FastAPI
except ImportError:
    class FastAPI:  # type: ignore[no-redef]
        def __init__(self, *args, **kwargs):
            self.title = kwargs.get("title", "Decision Engine")
            self.routes = []

        def post(self, path: str, *args, **kwargs):
            def decorator(func):
                self.routes.append((path, func))
                return func
            return decorator

        def get(self, path: str, *args, **kwargs):
            def decorator(func):
                self.routes.append((path, func))
                return func
            return decorator
from pydantic import BaseModel

from models import (
    ActiveDTC,
    AssetCategory,
    ClimateZoneDZ,
    DispatchDecisionResult,
    DispatchStatus,
    DocumentTypeDZ,
    DriverState,
    IndustrySector,
    LicenseCategoryDZ,
    MissionRequest,
    RegulatoryDocument,
    SubsystemRUL,
    VehicleState,
)
from regulatory_and_predictive_gate import AlgerianRegulatoryAndPredictiveGate
from substitution_optimizer import FleetSubstitutionOptimizer
from ollama_client import OllamaClient

app = FastAPI(
    title="SaaS Fleet Decision & Substitution Engine (Algérie)",
    version="2.1.0",
    description=(
        "Moteur décisionnel réglementaire (ENACTA, Assurance, Arrêtés Wilayas)"
        " et prédictif (VHI, RUL) avec substitution automatique au Dispatch."
        " Enrichissement IA souverain via Ollama/Qwen (CPU-only, offline, Loi 18-07)."
    ),
)

# ─────────────────────────────────────────────────────────────────────────────
# Client IA souverain (Ollama + Qwen 2.5 — mode dégradé gracieux)
# ─────────────────────────────────────────────────────────────────────────────
# Initialisation lazy : ne bloque pas le démarrage si Ollama est arrêté.
# L'enrichissement IA est optionnel — le moteur déterministe reste toujours actif.
ollama = OllamaClient()


class DispatchEvaluationPayload(BaseModel):
    mission: MissionRequest
    fleet_vehicles: List[VehicleState]
    fleet_drivers: List[DriverState]


def execute_dispatch_decision_pipeline(
    payload: DispatchEvaluationPayload,
) -> DispatchDecisionResult:
    """Exécute la chaîne de décision complète :

    1. Audit du véhicule et du chauffeur demandés.
    2. Si bloqués -> Verrouillage automatique + Génération d'OT + Substitution optimale.
    3. Calcul de l'ETD optimal et des polygones de contournement Wilayas (Valhalla).
    """
    mission = payload.mission
    vehicles_by_id = {v.vehicle_id: v for v in payload.fleet_vehicles}
    drivers_by_id = {d.driver_id: d for d in payload.fleet_drivers}

    req_vehicle = vehicles_by_id.get(mission.requested_vehicle_id)
    req_driver = drivers_by_id.get(mission.requested_driver_id)

    all_violations = []
    generated_work_orders = []

    if req_vehicle:
        v_reg_v = AlgerianRegulatoryAndPredictiveGate.evaluate_vehicle_regulatory_compliance(
            req_vehicle, mission
        )
        v_tech_v = AlgerianRegulatoryAndPredictiveGate.evaluate_predictive_and_technical_readiness(
            req_vehicle, mission
        )
        all_violations.extend(v_reg_v + v_tech_v)
        if v_reg_v or v_tech_v:
            generated_work_orders.extend(
                AlgerianRegulatoryAndPredictiveGate.generate_automated_work_orders(
                    req_vehicle, v_reg_v + v_tech_v
                )
            )

    if req_driver and req_vehicle:
        d_v = AlgerianRegulatoryAndPredictiveGate.evaluate_driver_compliance(
            req_driver, req_vehicle, mission
        )
        all_violations.extend(d_v)

    # Cas A : Aucune violation bloquante sur le couple (Véhicule, Chauffeur) initial
    if not all_violations and req_vehicle and req_driver:
        rec_etd, polygons, notes = (
            AlgerianRegulatoryAndPredictiveGate.evaluate_wilaya_restrictions(
                req_vehicle, mission
            )
        )
        outcome = (
            "APPROVED_WITH_ETD_OR_ROUTE_SHIFT"
            if (rec_etd != mission.planned_departure_utc or polygons)
            else "APPROVED_AS_REQUESTED"
        )
        return DispatchDecisionResult(
            mission_id=mission.mission_id,
            decision_timestamp_utc=datetime.now(timezone.utc).replace(tzinfo=None),
            decision_outcome=outcome,
            assigned_vehicle_id=req_vehicle.vehicle_id,
            assigned_registration_plate=req_vehicle.registration_plate,
            assigned_driver_id=req_driver.driver_id,
            assigned_driver_name=req_driver.full_name,
            original_etd_utc=mission.planned_departure_utc,
            recommended_etd_utc=rec_etd,
            valhalla_avoid_polygons=polygons,
            route_advisory_notes=notes,
            violations_detected=[],
            generated_work_orders=[],
            ranked_substitutions=[],
        )

    # Cas B : Blocage détecté -> Recherche automatique du meilleur véhicule/chauffeur de substitution
    substitutions = FleetSubstitutionOptimizer.find_optimal_substitutions(
        mission=mission,
        fleet_vehicles=payload.fleet_vehicles,
        fleet_drivers=payload.fleet_drivers,
    )

    if substitutions:
        best_sub = substitutions[0]
        sub_vehicle = vehicles_by_id[best_sub.vehicle_id]
        rec_etd, polygons, notes = (
            AlgerianRegulatoryAndPredictiveGate.evaluate_wilaya_restrictions(
                sub_vehicle, mission
            )
        )
        return DispatchDecisionResult(
            mission_id=mission.mission_id,
            decision_timestamp_utc=datetime.now(timezone.utc).replace(tzinfo=None),
            decision_outcome="SUBSTITUTED_AUTOMATICALLY",
            assigned_vehicle_id=best_sub.vehicle_id,
            assigned_registration_plate=best_sub.registration_plate,
            assigned_driver_id=best_sub.driver_id,
            assigned_driver_name=best_sub.driver_name,
            original_etd_utc=mission.planned_departure_utc,
            recommended_etd_utc=rec_etd,
            valhalla_avoid_polygons=polygons,
            route_advisory_notes=notes,
            violations_detected=all_violations,
            generated_work_orders=generated_work_orders,
            ranked_substitutions=substitutions,
        )

    # Cas C : Aucun véhicule de remplacement éligible dans le parc
    return DispatchDecisionResult(
        mission_id=mission.mission_id,
        decision_timestamp_utc=datetime.now(timezone.utc).replace(tzinfo=None),
        decision_outcome="REJECTED_NO_ELIGIBLE_ASSET",
        assigned_vehicle_id=None,
        assigned_registration_plate=None,
        assigned_driver_id=None,
        assigned_driver_name=None,
        original_etd_utc=mission.planned_departure_utc,
        recommended_etd_utc=mission.planned_departure_utc,
        valhalla_avoid_polygons=[],
        route_advisory_notes=[],
        violations_detected=all_violations,
        generated_work_orders=generated_work_orders,
        ranked_substitutions=[],
    )


@app.post(
    "/api/v1/dispatch/evaluate-and-assign",
    response_model=DispatchDecisionResult,
)
def evaluate_dispatch_endpoint(payload: DispatchEvaluationPayload):
    return execute_dispatch_decision_pipeline(payload)


# =============================================================================
# ENDPOINTS IA SOUVERAINE (Ollama + Qwen 2.5 — CPU-only, offline, Loi 18-07)
# =============================================================================


class AIExplainDecisionResponse(BaseModel):
    """Réponse du pipeline décisionnel enrichie d'une explication IA."""
    decision: DispatchDecisionResult
    ai_explanation_fr: str | None = None
    ai_powered: bool = False


class DTCInterpretRequest(BaseModel):
    """Requête d'interprétation d'un code défaut DTC/J1939."""
    dtc_code: str
    vehicle_context: str = ""


class DTCInterpretResponse(BaseModel):
    """Réponse d'interprétation IA d'un code défaut."""
    dtc_code: str
    interpretation_fr: str | None = None
    source: str = "qwen2.5-1.5b-local"
    disclaimer: str = (
        "Interprétation IA indicative — toujours vérifier avec le manuel constructeur OEM."
    )
    ai_available: bool = True


class AIHealthResponse(BaseModel):
    """État de santé du service IA local."""
    status: str
    model: str
    mode: str
    sovereign: bool
    requires_internet: bool
    cache_enabled: bool


@app.post(
    "/api/v1/ai/explain-decision",
    response_model=AIExplainDecisionResponse,
)
def explain_decision_endpoint(payload: DispatchEvaluationPayload):
    """Exécute le pipeline décisionnel PUIS génère une explication IA.

    Mode dégradé : si Ollama est indisponible, retourne le résultat
    brut sans explication IA. Le moteur déterministe reste toujours actif.

    Conformité Loi 18-07 : seuls les codes de violation et métriques
    techniques sont transmis au modèle — aucune PII.
    """
    # 1. Pipeline décisionnel déterministe (toujours fiable)
    decision = execute_dispatch_decision_pipeline(payload)

    # 2. Enrichissement IA optionnel (ne bloque jamais le résultat)
    ai_explanation = None
    ai_powered = False

    if ollama.is_healthy() and decision.violations_detected:
        ai_explanation = ollama.explain_violations(
            [v.model_dump() for v in decision.violations_detected]
        )
        ai_powered = ai_explanation is not None

    return AIExplainDecisionResponse(
        decision=decision,
        ai_explanation_fr=ai_explanation,
        ai_powered=ai_powered,
    )


@app.post(
    "/api/v1/ai/interpret-dtc",
    response_model=DTCInterpretResponse,
)
def interpret_dtc_endpoint(request: DTCInterpretRequest):
    """Interprétation IA d'un code défaut DTC/J1939 pour les mécaniciens.

    Le contexte véhicule ne doit contenir que le modèle et la zone
    climatique — jamais de plaque, nom ou identifiant nominal.
    """
    if not ollama.is_healthy():
        return DTCInterpretResponse(
            dtc_code=request.dtc_code,
            interpretation_fr=None,
            ai_available=False,
        )

    interpretation = ollama.interpret_dtc_code(
        request.dtc_code, request.vehicle_context
    )
    return DTCInterpretResponse(
        dtc_code=request.dtc_code,
        interpretation_fr=interpretation,
        ai_available=True,
    )


@app.get(
    "/api/v1/ai/health",
    response_model=AIHealthResponse,
)
def ai_health_check():
    """Health check du service IA local souverain."""
    status = ollama.get_status()
    return AIHealthResponse(**status)


# =============================================================================
# SIMULATION EXÉCUTABLE : MISSION LOGISTIQUE ALGER (16) -> HASSI MESSAOUD (30)
# =============================================================================
if __name__ == "__main__":
    # Mission : Livraison d'équipements pétroliers de Rouïba (Alger) à Hassi Messaoud (Ouargla)
    # Distance A/R : 1 650 km | Départ demandé : 07h30 (en pleine heure d'interdiction PL à Alger)
    sample_mission = MissionRequest(
        mission_id="MSN-2026-DZ-8841",
        tenant_id="TENANT-LOGISTICS-DZ",
        industry_sector=IndustrySector.LOGISTICS,
        requested_vehicle_id="VEH-01-SHACMAN",
        requested_driver_id="DRV-01-KARIM",
        origin_name="Zone Industrielle Rouïba, Alger",
        origin_wilaya_code=16,
        origin_lat=36.738,
        origin_lon=3.285,
        destination_name="Base Pétrolière Hassi Messaoud, Ouargla",
        destination_wilaya_code=30,
        transit_wilaya_codes=[9, 10, 17, 47],
        planned_departure_utc=datetime(2026, 10, 25, 7, 30, 0),
        route_distance_km=1650.0,
        estimated_driving_hours=22.0,
        required_payload_tons=24.0,
        target_climate_zone=ClimateZoneDZ.SAHARA_SOUTH,
    )

    # Véhicule 1 (Demandé) : Shacman X3000 -> ENACTA expirant dans 24h + Résidu thermique élevé + RUL huile trop court
    veh_1_blocked = VehicleState(
        vehicle_id="VEH-01-SHACMAN",
        registration_plate="01492-319-16",
        make_model="Shacman X3000 6x4 420ch",
        category=AssetCategory.TRACTOR_TRAILER,
        max_payload_tons=30.0,
        gross_vehicle_weight_tons=40.0,
        ref_consumption_l_100km=38.5,
        current_wilaya_code=16,
        current_lat=36.735,
        current_lon=3.280,
        current_odometer_km=214500.0,
        current_engine_hours=5120.0,
        vehicle_health_index=58.0,  # Inférieur au seuil de 68.0 exigé pour SAHARA_SOUTH
        cooling_ewma_residual_c=8.4,  # Anomalie prédictive refroidissement (+8.4°C)
        documents=[
            RegulatoryDocument(
                doc_type=DocumentTypeDZ.CONTROLE_TECHNIQUE_ENACTA,
                doc_number="ENACTA-16-99201",
                issued_at=date(2026, 4, 26),
                expires_at=date(2026, 10, 26),  # Expire avant la fin + 72h !
            ),
            RegulatoryDocument(
                doc_type=DocumentTypeDZ.ASSURANCE_RC_CATNAT,
                doc_number="SAA-2026-8812",
                issued_at=date(2026, 1, 1),
                expires_at=date(2026, 12, 31),
            ),
            RegulatoryDocument(
                doc_type=DocumentTypeDZ.VIGNETTE_AUTOMOBILE,
                doc_number="VIG-2026-16",
                issued_at=date(2026, 3, 1),
                expires_at=date(2026, 12, 31),
            ),
            RegulatoryDocument(
                doc_type=DocumentTypeDZ.AUTORISATION_CIRCULATION_MARCHANDISES,
                doc_number="ACM-16-4410",
                issued_at=date(2025, 6, 1),
                expires_at=date(2027, 6, 1),
            ),
            RegulatoryDocument(
                doc_type=DocumentTypeDZ.CERTIFICAT_ETALONNAGE_CHRONOTACHYGRAPHE,
                doc_number="CHRONO-2026-11",
                issued_at=date(2026, 1, 10),
                expires_at=date(2027, 1, 10),
            ),
        ],
        subsystem_ruls=[
            SubsystemRUL(
                task_code="ENG_OIL_FILTER",
                task_name="Vidange Huile Moteur + Filtres",
                subsystem="ENGINE",
                wear_ratio_pct=89.0,
                rul_km=2100.0,  # Ajusté Sahara (x0.60) = 1260 km < 2475 km exigés (1650 * 1.5)
                rul_engine_hours=55.0,
                rul_days=14.0,
            )
        ],
    )

    # Véhicule 2 (Candidat de substitution optimal) : Renault Trucks T480 basé à Réghaïa (7 km)
    veh_2_optimal = VehicleState(
        vehicle_id="VEH-02-RENAULT-T480",
        registration_plate="00884-322-16",
        make_model="Renault Trucks T480 High DXI 13",
        category=AssetCategory.TRACTOR_TRAILER,
        max_payload_tons=32.0,
        gross_vehicle_weight_tons=40.0,
        ref_consumption_l_100km=33.0,
        current_wilaya_code=16,
        current_lat=36.730,
        current_lon=3.340,
        current_odometer_km=92000.0,
        current_engine_hours=2100.0,
        ytd_driven_km=38000.0,
        vehicle_health_index=94.5,
        cooling_ewma_residual_c=0.4,
        documents=[
            RegulatoryDocument(
                doc_type=DocumentTypeDZ.CONTROLE_TECHNIQUE_ENACTA,
                doc_number="ENACTA-16-11840",
                issued_at=date(2026, 8, 15),
                expires_at=date(2027, 2, 14),
            ),
            RegulatoryDocument(
                doc_type=DocumentTypeDZ.ASSURANCE_RC_CATNAT,
                doc_number="CAAR-2026-5521",
                issued_at=date(2026, 2, 1),
                expires_at=date(2027, 1, 31),
            ),
            RegulatoryDocument(
                doc_type=DocumentTypeDZ.VIGNETTE_AUTOMOBILE,
                doc_number="VIG-2026-88",
                issued_at=date(2026, 3, 1),
                expires_at=date(2026, 12, 31),
            ),
            RegulatoryDocument(
                doc_type=DocumentTypeDZ.AUTORISATION_CIRCULATION_MARCHANDISES,
                doc_number="ACM-16-9012",
                issued_at=date(2026, 1, 1),
                expires_at=date(2028, 1, 1),
            ),
            RegulatoryDocument(
                doc_type=DocumentTypeDZ.CERTIFICAT_ETALONNAGE_CHRONOTACHYGRAPHE,
                doc_number="CHRONO-2026-99",
                issued_at=date(2026, 5, 1),
                expires_at=date(2027, 5, 1),
            ),
        ],
        subsystem_ruls=[
            SubsystemRUL(
                task_code="ENG_OIL_FILTER",
                task_name="Vidange Huile Moteur + Filtres",
                subsystem="ENGINE",
                wear_ratio_pct=18.0,
                rul_km=16500.0,
                rul_engine_hours=380.0,
                rul_days=150.0,
            )
        ],
    )

    driver_ok = DriverState(
        driver_id="DRV-01-KARIM",
        full_name="Karim Benali",
        phone_dz="+213 550 12 34 56",
        license_categories=[LicenseCategoryDZ.B, LicenseCategoryDZ.C1, LicenseCategoryDZ.C2, LicenseCategoryDZ.E],
        has_brevet_professionnel=True,
        safety_score=96.0,
    )

    decision = execute_dispatch_decision_pipeline(
        DispatchEvaluationPayload(
            mission=sample_mission,
            fleet_vehicles=[veh_1_blocked, veh_2_optimal],
            fleet_drivers=[driver_ok],
        )
    )

    if hasattr(decision, "model_dump"):
        print(json.dumps(decision.model_dump(mode="json"), indent=2, ensure_ascii=False))
    else:
        print(json.dumps(json.loads(decision.json()), indent=2, ensure_ascii=False))
