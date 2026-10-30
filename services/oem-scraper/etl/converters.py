"""Module de conversion des unités physiques et application des règles de sévérité
climatique pour le marché algérien (Loi 18-07, ENACTA, climats Tell/Sahara).
"""

from typing import Tuple


class UnitConverters:
    """Conversions métriques depuis les formats EPA / UK / US."""

    @staticmethod
    def mpg_to_l_100km(mpg: float) -> float:
        """Convertit US MPG en litres aux 100 kilomètres."""
        if mpg <= 0:
            return 0.0
        return round(235.214583 / mpg, 2)

    @staticmethod
    def gallons_to_liters(gallons: float) -> float:
        """Convertit gallons US en litres."""
        return round(gallons * 3.78541, 1)

    @staticmethod
    def imperial_gallons_to_liters(imp_gallons: float) -> float:
        """Convertit gallons impériaux UK en litres."""
        return round(imp_gallons * 4.54609, 1)

    @staticmethod
    def lbs_to_kg(lbs: float) -> float:
        """Convertit livres (lbs) en kilogrammes (kg)."""
        return round(lbs * 0.45359237, 1)

    @staticmethod
    def hp_to_kw(hp: float) -> float:
        """Convertit puissance en chevaux vapeur (hp/ch) en kilowatts (kW)."""
        return round(hp * 0.745699872, 1)

    @staticmethod
    def kw_to_hp(kw: float) -> float:
        """Convertit puissance en kilowatts (kW) en chevaux vapeur (ch)."""
        return round(kw * 1.34102, 1)


class AlgeriaSeverityMatrix:
    """Calcule les facteurs de sévérité et d'intervalle selon l'exposition opérationnelle en Algérie."""

    ZONE_MULTIPLIERS = {
        "TELL_URBAN": {"interval_ratio": 1.0, "dust_factor": 1.0, "temp_factor": 1.0},
        "HIGH_PLATEAUS": {"interval_ratio": 0.80, "dust_factor": 1.25, "temp_factor": 1.15},
        "SAHARA_EXTREME": {"interval_ratio": 0.60, "dust_factor": 1.50, "temp_factor": 1.40},
    }

    @classmethod
    def compute_severe_intervals(
        cls, normal_km: int, normal_months: int, normal_hours: int, category: str
    ) -> Tuple[int, int, int]:
        """Calcule l'intervalle sévère pour le climat algérien chaud et poussiéreux."""
        # Les poids lourds, engins BTP et matériels agricoles subissent une usure accrue
        ratio = 0.60 if category in ("HEAVY_TRUCK", "CONSTRUCTION", "AGRI_TRACTOR") else 0.70

        sev_km = int(round(normal_km * ratio / 1000.0) * 1000) if normal_km else 0
        sev_months = max(6, int(round(normal_months * ratio))) if normal_months else 0
        sev_hours = int(round(normal_hours * ratio / 50.0) * 50) if normal_hours else 0

        return sev_km, sev_months, sev_hours
