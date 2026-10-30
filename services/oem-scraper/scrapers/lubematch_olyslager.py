from dataclasses import dataclass, field
import re
from typing import Dict, List, Optional
import urllib.request

try:
    from selectolax.parser import HTMLParser, Node
except ImportError:
    # Fallback parser utilisant la bibliothèque standard lorsque selectolax n'est pas installé
    from html.parser import HTMLParser as PyHTMLParser

    class SimpleNode:
        def __init__(self, tag: str, attrs: dict, text_content: str = "", children: list = None):
            self.tag = tag
            self.attrs = attrs
            self.raw_text = text_content
            self.children = children or []

        def text(self, separator: str = " ", strip: bool = True) -> str:
            collected = []
            if self.raw_text:
                collected.append(self.raw_text)
            for child in self.children:
                child_text = child.text(separator=separator, strip=strip)
                if child_text:
                    collected.append(child_text)
            res = separator.join(collected)
            return res.strip() if strip else res

        def css(self, query: str) -> list:
            results = []
            targets = [q.strip().lower() for q in query.split(",")]
            for child in self.children:
                classes = self._get_classes(child)
                matched = False
                for target in targets:
                    if target.startswith("."):
                        if target[1:] in classes:
                            matched = True
                            break
                    elif "." in target:
                        t_tag, t_cls = target.split(".", 1)
                        if child.tag == t_tag and t_cls in classes:
                            matched = True
                            break
                    elif child.tag == target:
                        matched = True
                        break
                if matched:
                    results.append(child)
                results.extend(child.css(query))
            return results

        def css_first(self, query: str):
            res = self.css(query)
            return res[0] if res else None

        @staticmethod
        def _get_classes(node) -> set:
            cls_attr = node.attrs.get("class", "")
            return set(cls_attr.split())

    class HTMLParser:  # type: ignore[no-redef]
        def __init__(self, html: str):
            self.html = html
            self.root = self._parse(html)

        def _parse(self, html: str) -> SimpleNode:
            root = SimpleNode(tag="root", attrs={})
            stack = [root]

            class Builder(PyHTMLParser):
                def handle_starttag(self, tag, attrs):
                    node = SimpleNode(tag=tag.lower(), attrs=dict(attrs))
                    stack[-1].children.append(node)
                    stack.append(node)

                def handle_endtag(self, tag):
                    if len(stack) > 1 and stack[-1].tag == tag.lower():
                        stack.pop()

                def handle_data(self, data):
                    if stack:
                        stack[-1].raw_text += data

            builder = Builder()
            builder.feed(html)
            return root

        def css(self, query: str) -> list:
            return self.root.css(query)

        def css_first(self, query: str):
            return self.root.css_first(query)

try:
    from tenacity import retry, stop_after_attempt, wait_exponential
except ImportError:
    def retry(*args, **kwargs):  # type: ignore[no-redef]
        def decorator(f):
            return f
        return decorator
    stop_after_attempt = lambda x: x  # type: ignore[assignment]
    wait_exponential = lambda **kwargs: None  # type: ignore[assignment]

try:
    import httpx
except ImportError:
    httpx = None


@dataclass
class ScrapedFluidComponent:
    subsystem_name: str       # ex: "Engine", "Transmission, automatic", "Cooling system", "Hydraulic system"
    canonical_subsystem: str  # ENGINE, TRANSMISSION, COOLING, BRAKES, HYDRAULICS, FILTRATION
    capacity_liters: Optional[float] = None
    fluid_specification: Optional[str] = None
    normal_km: Optional[int] = None
    normal_months: Optional[int] = None
    normal_hours: Optional[int] = None
    severe_km: Optional[int] = None
    severe_months: Optional[int] = None
    severe_hours: Optional[int] = None


@dataclass
class ScrapedOEMProfile:
    make: str
    model: str
    engine_code: str
    asset_category: str
    source_url: str
    components: List[ScrapedFluidComponent] = field(default_factory=list)


