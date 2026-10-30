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
