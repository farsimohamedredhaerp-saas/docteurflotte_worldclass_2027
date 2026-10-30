"""Package de scrapers et extracteurs de données constructeurs (OEM RMI)."""

from .lubematch_olyslager import (
    OlyslagerLubricantPortalScraper,
    ScrapedFluidComponent,
    ScrapedOEMProfile,
)
from .autodoc_schedule import (
    MechanicalReplacementScheduleScraper,
    ScrapedMechanicalTask,
)
from .pdf_manual_ingestor import OEMManualPDFIngestor
from .universal_oem_crawler import (
    ScrapedModelVariant,
    UniversalOEMCrawler,
)

__all__ = [
    "OlyslagerLubricantPortalScraper",
    "ScrapedFluidComponent",
    "ScrapedOEMProfile",
    "MechanicalReplacementScheduleScraper",
    "ScrapedMechanicalTask",
    "OEMManualPDFIngestor",
    "UniversalOEMCrawler",
    "ScrapedModelVariant",
]