class OlyslagerLubricantPortalScraper:
    """Extracteur asynchrone pour les portails publics de préconisation constructeur
    (architecture Olyslager / Kroon-Oil / Liqui-Moly / Motul).
    Récupère les capacités exactes (en litres), les normes d'huiles et les intervalles
    d'entretien en Usage Normal et Usage Sévère (Km, Mois, Heures Moteur).
    """

    SUBSYSTEM_MAP: Dict[str, str] = {
        "engine": "ENGINE",
        "moteur": "ENGINE",
        "transaxle": "TRANSMISSION",
        "transmission": "TRANSMISSION",
        "gearbox": "TRANSMISSION",
        "boîte": "TRANSMISSION",
        "differential": "TRANSMISSION",
        "pont": "TRANSMISSION",
        "cooling": "COOLING",
        "refroidissement": "COOLING",
        "brake": "BRAKES",
        "frein": "BRAKES",
        "hydraulic": "HYDRAULICS",
        "hydraulique": "HYDRAULICS",
        "power take-off": "HYDRAULICS",
    }

    # Expressions régulières de parsing d'intervalles multilingues (FR / EN)
    RE_KM = re.compile(r"(\d[\d\s\.,]*)\s*km", re.IGNORECASE)
    RE_MONTHS = re.compile(r"(\d+)\s*(?:months?|mois)", re.IGNORECASE)
    RE_YEARS = re.compile(r"(\d+)\s*(?:years?|ans?)", re.IGNORECASE)
    RE_HOURS = re.compile(r"(\d[\d\s\.,]*)\s*(?:hours?|heures?|h\b)", re.IGNORECASE)
    RE_CAPACITY = re.compile(r"(\d+(?:[\.,]\d+)?)\s*(?:litres?|liters?|l\b)", re.IGNORECASE)

    def __init__(self, proxy_url: Optional[str] = None):
        self.headers = {
            "User-Agent": (
                "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 "
                "(KHTML, like Gecko) Chrome/129.0.0.0 Safari/537.36"
            ),
            "Accept-Language": "fr-FR,fr;q=0.9,en-US;q=0.8,en;q=0.7",
        }
        self.proxy_url = proxy_url

    @classmethod
    def parse_interval_string(cls, text: str) -> Dict[str, Optional[int]]:
        """Extrait les kilomètres, les mois et les heures moteur depuis une chaîne brute OEM."""
        result: Dict[str, Optional[int]] = {"km": None, "months": None, "hours": None}
        if not text:
            return result

        km_match = cls.RE_KM.search(text)
        if km_match:
            clean_num = re.sub(r"[^\d]", "", km_match.group(1))
            if clean_num:
                result["km"] = int(clean_num)

        mo_match = cls.RE_MONTHS.search(text)
        if mo_match:
            result["months"] = int(mo_match.group(1))
        else:
            yr_match = cls.RE_YEARS.search(text)
            if yr_match:
                result["months"] = int(yr_match.group(1)) * 12

        hr_match = cls.RE_HOURS.search(text)
        if hr_match:
            clean_hr = re.sub(r"[^\d]", "", hr_match.group(1))
            if clean_hr:
                result["hours"] = int(clean_hr)

        return result

    @classmethod
    def map_subsystem(cls, raw_title: str) -> str:
        lower = raw_title.lower()
        for key, val in cls.SUBSYSTEM_MAP.items():
            if key in lower:
                return val
        return "ENGINE"

    @retry(stop=stop_after_attempt(3), wait=wait_exponential(multiplier=1.5, min=2, max=10))
    async def fetch_html(self, url: str) -> str:
        if httpx is not None:
            async with httpx.AsyncClient(
                headers=self.headers, proxy=self.proxy_url, timeout=20.0, follow_redirects=True
            ) as client:
                resp = await client.get(url)
                resp.raise_for_status()
                return resp.text
        else:
            req = urllib.request.Request(url, headers=self.headers)
            with urllib.request.urlopen(req, timeout=20.0) as response:
                return response.read().decode("utf-8", errors="ignore")

    def parse_advice_page_html(
        self,
        html_content: str,
        make: str,
        model: str,
        engine_code: str,
        asset_category: str,
        source_url: str,
    ) -> ScrapedOEMProfile:
        """Parse le DOM d'une fiche de préconisation constructeur et normalise chaque organe."""
        tree = HTMLParser(html_content)
        profile = ScrapedOEMProfile(
            make=make,
            model=model,
            engine_code=engine_code,
            asset_category=asset_category,
            source_url=source_url,
        )

        # Sélection des blocs d'organes (compatible structure standard des portails d'huiles)
        blocks = tree.css("div.component-block, section.compartment, div.accordion-item")
        for block in blocks:
            title_node = block.css_first("h2, h3, .component-title, .accordion-header")
            if not title_node:
                continue
            raw_title = title_node.text(strip=True)
            canonical_sub = self.map_subsystem(raw_title)

            block_text = block.text(separator=" | ", strip=True)

            # Extraction de la capacité en litres
            cap_liters = None
            cap_match = self.RE_CAPACITY.search(block_text)
            if cap_match:
                cap_liters = float(cap_match.group(1).replace(",", "."))

            # Extraction des lignes d'intervalles Normal vs Sévère
            normal_vals = {"km": None, "months": None, "hours": None}
            severe_vals = {"km": None, "months": None, "hours": None}
            fluid_spec = None

            for li in block.css("li, p, tr"):
                line = li.text(separator=" ", strip=True)
                lower_line = line.lower()
                if any(w in lower_line for w in ("severe", "sévère", "intensif", "arduous", "dust")):
                    severe_vals = self.parse_interval_string(line)
                elif any(w in lower_line for w in ("change", "remplacer", "vidange", "normal")):
                    if normal_vals["km"] is None and normal_vals["hours"] is None:
                        normal_vals = self.parse_interval_string(line)
                if any(spec in line for spec in ("5W-", "10W-", "15W-", "0W-", "75W-", "ACEA", "API", "ISO VG")):
                    fluid_spec = line[:80]

            # Règle de repli industrielle si l'intervalle Sévère n'est pas explicite sur l'organe :
            # Application d'un ratio constructeur standard de 0.50 (Poids Lourd/Sahara) à 0.65 (VUL)
            ratio = 0.50 if asset_category in ("HEAVY_TRUCK", "CONSTRUCTION_EQUIP", "AGRI_TRACTOR") else 0.65
            sev_km = severe_vals["km"] or (int(normal_vals["km"] * ratio) if normal_vals["km"] else None)
            sev_mo = severe_vals["months"] or (max(3, int(normal_vals["months"] * ratio)) if normal_vals["months"] else None)
            sev_hr = severe_vals["hours"] or (int(normal_vals["hours"] * ratio) if normal_vals["hours"] else None)

            profile.components.append(
                ScrapedFluidComponent(
                    subsystem_name=raw_title,
                    canonical_subsystem=canonical_sub,
                    capacity_liters=cap_liters,
                    fluid_specification=fluid_spec,
                    normal_km=normal_vals["km"],
                    normal_months=normal_vals["months"],
                    normal_hours=normal_vals["hours"],
                    severe_km=sev_km,
                    severe_months=sev_mo,
                    severe_hours=sev_hr,
                )
            )

        return profile
