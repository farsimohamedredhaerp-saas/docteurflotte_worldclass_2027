from datetime import datetime, timedelta, time, timezone
import uuid
from typing import Dict, List, Optional, Tuple

from models import (
    AssetCategory,
    ClimateZoneDZ,
    DispatchStatus,
    DocumentTypeDZ,
    DriverState,
    LicenseCategoryDZ,
    MissionRequest,
    ViolationDetail,
    VehicleState,
    WilayaTimeRestriction,
    WorkOrderGenerated,
)


class AlgerianRegulatoryAndPredictiveGate:
    """
    Moteur déterministe de vérification réglementaire (Algérie) et de validation
    prédictive (VHI & RUL) avant autorisation de départ en mission.
    """

    # Coefficients de sévérité climatique algériens (impactent directement le RUL)
    CLIMATE_SEVERITY_ALPHA: Dict[ClimateZoneDZ, float] = {
        ClimateZoneDZ.TELL_URBAN: 0.75,
        ClimateZoneDZ.HIGH_PLATEAUS: 0.80,
        ClimateZoneDZ.SAHARA_SOUTH: 0.60,
    }

    # Marge de sécurité RUL exigée par rapport à la distance de la mission
    RUL_SAFETY_MULTIPLIER: Dict[ClimateZoneDZ, float] = {
        ClimateZoneDZ.TELL_URBAN: 1.25,
        ClimateZoneDZ.HIGH_PLATEAUS: 1.30,
        ClimateZoneDZ.SAHARA_SOUTH: 1.50,  # +50% de marge exigée pour le Grand Sud
    }

    # Seuil minimal de Vehicle Health Index (VHI) autorisé
    MIN_VHI_THRESHOLD: Dict[ClimateZoneDZ, float] = {
        ClimateZoneDZ.TELL_URBAN: 50.0,
        ClimateZoneDZ.HIGH_PLATEAUS: 55.0,
        ClimateZoneDZ.SAHARA_SOUTH: 68.0,  # Interdiction d'envoyer un camion fragile au Sahara
    }

    # Référentiel pré-configuré des arrêtés wilayaux de restriction Poids Lourds
    WILAYA_RESTRICTIONS_DB: Dict[int, WilayaTimeRestriction] = {
        16: WilayaTimeRestriction(
            wilaya_code=16,
            wilaya_name="Alger",
            max_allowed_gvwr_tons=5.5,
            restricted_windows=[(time(6, 30), time(9, 30)), (time(16, 0), time(19, 30))],
            bypass_ring_road_name="2e Rocade Sud d'Alger (Boudouaou - Staouéli - Zéralda)",
            bypass_polygon_geojson={
                "type": "Polygon",
                "coordinates": [[
                    [3.010, 36.710],
                    [3.210, 36.710],
                    [3.210, 36.790],
                    [3.010, 36.790],
                    [3.010, 36.710],
                ]],
            },
        ),
        31: WilayaTimeRestriction(
            wilaya_code=31,
            wilaya_name="Oran",
            max_allowed_gvwr_tons=7.5,
            restricted_windows=[(time(7, 0), time(9, 30)), (time(16, 30), time(19, 0))],
            bypass_ring_road_name="4e Boulevard Périphérique d'Oran / Pénétrante Est",
            bypass_polygon_geojson={
                "type": "Polygon",
                "coordinates": [[
                    [-0.680, 35.670],
                    [-0.580, 35.670],
                    [-0.580, 35.730],
                    [-0.680, 35.730],
                    [-0.680, 35.670],
                ]],
            },
        ),
        25: WilayaTimeRestriction(
            wilaya_code=25,
            wilaya_name="Constantine",
            max_allowed_gvwr_tons=5.5,
            restricted_windows=[(time(6, 45), time(9, 15)), (time(16, 0), time(18, 45))],
            bypass_ring_road_name="Contournement Autoroute Est-Ouest (Échangeur El Khroub - Didouche Mourad)",
            bypass_polygon_geojson={
                "type": "Polygon",
                "coordinates": [[
                    [6.570, 36.330],
                    [6.660, 36.330],
                    [6.660, 36.390],
                    [6.570, 36.390],
                    [6.570, 36.330],
                ]],
            },
        ),
    }

    # ---------------------------------------------------------------------------
    # PORTE 1 : VÉRIFICATION RÉGLEMENTAIRE VÉHICULE (ENACTA, ASSURANCE, AGRÉMENTS)
    # ---------------------------------------------------------------------------
    @classmethod
    def evaluate_vehicle_regulatory_compliance(
        cls, vehicle: VehicleState, mission: MissionRequest
    ) -> List[ViolationDetail]:
        violations: List[ViolationDetail] = []

        # Date limite exigée : Fin de mission + 72h de marge de sécurité
        mission_end_utc = mission.planned_departure_utc + timedelta(
            hours=mission.estimated_driving_hours
        )
        required_valid_until_date = (mission_end_utc + timedelta(hours=72)).date()

        docs_by_type = {d.doc_type: d for d in vehicle.documents}

        # Documents obligatoires pour tout véhicule commercial en Algérie
        mandatory_docs = [
            DocumentTypeDZ.CONTROLE_TECHNIQUE_ENACTA,
            DocumentTypeDZ.ASSURANCE_RC_CATNAT,
            DocumentTypeDZ.VIGNETTE_AUTOMOBILE,
        ]

        # Documents spécifiques au transport de marchandises et poids lourds
        if vehicle.category in (
            AssetCategory.HEAVY_TRUCK_RIGID,
            AssetCategory.TRACTOR_TRAILER,
            AssetCategory.REEFER_TRUCK,
            AssetCategory.HAZMAT_TANKER,
        ):
            mandatory_docs.append(DocumentTypeDZ.AUTORISATION_CIRCULATION_MARCHANDISES)
            mandatory_docs.append(DocumentTypeDZ.CERTIFICAT_ETALONNAGE_CHRONOTACHYGRAPHE)

        if mission.requires_hazmat_adr or vehicle.category == AssetCategory.HAZMAT_TANKER:
            mandatory_docs.append(DocumentTypeDZ.AGREMENT_MATIERES_DANGEREUSES_ADR)

        if mission.requires_reefer_cold_chain or vehicle.category == AssetCategory.REEFER_TRUCK:
            mandatory_docs.append(DocumentTypeDZ.CERTIFICAT_ATP_CHAINE_FROID)

        for doc_type in mandatory_docs:
            doc = docs_by_type.get(doc_type)
            if not doc:
                violations.append(
                    ViolationDetail(
                        code=f"MISSING_{doc_type.value}",
                        gate="REGULATORY",
                        severity="HARD_BLOCK",
                        message_fr=(
                            f"Document réglementaire manquant sur le véhicule"
                            f" {vehicle.registration_plate} : {doc_type.value}."
                        ),
                        blocking_entity_id=vehicle.vehicle_id,
                    )
                )
                continue

            # Vérification de la date d'expiration (incluant la marge retour 72h)
            if doc.expires_at < required_valid_until_date:
                violations.append(
                    ViolationDetail(
                        code=f"EXPIRED_OR_EXPIRING_{doc_type.value}",
                        gate="REGULATORY",
                        severity="HARD_BLOCK",
                        message_fr=(
                            f"{doc_type.value} ({doc.doc_number}) du véhicule"
                            f" {vehicle.registration_plate} expire le {doc.expires_at}"
                            " (avant la fin sécurisée de mission fixée au"
                            f" {required_valid_until_date}). Risque d'immobilisation fourrière."
                        ),
                        blocking_entity_id=vehicle.vehicle_id,
                    )
                )

            # Vérification spécifique de la périodicité légale ENACTA (6 mois PL/ADR vs 12 mois VUL)
            if doc_type == DocumentTypeDZ.CONTROLE_TECHNIQUE_ENACTA:
                max_legal_days = (
                    186
                    if vehicle.category in (
                        AssetCategory.HEAVY_TRUCK_RIGID,
                        AssetCategory.TRACTOR_TRAILER,
                        AssetCategory.REEFER_TRUCK,
                        AssetCategory.HAZMAT_TANKER,
                    )
                    else 366
                )
                validity_span_days = (doc.expires_at - doc.issued_at).days
                if validity_span_days > max_legal_days:
                    violations.append(
                        ViolationDetail(
                            code="ENACTA_INVALID_PERIODICITY",
                            gate="REGULATORY",
                            severity="HARD_BLOCK",
                            message_fr=(
                                "Anomalie périodicité ENACTA sur"
                                f" {vehicle.registration_plate} : validité saisie de"
                                f" {validity_span_days} jours alors que la loi algérienne"
                                f" impose un contrôle tous les {max_legal_days // 30} mois"
                                f" pour la catégorie {vehicle.category.value}."
                            ),
                            blocking_entity_id=vehicle.vehicle_id,
                        )
                    )

        return violations

    # ---------------------------------------------------------------------------
    # PORTE 1-BIS : VÉRIFICATION RÉGLEMENTAIRE CHAUFFEUR (PERMIS, BREVET, HOS)
    # ---------------------------------------------------------------------------
    @classmethod
    def evaluate_driver_compliance(
        cls, driver: DriverState, vehicle: VehicleState, mission: MissionRequest
    ) -> List[ViolationDetail]:
        violations: List[ViolationDetail] = []

        if not driver.is_available:
            violations.append(
                ViolationDetail(
                    code="DRIVER_UNAVAILABLE",
                    gate="REGULATORY",
                    severity="HARD_BLOCK",
                    message_fr=f"Le conducteur {driver.full_name} est actuellement indisponible.",
                    blocking_entity_id=driver.driver_id,
                )
            )

        # 1. Adéquation catégorie de permis algérien avec le véhicule
        required_license = LicenseCategoryDZ.B
        if vehicle.category == AssetCategory.TRACTOR_TRAILER:
            required_license = LicenseCategoryDZ.E
        elif vehicle.gross_vehicle_weight_tons > 19.0:
            required_license = LicenseCategoryDZ.C2
        elif vehicle.gross_vehicle_weight_tons > 3.5:
            required_license = LicenseCategoryDZ.C1

        if required_license not in driver.license_categories:
            violations.append(
                ViolationDetail(
                    code="DRIVER_LICENSE_MISMATCH",
                    gate="REGULATORY",
                    severity="HARD_BLOCK",
                    message_fr=(
                        f"Le conducteur {driver.full_name} ne possède pas la"
                        f" catégorie de permis requise ({required_license.value})"
                        f" pour conduire {vehicle.registration_plate} (PTAC"
                        f" {vehicle.gross_vehicle_weight_tons}T)."
                    ),
                    blocking_entity_id=driver.driver_id,
                )
            )

        # 2. Brevet Professionnel obligatoire pour les poids lourds et matières dangereuses
        if required_license in (
            LicenseCategoryDZ.C1,
            LicenseCategoryDZ.C2,
            LicenseCategoryDZ.E,
        ) and not driver.has_brevet_professionnel:
            violations.append(
                ViolationDetail(
                    code="MISSING_BREVET_PROFESSIONNEL",
                    gate="REGULATORY",
                    severity="HARD_BLOCK",
                    message_fr=(
                        f"Brevet Professionnel Conducteur (BPC) manquant pour {driver.full_name}."
                    ),
                    blocking_entity_id=driver.driver_id,
                )
            )

        if (
            mission.requires_hazmat_adr
            or vehicle.category == AssetCategory.HAZMAT_TANKER
        ) and not driver.has_adr_hazmat_cert:
            violations.append(
                ViolationDetail(
                    code="MISSING_DRIVER_ADR_CERT",
                    gate="REGULATORY",
                    severity="HARD_BLOCK",
                    message_fr=(
                        f"Habilitation transport matières dangereuses / hydrocarbures"
                        f" manquante pour {driver.full_name}."
                    ),
                    blocking_entity_id=driver.driver_id,
                )
            )

        # 3. Temps de conduite et repos (Prévention de la fatigue)
        if driver.continuous_driving_hours >= 4.5:
            violations.append(
                ViolationDetail(
                    code="DRIVER_CONTINUOUS_DRIVING_EXCEEDED",
                    gate="REGULATORY",
                    severity="HARD_BLOCK",
                    message_fr=(
                        f"Dépassement du temps de conduite continu maximal (4h30)"
                        f" pour {driver.full_name} ({driver.continuous_driving_hours}h)."
                        " Pause réglementaire de 45 min requise."
                    ),
                    blocking_entity_id=driver.driver_id,
                )
            )

        if driver.daily_driving_hours_today >= 9.0:
            violations.append(
                ViolationDetail(
                    code="DRIVER_DAILY_QUOTA_EXHAUSTED",
                    gate="REGULATORY",
                    severity="HARD_BLOCK",
                    message_fr=(
                        f"Quota journalier de conduite (9h00) atteint pour"
                        f" {driver.full_name} ({driver.daily_driving_hours_today}h)."
                    ),
                    blocking_entity_id=driver.driver_id,
                )
            )

        return violations

    # ---------------------------------------------------------------------------
    # PORTE 2 : RESTRICTIONS HORAIRES & TONNAGE PAR WILAYA (CALCUL ETD & BYPASS)
    # ---------------------------------------------------------------------------
    @classmethod
    def evaluate_wilaya_restrictions(
        cls, vehicle: VehicleState, mission: MissionRequest
    ) -> Tuple[datetime, List[Dict[str, object]], List[str]]:
        recommended_etd = mission.planned_departure_utc
        avoid_polygons: List[Dict[str, object]] = []
        advisory_notes: List[str] = []

        # 1. Vérification sur la Wilaya d'origine au moment du départ
        origin_rule = cls.WILAYA_RESTRICTIONS_DB.get(mission.origin_wilaya_code)
        if (
            origin_rule
            and vehicle.gross_vehicle_weight_tons > origin_rule.max_allowed_gvwr_tons
        ):
            dep_time = mission.planned_departure_utc.time()
            for win_start, win_end in origin_rule.restricted_windows:
                if win_start <= dep_time <= win_end:
                    early_departure = mission.planned_departure_utc.replace(
                        hour=win_start.hour, minute=win_start.minute, second=0
                    ) - timedelta(minutes=30)
                    late_departure = mission.planned_departure_utc.replace(
                        hour=win_end.hour, minute=win_end.minute, second=0
                    ) + timedelta(minutes=15)

                    recommended_etd = early_departure
                    avoid_polygons.append(origin_rule.bypass_polygon_geojson)
                    advisory_notes.append(
                        f"[Arrêté Wilaya {origin_rule.wilaya_code} -"
                        f" {origin_rule.wilaya_name}] Circulation interdite aux véhicules"
                        f" > {origin_rule.max_allowed_gvwr_tons}T entre"
                        f" {win_start.strftime('%H:%M')} et {win_end.strftime('%H:%M')}."
                        " Départ avancé automatiquement à"
                        f" {early_departure.strftime('%H:%M')} UTC (ou reporté à"
                        f" {late_departure.strftime('%H:%M')}) + Contournement activé via"
                        f" {origin_rule.bypass_ring_road_name}."
                    )

        # 2. Vérification des Wilayas de transit et de destination
        traversed_wilayas = set(
            mission.transit_wilaya_codes + [mission.destination_wilaya_code]
        )
        for w_code in traversed_wilayas:
            w_rule = cls.WILAYA_RESTRICTIONS_DB.get(w_code)
            if (
                w_rule
                and vehicle.gross_vehicle_weight_tons > w_rule.max_allowed_gvwr_tons
            ):
                avoid_polygons.append(w_rule.bypass_polygon_geojson)
                advisory_notes.append(
                    f"[Routage Poids Lourds Wilaya {w_rule.wilaya_code} -"
                    f" {w_rule.wilaya_name}] Polygone d'évitement urbain injecté dans"
                    f" Valhalla via {w_rule.bypass_ring_road_name}."
                )

        return recommended_etd, avoid_polygons, advisory_notes

    # ---------------------------------------------------------------------------
    # PORTE 3 : ADÉQUATION MÉTIER, SANTÉ PRÉDICTIVE (VHI) & PORTES RUL
    # ---------------------------------------------------------------------------
    @classmethod
    def evaluate_predictive_and_technical_readiness(
        cls, vehicle: VehicleState, mission: MissionRequest
    ) -> List[ViolationDetail]:
        violations: List[ViolationDetail] = []

        # 1. Adéquation Capacité / Tonnage / Équipements Métiers (Frigo, PTO, ADR)
        if vehicle.max_payload_tons < mission.required_payload_tons:
            violations.append(
                ViolationDetail(
                    code="INSUFFICIENT_PAYLOAD_CAPACITY",
                    gate="CAPACITY_MATCH",
                    severity="HARD_BLOCK",
                    message_fr=(
                        f"Capacité de charge utile insuffisante sur"
                        f" {vehicle.registration_plate} ({vehicle.max_payload_tons}T"
                        f" max vs {mission.required_payload_tons}T requis)."
                    ),
                    blocking_entity_id=vehicle.vehicle_id,
                )
            )

        if mission.requires_reefer_cold_chain and not vehicle.has_working_reefer:
            violations.append(
                ViolationDetail(
                    code="MISSING_WORKING_REEFER",
                    gate="CAPACITY_MATCH",
                    severity="HARD_BLOCK",
                    message_fr=(
                        f"Mission Chaîne du Froid : le véhicule"
                        f" {vehicle.registration_plate} ne dispose pas d'un groupe"
                        " frigorifique opérationnel."
                    ),
                    blocking_entity_id=vehicle.vehicle_id,
                )
            )

        if mission.requires_pto_hydraulics and not vehicle.has_working_pto:
            violations.append(
                ViolationDetail(
                    code="MISSING_WORKING_PTO",
                    gate="CAPACITY_MATCH",
                    severity="HARD_BLOCK",
                    message_fr=(
                        f"Mission BTP/Hydraulique : prise de force (PTO) absente ou"
                        f" défaillante sur {vehicle.registration_plate}."
                    ),
                    blocking_entity_id=vehicle.vehicle_id,
                )
            )

        # 2. Vérification du Vehicle Health Index (VHI) selon la zone climatique cible
        min_vhi = cls.MIN_VHI_THRESHOLD.get(mission.target_climate_zone, 50.0)
        if vehicle.vehicle_health_index < min_vhi:
            violations.append(
                ViolationDetail(
                    code="VHI_BELOW_SAFETY_THRESHOLD",
                    gate="PREDICTIVE_VHI_RUL",
                    severity="HARD_BLOCK",
                    message_fr=(
                        f"Indice de santé VHI du véhicule {vehicle.registration_plate}"
                        f" ({vehicle.vehicle_health_index}/100) inférieur au seuil"
                        f" minimal exigé ({min_vhi}/100) pour la zone"
                        f" {mission.target_climate_zone.value}."
                    ),
                    blocking_entity_id=vehicle.vehicle_id,
                )
            )

        # 3. Vérification des codes défauts critiques (CAN / OBD-II / J1939)
        for dtc in vehicle.active_dtcs:
            if dtc.severity == "CRITICAL_STOP":
                violations.append(
                    ViolationDetail(
                        code=f"ACTIVE_CRITICAL_DTC_{dtc.code}",
                        gate="PREDICTIVE_VHI_RUL",
                        severity="HARD_BLOCK",
                        message_fr=(
                            f"Code défaut calculateur critique actif sur"
                            f" {vehicle.registration_plate} : [{dtc.code}]"
                            f" {dtc.description}."
                        ),
                        blocking_entity_id=vehicle.vehicle_id,
                    )
                )

        # 4. Vérification des anomalies prédictives Batterie (SOH) et Refroidissement (EWMA)
        if vehicle.cooling_ewma_residual_c >= 7.5:
            violations.append(
                ViolationDetail(
                    code="PREDICTIVE_COOLING_RESIDUAL_ANOMALY",
                    gate="PREDICTIVE_VHI_RUL",
                    severity="HARD_BLOCK",
                    message_fr=(
                        f"Dérive thermique prédictive détectée sur le circuit de"
                        f" refroidissement de {vehicle.registration_plate} (Résidu"
                        f" EWMA = +{vehicle.cooling_ewma_residual_c}°C). Risque élevé"
                        " de joint de culasse en charge."
                    ),
                    blocking_entity_id=vehicle.vehicle_id,
                )
            )

        if vehicle.battery_soh_pct < 45.0:
            violations.append(
                ViolationDetail(
                    code="PREDICTIVE_BATTERY_STARTER_FAILURE_RISK",
                    gate="PREDICTIVE_VHI_RUL",
                    severity="HARD_BLOCK",
                    message_fr=(
                        f"Santé batterie au démarrage (Cranking SOH) critique sur"
                        f" {vehicle.registration_plate} ({vehicle.battery_soh_pct}%)."
                        " Risque imminent de non-redémarrage en mission."
                    ),
                    blocking_entity_id=vehicle.vehicle_id,
                )
            )

        # 5. Vérification du RUL (Remaining Useful Life) de chaque sous-système
        alpha_dz = cls.CLIMATE_SEVERITY_ALPHA.get(
            mission.target_climate_zone, 0.75
        )
        safety_mult = cls.RUL_SAFETY_MULTIPLIER.get(
            mission.target_climate_zone, 1.25
        )
        required_rul_km = mission.route_distance_km * safety_mult
        required_rul_hours = mission.estimated_driving_hours * safety_mult

        for sub in vehicle.subsystem_ruls:
            if not sub.is_critical_safety:
                continue
            effective_rul_km = sub.rul_km * alpha_dz
            effective_rul_hours = sub.rul_engine_hours * alpha_dz

            if (
                effective_rul_km < required_rul_km
                or effective_rul_hours < required_rul_hours
            ):
                violations.append(
                    ViolationDetail(
                        code=f"INSUFFICIENT_RUL_{sub.task_code}",
                        gate="PREDICTIVE_VHI_RUL",
                        severity="HARD_BLOCK",
                        message_fr=(
                            f"RUL insuffisant pour [{sub.task_name}] sur"
                            f" {vehicle.registration_plate} : RUL effectif ajusté climat"
                            f" = {round(effective_rul_km, 0)} km /"
                            f" {round(effective_rul_hours, 1)} h (Exigé pour la mission"
                            f" avec marge de sécurité : {round(required_rul_km, 0)} km /"
                            f" {round(required_rul_hours, 1)} h)."
                        ),
                        blocking_entity_id=vehicle.vehicle_id,
                    )
                )

        return violations

    # ---------------------------------------------------------------------------
    # GÉNÉRATION AUTOMATIQUE D'ORDRES DE TRAVAIL (OT) ATELIER OU ADMINISTRATIFS
    # ---------------------------------------------------------------------------
    @classmethod
    def generate_automated_work_orders(
        cls, vehicle: VehicleState, violations: List[ViolationDetail]
    ) -> List[WorkOrderGenerated]:
        work_orders: List[WorkOrderGenerated] = []
        mech_tasks: List[str] = []
        reg_tasks: List[str] = []

        for v in violations:
            if v.blocking_entity_id != vehicle.vehicle_id:
                continue
            if v.gate == "PREDICTIVE_VHI_RUL":
                mech_tasks.append(f"[{v.code}] {v.message_fr}")
            elif v.gate == "REGULATORY":
                reg_tasks.append(f"[{v.code}] {v.message_fr}")

        now_utc = datetime.utcnow()

        if mech_tasks:
            work_orders.append(
                WorkOrderGenerated(
                    work_order_id=f"OT-MECH-{uuid.uuid4().hex[:6].upper()}",
                    vehicle_id=vehicle.vehicle_id,
                    registration_plate=vehicle.registration_plate,
                    priority="URGENT_IMMOBILIZATION",
                    category="MECHANICAL_PREDICTIVE",
                    title=(
                        "Intervention Prédictive & Curative Bloquant Dispatch —"
                        f" {vehicle.registration_plate}"
                    ),
                    tasks_to_perform=mech_tasks,
                    estimated_downtime_hours=6.0,
                    created_at_utc=now_utc,
                )
            )

        if reg_tasks:
            work_orders.append(
                WorkOrderGenerated(
                    work_order_id=f"OT-REG-{uuid.uuid4().hex[:6].upper()}",
                    vehicle_id=vehicle.vehicle_id,
                    registration_plate=vehicle.registration_plate,
                    priority="ADMINISTRATIVE_RENEWAL",
                    category="REGULATORY_ENACTA_INSURANCE",
                    title=(
                        "Mise en Conformité Réglementaire (ENACTA / Assurance) —"
                        f" {vehicle.registration_plate}"
                    ),
                    tasks_to_perform=reg_tasks,
                    estimated_downtime_hours=24.0,
                    created_at_utc=now_utc,
                )
            )

        return work_orders
