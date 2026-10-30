"""Générateur d'échéanciers d'entretien constructeur standardisés jusqu'à 200 000 miles (320 000 km)
Inspiré du schéma api-evangelist/vehicle-databases et calibré pour l'environnement opérationnel algérien.
"""

from typing import List
from .models import OEMMaintenanceScheduleItem
from .converters import AlgeriaSeverityMatrix


class ScheduleGenerator:
    """Génère les tâches d'entretien prédictives et préventives par sous-système."""

    @classmethod
    def generate_schedules_for_variant(
        cls, category: str, fuel_type: str = "DIESEL"
    ) -> List[OEMMaintenanceScheduleItem]:
        is_heavy = category in ("HEAVY_TRUCK", "BUS", "CONSTRUCTION", "AGRI_TRACTOR")
        is_construction = category == "CONSTRUCTION"

        tasks: List[OEMMaintenanceScheduleItem] = []

        # 1. MOTEUR & HUILE (Vidange + Filtre à huile)
        n_km = 40000 if is_heavy else 15000
        n_mo = 12
        n_hr = 1000 if is_heavy else 350
        if is_construction:
            n_km = 0
            n_hr = 500
        s_km, s_mo, s_hr = AlgeriaSeverityMatrix.compute_severe_intervals(n_km, n_mo, n_hr, category)

        tasks.append(
            OEMMaintenanceScheduleItem(
                task_code="ENGINE_OIL_AND_FILTER",
                task_name="Vidange huile moteur et remplacement filtre à huile",
                subsystem="ENGINE",
                normal_interval_km=n_km,
                normal_interval_months=n_mo,
                normal_interval_engine_hours=n_hr,
                severe_interval_km=s_km,
                severe_interval_months=s_mo,
                severe_interval_engine_hours=s_hr,
                standard_labor_minutes=60,
                criticality_weight=1.5,
            )
        )

        # 2. FILTRE À CARBURANT & DÉCANTEUR (Crucial pour le gasoil algérien)
        n_km = 30000 if is_heavy else 20000
        n_mo = 12
        n_hr = 800 if is_heavy else 400
        s_km, s_mo, s_hr = AlgeriaSeverityMatrix.compute_severe_intervals(n_km, n_mo, n_hr, category)

        tasks.append(
            OEMMaintenanceScheduleItem(
                task_code="FUEL_FILTER_REPLACE",
                task_name="Remplacement filtre à carburant et purge du préfiltre décanteur d'eau",
                subsystem="FILTERS",
                normal_interval_km=n_km,
                normal_interval_months=n_mo,
                normal_interval_engine_hours=n_hr,
                severe_interval_km=s_km,
                severe_interval_months=s_mo,
                severe_interval_engine_hours=s_hr,
                standard_labor_minutes=45,
                criticality_weight=1.4,
            )
        )

        # 3. FILTRE À AIR (Conditions désertiques / poussières fines)
        n_km = 40000 if is_heavy else 30000
        n_mo = 12
        n_hr = 1000 if is_heavy else 500
        s_km, s_mo, s_hr = AlgeriaSeverityMatrix.compute_severe_intervals(n_km, n_mo, n_hr, category)

        tasks.append(
            OEMMaintenanceScheduleItem(
                task_code="AIR_FILTER_REPLACE",
                task_name="Contrôle / soufflage et remplacement cartouche filtre à air moteur",
                subsystem="FILTERS",
                normal_interval_km=n_km,
                normal_interval_months=n_mo,
                normal_interval_engine_hours=n_hr,
                severe_interval_km=s_km,
                severe_interval_months=s_mo,
                severe_interval_engine_hours=s_hr,
                standard_labor_minutes=30,
                criticality_weight=1.2,
            )
        )

        # 4. SYSTÈME DE FREINAGE (Garnitures / Disques / Plaquettes)
        n_km = 90000 if is_heavy else 45000
        n_mo = 24
        n_hr = 2000 if is_heavy else 1000
        s_km, s_mo, s_hr = AlgeriaSeverityMatrix.compute_severe_intervals(n_km, n_mo, n_hr, category)

        tasks.append(
            OEMMaintenanceScheduleItem(
                task_code="BRAKE_SYSTEM_INSPECTION",
                task_name="Contrôle d'usure des garnitures/plaquettes et purge liquide de frein",
                subsystem="BRAKES",
                normal_interval_km=n_km,
                normal_interval_months=n_mo,
                normal_interval_engine_hours=n_hr,
                severe_interval_km=s_km,
                severe_interval_months=s_mo,
                severe_interval_engine_hours=s_hr,
                standard_labor_minutes=90,
                criticality_weight=1.6,
            )
        )

        # 5. REFROIDISSEMENT & THERMAL MANAGEMENT
        n_km = 120000 if is_heavy else 60000
        n_mo = 24
        n_hr = 3000 if is_heavy else 1500
        s_km, s_mo, s_hr = AlgeriaSeverityMatrix.compute_severe_intervals(n_km, n_mo, n_hr, category)

        tasks.append(
            OEMMaintenanceScheduleItem(
                task_code="COOLANT_FLUSH_THERMOSTAT",
                task_name="Vidange circuit refroidissement, rinçage radiateur et contrôle thermostat",
                subsystem="COOLING",
                normal_interval_km=n_km,
                normal_interval_months=n_mo,
                normal_interval_engine_hours=n_hr,
                severe_interval_km=s_km,
                severe_interval_months=s_mo,
                severe_interval_engine_hours=s_hr,
                standard_labor_minutes=75,
                criticality_weight=1.3,
            )
        )

        # 6. TRANSMISSION & PONTS DIFFÉRENTIELS
        n_km = 100000 if is_heavy else 60000
        n_mo = 36
        n_hr = 2500 if is_heavy else 1200
        s_km, s_mo, s_hr = AlgeriaSeverityMatrix.compute_severe_intervals(n_km, n_mo, n_hr, category)

        tasks.append(
            OEMMaintenanceScheduleItem(
                task_code="GEARBOX_DIFFERENTIAL_OIL",
                task_name="Vidange boîte de vitesses et pont(s) différentiel(s)",
                subsystem="TRANSMISSION",
                normal_interval_km=n_km,
                normal_interval_months=n_mo,
                normal_interval_engine_hours=n_hr,
                severe_interval_km=s_km,
                severe_interval_months=s_mo,
                severe_interval_engine_hours=s_hr,
                standard_labor_minutes=90,
                criticality_weight=1.3,
            )
        )

        return tasks
