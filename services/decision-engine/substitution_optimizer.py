import math
from typing import List, Tuple

from models import (
    DispatchStatus,
    DriverState,
    MissionRequest,
    SubstitutionCandidateScore,
    VehicleState,
)
from regulatory_and_predictive_gate import AlgerianRegulatoryAndPredictiveGate


class FleetSubstitutionOptimizer:
    """
    Algorithme d'optimisation multicritère pour la substitution automatique
    de véhicule et de conducteur lors du blocage d'un ordre de mission (Dispatch).
    """

    # Tarifs indicatifs carburants Naftal en Algérie (DZD / Litre)
    NAFTAL_FUEL_PRICE_DZD = {
        "DIESEL": 29.01,
        "GASOLINE": 45.62,
        "LPG_GPL": 9.00,
    }

    # Pondérations de la fonction d'utilité multicritère (Somme = 1.0)
    WEIGHT_VHI_HEALTH = 0.35       # Priorité à la fiabilité mécanique
    WEIGHT_FUEL_ECONOMY = 0.25     # Optimisation du coût énergétique de la mission
    WEIGHT_APPROACH_DIST = 0.25    # Minimisation des kilomètres à vide (Haut-le-pied)
    WEIGHT_FLEET_BALANCE = 0.15    # Lissage de l'usure kilométrique annuelle du parc

    @staticmethod
    def haversine_road_distance_km(
        lat1: float, lon1: float, lat2: float, lon2: float
    ) -> float:
        """Calcule la distance routière d'approche estimée (Haversine * facteur de détour routier 1.28)."""
        r_earth_km = 6371.0
        d_lat = math.radians(lat2 - lat1)
        d_lon = math.radians(lon2 - lon1)
        a = (
            math.sin(d_lat / 2.0) ** 2
            + math.cos(math.radians(lat1))
            * math.cos(math.radians(lat2))
            * math.sin(d_lon / 2.0) ** 2
        )
        c = 2.0 * math.atan2(math.sqrt(a), math.sqrt(1.0 - a))
        return round(r_earth_km * c * 1.28, 2)

    @classmethod
    def estimate_mission_fuel_cost_dzd(
        cls, vehicle: VehicleState, mission: MissionRequest, approach_km: float
    ) -> float:
        """Estime le coût total de carburant (Approche + Mission) en DZD selon la charge."""
        total_km = mission.route_distance_km + approach_km
        load_ratio = (
            mission.required_payload_tons / max(1.0, vehicle.max_payload_tons)
        )
        # Surconsommation liée à la charge utile (+18% à pleine charge) et au relief/climat
        climate_penalty = (
            1.12 if mission.target_climate_zone.value == "SAHARA_SOUTH" else 1.04
        )
        adjusted_l_100km = (
            vehicle.ref_consumption_l_100km
            * (0.85 + 0.30 * load_ratio)
            * climate_penalty
        )
        liters_needed = (total_km / 100.0) * adjusted_l_100km
        unit_price = cls.NAFTAL_FUEL_PRICE_DZD.get(vehicle.fuel_type, 29.01)
        return round(liters_needed * unit_price, 2)

    @classmethod
    def find_optimal_substitutions(
        cls,
        mission: MissionRequest,
        fleet_vehicles: List[VehicleState],
        fleet_drivers: List[DriverState],
        max_approach_distance_km: float = 180.0,
    ) -> List[SubstitutionCandidateScore]:
        """
        Filtre les véhicules et chauffeurs 100% conformes (0 violation) et les classe
        selon le score multicritère TOPSIS/Utilité pondérée.
        """
        eligible_pairs: List[Tuple[VehicleState, DriverState, float, float]] = []

        for vehicle in fleet_vehicles:
            if vehicle.dispatch_status != DispatchStatus.AVAILABLE:
                continue

            # Vérification stricte des Portes 1 (Réglementaire Véhicule) et 3 (Prédictif & Capacité)
            v_reg_violations = (
                AlgerianRegulatoryAndPredictiveGate.evaluate_vehicle_regulatory_compliance(
                    vehicle, mission
                )
            )
            v_tech_violations = (
                AlgerianRegulatoryAndPredictiveGate.evaluate_predictive_and_technical_readiness(
                    vehicle, mission
                )
            )
            if v_reg_violations or v_tech_violations:
                continue

            approach_km = cls.haversine_road_distance_km(
                vehicle.current_lat,
                vehicle.current_lon,
                mission.origin_lat,
                mission.origin_lon,
            )
            if approach_km > max_approach_distance_km:
                continue

            fuel_cost_dzd = cls.estimate_mission_fuel_cost_dzd(
                vehicle, mission, approach_km
            )

            # Recherche du meilleur conducteur disponible et habilité pour ce véhicule
            best_driver_for_vehicle = None
            for driver in fleet_drivers:
                d_violations = (
                    AlgerianRegulatoryAndPredictiveGate.evaluate_driver_compliance(
                        driver, vehicle, mission
                    )
                )
                if not d_violations:
                    if (
                        best_driver_for_vehicle is None
                        or driver.safety_score > best_driver_for_vehicle.safety_score
                    ):
                        best_driver_for_vehicle = driver

            if best_driver_for_vehicle:
                eligible_pairs.append(
                    (vehicle, best_driver_for_vehicle, approach_km, fuel_cost_dzd)
                )

        if not eligible_pairs:
            return []

        # Normalisation Min-Max des critères pour le calcul du score sur 100
        max_fuel_cost = max(p[3] for p in eligible_pairs) or 1.0
        min_fuel_cost = min(p[3] for p in eligible_pairs)

        results: List[SubstitutionCandidateScore] = []

        for vehicle, driver, approach_km, fuel_cost_dzd in eligible_pairs:
            # 1. Composante Santé Prédictive VHI (0 à 100)
            vhi_norm = vehicle.vehicle_health_index

            # 2. Composante Économie Carburant (0 à 100)
            if max_fuel_cost > min_fuel_cost:
                fuel_norm = (
                    (max_fuel_cost - fuel_cost_dzd) / (max_fuel_cost - min_fuel_cost)
                ) * 100.0
            else:
                fuel_norm = 100.0

            # 3. Composante Proximité / Distance d'approche (0 à 100)
            approach_norm = max(
                0.0, (1.0 - (approach_km / max_approach_distance_km)) * 100.0
            )

            # 4. Composante Équilibrage d'usure du parc (favorise les camions sous-utilisés cette année)
            usage_ratio = vehicle.ytd_driven_km / max(1.0, vehicle.annual_target_km)
            balance_norm = max(0.0, min(100.0, (1.0 - (usage_ratio - 0.5)) * 100.0))

            total_score = (
                cls.WEIGHT_VHI_HEALTH * vhi_norm
                + cls.WEIGHT_FUEL_ECONOMY * fuel_norm
                + cls.WEIGHT_APPROACH_DIST * approach_norm
                + cls.WEIGHT_FLEET_BALANCE * balance_norm
            )

            justification = (
                f"100% Conforme (ENACTA/Assurance/RUL OK pour {mission.target_climate_zone.value}) | "
                f"VHI={vehicle.vehicle_health_index}/100 | "
                f"Approche={approach_km} km | "
                f"Coût Carburant Naftal estimé={fuel_cost_dzd} DZD | "
                f"Chauffeur habilité={driver.full_name} (Score sécurité {driver.safety_score}/100)"
            )

            results.append(
                SubstitutionCandidateScore(
                    vehicle_id=vehicle.vehicle_id,
                    registration_plate=vehicle.registration_plate,
                    make_model=vehicle.make_model,
                    driver_id=driver.driver_id,
                    driver_name=driver.full_name,
                    total_score_100=round(total_score, 2),
                    vhi_score_component=round(vhi_norm, 1),
                    fuel_cost_component=round(fuel_norm, 1),
                    approach_distance_component=round(approach_norm, 1),
                    fleet_balancing_component=round(balance_norm, 1),
                    approach_distance_km=approach_km,
                    estimated_fuel_cost_dzd=fuel_cost_dzd,
                    audit_justification=justification,
                )
            )

        # Tri décroissant par score global
        results.sort(key=lambda x: x.total_score_100, reverse=True)
        return results[:3]
