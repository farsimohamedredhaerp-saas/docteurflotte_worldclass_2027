import importlib
import re
from typing import Any, List

pdfplumber: Any = None
try:
    pdfplumber = importlib.import_module("pdfplumber")
except Exception:
    pdfplumber = None

from .autodoc_schedule import MechanicalReplacementScheduleScraper, ScrapedMechanicalTask


class OEMManualPDFIngestor:
    """Extrait automatiquement les tableaux de maintenance périodique depuis les manuels
    constructeurs au format PDF (idéal pour Shacman, Sinotruk, SNVI, JCB, Cirta).
    """

    @staticmethod
    def extract_tasks_from_pdf(pdf_path: str) -> List[ScrapedMechanicalTask]:
        if pdfplumber is None:
            raise RuntimeError("pdfplumber n'est pas disponible dans l'environnement Python actuel.")
        
        extracted_rows_html = ["<table>"]
        with pdfplumber.open(pdf_path) as pdf:
            for page in pdf.pages:
                tables = page.extract_tables()
                if not tables:
                    continue
                for table in tables:
                    for row in table:
                        if not row:
                            continue
                        clean_cells = [re.sub(r"\s+", " ", (cell or "")).strip() for cell in row]
                        if any(clean_cells):
                            row_str = " | ".join(clean_cells)
                            extracted_rows_html.append(f"<tr><td>{row_str}</td></tr>")
        extracted_rows_html.append("</table>")

        synthetic_html = "\n".join(extracted_rows_html)
        return MechanicalReplacementScheduleScraper.parse_schedule_table_html(synthetic_html)

    @staticmethod
    def extract_tasks_from_raw_text_with_ollama(raw_text: str) -> List[ScrapedMechanicalTask]:
        """Extrait les tâches d'un texte brut de manuel OEM en combinant le parseur
        déterministe et le repli JSON Ollama/Qwen2.5 local.
        """
        synthetic_html = f"<table><tr><td>{raw_text}</td></tr></table>"
        tasks = MechanicalReplacementScheduleScraper.parse_schedule_table_html(synthetic_html)
        if tasks:
            return tasks

        try:
            from ollama_oem_extractor import extract_oem_maintenance_plan_local
            plan = extract_oem_maintenance_plan_local(raw_text)
            oil_km = int(plan.get("oil_change_km", 10000))
            oil_months = int(plan.get("oil_change_months", 12))
            belt_km = int(plan.get("timing_belt_km", 80000))
            grade = plan.get("recommended_grade", "5W40")
            return [
                ScrapedMechanicalTask(
                    task_code="ENG_OIL_FILTER",
                    task_name_fr=f"Vidange huile moteur ({grade}) + Filtre à huile",
                    subsystem="ENGINE",
                    normal_interval_km=oil_km,
                    normal_interval_months=oil_months,
                    severe_interval_km=int(oil_km * 0.65),
                    severe_interval_months=max(3, int(oil_months * 0.65)),
                    standard_labor_minutes=45,
                    criticality_weight=1.5,
                ),
                ScrapedMechanicalTask(
                    task_code="TIMING_BELT_KIT",
                    task_name_fr="Remplacement kit courroie de distribution",
                    subsystem="ENGINE",
                    normal_interval_km=belt_km,
                    normal_interval_months=48,
                    severe_interval_km=int(belt_km * 0.65),
                    severe_interval_months=36,
                    standard_labor_minutes=180,
                    criticality_weight=1.5,
                ),
            ]
        except Exception:
            return []
