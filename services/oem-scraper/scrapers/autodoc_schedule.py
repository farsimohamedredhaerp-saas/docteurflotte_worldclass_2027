from dataclasses import dataclass
import re
from typing import List, Optional

try:
    from selectolax.parser import HTMLParser
except ImportError:
    from .lubematch_olyslager import HTMLParser


@dataclass
class ScrapedMechanicalTask:
    task_code: str
    task_name_fr: str
    subsystem: str
    normal_interval_km: int
    normal_interval_months: int
    severe_interval_km: int
    severe_interval_months: int
    standard_labor_minutes: int
    criticality_weight: float


class MechanicalReplacementScheduleScraper:
    """Parse les grilles publiques d'intervalles de remplacement de pièces d'usure
    (Distribution, Filtres, Freinage, Embrayage) et les traduit dans la nomenclature
    canonique du SaaS.
    """

    PART_NORMALIZATION_RULES = [
        (
            ("timing belt", "courroie de distribution", "kit de distribution"),
            "TIMING_BELT_KIT",
            "Remplacement kit courroie de distribution + galets + pompe à eau",
            "ENGINE",
            180,
            1.50,
        ),
        (
            ("engine oil", "huile moteur", "oil filter", "filtre à huile"),
            "ENG_OIL_FILTER",
            "Vidange huile moteur + remplacement filtre à huile",
            "ENGINE",
            45,
            1.50,
        ),
        (
            ("fuel filter", "filtre à carburant", "filtre à gazole"),
            "FUEL_FILTER_SYSTEM",
            "Remplacement filtre à carburant / séparateur d'eau",
            "FILTRATION",
            40,
            1.40,
        ),
        (
            ("air filter", "filtre à air"),
            "AIR_FILTER_ELEMENT",
            "Remplacement cartouche filtre à air moteur",
            "FILTRATION",
            25,
            1.30,
        ),
        (
            ("brake pad", "plaquettes de frein", "garnitures de frein"),
            "BRAKE_PADS_LININGS",
            "Remplacement plaquettes / garnitures de frein + contrôle disques",
            "BRAKES",
            90,
            1.50,
        ),
        (
            ("coolant", "liquide de refroidissement"),
            "COOLANT_FLUSH",
            "Vidange et purge du circuit de refroidissement",
            "COOLING",
            60,
            1.35,
        ),
    ]

    @classmethod
    def parse_schedule_table_html(cls, html_content: str) -> List[ScrapedMechanicalTask]:
        tree = HTMLParser(html_content)
        tasks: List[ScrapedMechanicalTask] = []
        seen_codes = set()

        for row in tree.css("tr, div.schedule-item, div.interval-row"):
            row_text = row.text(separator=" ", strip=True)
            lower_text = row_text.lower()

            for keywords, code, name_fr, subsys, labor_min, weight in cls.PART_NORMALIZATION_RULES:
                if code in seen_codes:
                    continue
                if any(k in lower_text for k in keywords):
                    # Extraction des kilomètres (ou conversion miles -> km si exprimé en miles)
                    km_val: Optional[int] = None
                    km_match = re.search(r"(\d[\d\s\.,]*)\s*km", lower_text)
                    mi_match = re.search(r"(\d[\d\s\.,]*)\s*mi", lower_text)
                    if km_match:
                        km_val = int(re.sub(r"[^\d]", "", km_match.group(1)))
                    elif mi_match:
                        miles = int(re.sub(r"[^\d]", "", mi_match.group(1)))
                        km_val = int(round((miles * 1.60934) / 5000.0) * 5000)

                    mo_match = re.search(r"(\d+)\s*(?:months?|mois)", lower_text)
                    yr_match = re.search(r"(\d+)\s*(?:years?|ans?)", lower_text)
                    months_val = (
                        int(mo_match.group(1))
                        if mo_match
                        else (int(yr_match.group(1)) * 12 if yr_match else 12)
                    )

                    if km_val and km_val >= 5000:
                        tasks.append(
                            ScrapedMechanicalTask(
                                task_code=code,
                                task_name_fr=name_fr,
                                subsystem=subsys,
                                normal_interval_km=km_val,
                                normal_interval_months=months_val,
                                severe_interval_km=int(km_val * 0.65),
                                severe_interval_months=max(6, int(months_val * 0.65)),
                                standard_labor_minutes=labor_min,
                                criticality_weight=weight,
                            )
                        )
                        seen_codes.add(code)

        return tasks
