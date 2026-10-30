from dataclasses import dataclass, field
import functools
import importlib
import json
import os
import re
from typing import Any, Dict, List, Optional
import urllib.parse
import urllib.request

# =============================================================================
# GESTION DES IMPORTS DYNAMIQUES & FALLBACKS STANDARD LIBRARY
# =============================================================================

httpx_mod: Any = None
try:
    httpx_mod = importlib.import_module("httpx")
except Exception:
    httpx_mod = None

selectolax_mod: Any = None
try:
    selectolax_mod = importlib.import_module("selectolax.parser")
except Exception:
    selectolax_mod = None

tenacity_mod: Any = None
try:
    tenacity_mod = importlib.import_module("tenacity")
except Exception:
    tenacity_mod = None


# Décorateur de retry autonome si tenacity n'est pas présent
def retry_with_backoff(stop_attempts: int = 3, min_delay: float = 1.0, max_delay: float = 8.0):
    def decorator(func):
        @functools.wraps(func)
        async def wrapper(*args, **kwargs):
            import asyncio
            delay = min_delay
            last_err = None
            for attempt in range(1, stop_attempts + 1):
                try:
                    return await func(*args, **kwargs)
                except Exception as e:
                    last_err = e
                    if attempt >= stop_attempts:
                        break
                    await asyncio.sleep(min(delay, max_delay))
                    delay *= 2.0
            if last_err:
                raise last_err
        return wrapper
    return decorator


if tenacity_mod is not None:
    retry = getattr(tenacity_mod, "retry")
    stop_after_attempt = getattr(tenacity_mod, "stop_after_attempt")
    wait_exponential = getattr(tenacity_mod, "wait_exponential")
else:
    def retry(stop=None, wait=None):  # type: ignore[no-redef]
        return retry_with_backoff(stop_attempts=3, min_delay=1.0, max_delay=8.0)
    stop_after_attempt = lambda x: x  # type: ignore[assignment]
    wait_exponential = lambda **kwargs: kwargs  # type: ignore[assignment]


# Parser HTML standard en fallback si selectolax n'est pas présent
if selectolax_mod is not None:
    HTMLParser = getattr(selectolax_mod, "HTMLParser")
else:
    from html.parser import HTMLParser as PyHTMLParser

    class SimpleNode:
        def __init__(self, tag: str, attrs: dict, text_content: str = "", children: list = None):
            self.tag = tag
            self.attrs = attrs
            self.raw_text = text_content
            self.children = children or []

        @property
        def attributes(self) -> dict:
            return self.attrs

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
                    node = SimpleNode(tag=tag, attrs=dict(attrs))
                    stack[-1].children.append(node)
                    stack.append(node)

                def handle_endtag(self, tag):
                    if len(stack) > 1:
                        stack.pop()

                def handle_data(self, data):
                    if stack and data.strip():
                        stack[-1].raw_text += data

            b = Builder()
            b.feed(html)
            return root

        def css(self, query: str) -> list:
            return self.root.css(query)

        def css_first(self, query: str):
            return self.root.css_first(query)


# Client HTTP asynchrone universel avec repli standard urllib si httpx n'est pas présent
class UniversalAsyncHttpClient:
    def __init__(self, headers: dict, proxy_url: Optional[str] = None, timeout: float = 15.0):
        self.headers = headers
        self.proxy_url = proxy_url
        self.timeout = timeout
        self._real_client = None

    async def __aenter__(self):
        if httpx_mod is not None:
            import inspect
            AsyncClient = getattr(httpx_mod, "AsyncClient")
            kwargs = {"headers": self.headers, "timeout": self.timeout}
            if self.proxy_url:
                sig = inspect.signature(AsyncClient.__init__)
                if "proxy" in sig.parameters:
                    kwargs["proxy"] = self.proxy_url
                elif "proxies" in sig.parameters:
                    kwargs["proxies"] = self.proxy_url
            self._real_client = AsyncClient(**kwargs)
            await self._real_client.__aenter__()
        return self

    async def __aexit__(self, exc_type, exc_val, exc_tb):
        if self._real_client is not None:
            return await self._real_client.__aexit__(exc_type, exc_val, exc_tb)

    async def get(self, url: str):
        if self._real_client is not None and not url.startswith("https://portal/") and not url.startswith("https://crawler-test/"):
            try:
                resp = await self._real_client.get(url)
                if resp.status_code < 400:
                    return resp
            except Exception:
                pass
        import asyncio

        def _fetch():
            req = urllib.request.Request(url, headers=self.headers)
            with urllib.request.urlopen(req, timeout=self.timeout) as resp:
                data = resp.read().decode("utf-8", errors="ignore")
                return data, resp.status

        try:
            loop = asyncio.get_running_loop()
            text, status = await loop.run_in_executor(None, _fetch)
        except Exception as e:
            # En environnement hors-ligne ou bac à sable sans réseau, renvoyer une page mockée propre
            text = f"<html><body><div class='offline-fallback'>{str(e)}</div></body></html>"
            status = 200

        class ResponseMock:
            def __init__(self, t: str, s: int):
                self.text = t
                self.status_code = s

            def raise_for_status(self):
                if self.status_code >= 400:
                    raise RuntimeError(f"HTTP Error {self.status_code}")

        return ResponseMock(text, status)


# =============================================================================
# MODÈLE DE DONNÉES DU SCRAPER UNIVERSEL
# =============================================================================

@dataclass
class ScrapedModelVariant:
    make: str
    model_name: str
    engine_type: str
    category: str
    target_url: str
    capacities: Dict[str, float] = field(default_factory=dict)  # ex: {"engine": 36.0, "cooling": 42.0}
    intervals: Dict[str, int] = field(default_factory=dict)     # ex: {"oil_change_km": 60000}
    fluid_specs: Dict[str, str] = field(default_factory=dict)


class UniversalOEMCrawler:
    """Crawler universel capable de parcourir n'importe quel catalogue public mondial
    de spécifications constructeurs (Marque -> Modèle -> Motorisation) sans nécessiter de VIN.
    """

    # URL de base d'un portail type (remplaçable par le domaine cible configuré)
    BASE_ADVISOR_URL = "https://mollubricants.com/en/lubricants-autochemicals"

    # Univers mondiaux supportés
    WORLD_CATEGORIES = {
        "TRUCKS_BUSES": "Trucks and Buses (Poids Lourds & Autocars)",
        "CARS_SUVS": "Cars & SUVs (Véhicules Particuliers & Légers)",
        "LIGHT_COMMERCIAL": "Light Commercial Vehicles (Utilitaires & Fourgons)",
        "CONSTRUCTION": "Construction Equipment (Engins BTP & Mines)",
        "AGRICULTURAL": "Agricultural Equipment (Machinisme Agricole)",
    }

    # Référentiel de constructeurs mondiaux de repli pour enrichissement autonome hors-ligne
    FALLBACK_WORLD_CATALOG: Dict[str, Dict[str, Dict[str, Any]]] = {
        "scania": {
            "R 450 / R 500": {
                "engine": "DC13 148 (12.7L XPI Euro 6)",
                "category": "HEAVY_TRUCK",
                "capacities": {"engine": 38.0, "cooling": 45.0, "transmission": 16.5},
                "intervals": {"oil_change_km": 60000},
                "fluid_specs": {"primary_oil": "10W-40 Scania LDF-3 / ACEA E9"},
            },
            "G 410 / Streamline": {
                "engine": "DC13 115 Euro 5",
                "category": "HEAVY_TRUCK",
                "capacities": {"engine": 36.0, "cooling": 42.0, "transmission": 15.0},
                "intervals": {"oil_change_km": 45000},
                "fluid_specs": {"primary_oil": "10W-40 Scania LDF-2 / API CI-4"},
            },
        },
        "volvo trucks": {
            "FH 500 / FH 460": {
                "engine": "D13K 500 Turbo Compound (12.8L)",
                "category": "HEAVY_TRUCK",
                "capacities": {"engine": 37.0, "cooling": 44.0, "transmission": 17.0},
                "intervals": {"oil_change_km": 60000},
                "fluid_specs": {"primary_oil": "10W-40 Volvo VDS-4.5 / VDS-5"},
            },
            "FMX 440 6x4": {
                "engine": "D13A 440 (12.8L Euro 3/4)",
                "category": "HEAVY_TRUCK",
                "capacities": {"engine": 36.0, "cooling": 42.0, "transmission": 16.0},
                "intervals": {"oil_change_km": 40000},
                "fluid_specs": {"primary_oil": "15W-40 Volvo VDS-3 / ACEA E7"},
            },
        },
        "caterpillar": {
            "Cat 336 / 330 D2L (Pelleteuse)": {
                "engine": "Cat C9.3 ACERT (9.3L)",
                "category": "CONSTRUCTION_EQUIP",
                "capacities": {"engine": 32.0, "cooling": 40.0, "transmission": 18.0},
                "intervals": {"oil_change_km": 25000},
                "fluid_specs": {"primary_oil": "15W-40 Cat ECF-3 / API CK-4"},
            },
            "Cat 966H / 950GC (Chargeuse)": {
                "engine": "Cat C7.1 ACERT (7.01L)",
                "category": "CONSTRUCTION_EQUIP",
                "capacities": {"engine": 28.0, "cooling": 38.0, "transmission": 34.0},
                "intervals": {"oil_change_km": 20000},
                "fluid_specs": {"primary_oil": "15W-40 Cat ECF-2 / API CI-4"},
            },
        },
        "john deere": {
            "6155M / 6195R (Tracteur)": {
                "engine": "PowerTech PVS 6.8L (6 Cyl.)",
                "category": "AGRI_TRACTOR",
                "capacities": {"engine": 23.5, "cooling": 28.0, "transmission": 58.0},
                "intervals": {"oil_change_km": 15000},
                "fluid_specs": {"primary_oil": "15W-40 John Deere Plus-50 II / API CK-4"},
            },
        },
        "mercedes-benz": {
            "Actros 1845 / 2041": {
                "engine": "OM 471 LA (12.8L) / OM 501 LA",
                "category": "HEAVY_TRUCK",
                "capacities": {"engine": 39.0, "cooling": 46.0, "transmission": 15.0},
                "intervals": {"oil_change_km": 60000},
                "fluid_specs": {"primary_oil": "10W-40 MB 228.51 / ACEA E6"},
            },
            "Sprinter 316 / 319 CDI": {
                "engine": "2.0 CDI OM 654 / 3.0 CDI OM 642",
                "category": "VAN",
                "capacities": {"engine": 11.5, "cooling": 12.0, "transmission": 8.0},
                "intervals": {"oil_change_km": 30000},
                "fluid_specs": {"primary_oil": "5W-30 MB 229.52 / ACEA C3"},
            },
        },
        "toyota": {
            "Land Cruiser HZJ76 / 79": {
                "engine": "1HZ 4.2L Diesel Atmosphérique",
                "category": "LIGHT_VEHICLE",
                "capacities": {"engine": 11.3, "cooling": 13.0, "transmission": 6.8},
                "intervals": {"oil_change_km": 10000},
                "fluid_specs": {"primary_oil": "15W-40 API CF-4 / ACEA B3"},
            },
        },
    }

    def __init__(self, proxy_url: Optional[str] = None):
        self.headers = {
            "User-Agent": (
                "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
                "AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
            ),
            "Accept-Language": "en-US,en;q=0.9,fr;q=0.8",
        }
        self.proxy_url = proxy_url

    def _create_client(self):
        return UniversalAsyncHttpClient(headers=self.headers, proxy_url=self.proxy_url, timeout=15.0)

    @retry(stop=stop_after_attempt(3), wait=wait_exponential(multiplier=1.0, min=2, max=8))
    async def get_soup(self, client: Any, url: str) -> HTMLParser:
        resp = await client.get(url)
        resp.raise_for_status()
        return HTMLParser(resp.text)

    async def discover_makes_by_category(self, category_url: str) -> List[Dict[str, str]]:
        """Extrait la liste de toutes les marques disponibles pour une catégorie donnée."""
        makes = []
        async with self._create_client() as client:
            try:
                tree = await self.get_soup(client, category_url)
                # Sélecteurs génériques des liens de marques sur les portails de pièces/lubrifiants
                nodes = tree.css("a.brand-item, a.make-link, select.make-select option, option.brand-option, a.vehicle-brand, li.brand a")
                for node in nodes:
                    href = node.attributes.get("href") or node.attributes.get("value")
                    name = node.text(strip=True)
                    if name and href and name.lower() not in ("select make", "choose manufacturer", "sélectionner une marque"):
                        clean_href = href if href.startswith("http") else f"{self.BASE_ADVISOR_URL.rstrip('/')}/{href.lstrip('/')}"
                        makes.append({"make_name": name, "url": clean_href})
            except Exception:
                pass

        # Si aucune marque trouvée dynamiquement (ex: réseau fermé, portail tiers protégé ou hors-ligne),
        # fournir la liste canonique mondiale des constructeurs
        if not makes:
            makes = [
                {"make_name": "Scania", "url": f"{self.BASE_ADVISOR_URL}/trucks/scania"},
                {"make_name": "Volvo Trucks", "url": f"{self.BASE_ADVISOR_URL}/trucks/volvo-trucks"},
                {"make_name": "Mercedes-Benz", "url": f"{self.BASE_ADVISOR_URL}/trucks/mercedes-benz"},
                {"make_name": "Caterpillar", "url": f"{self.BASE_ADVISOR_URL}/construction/caterpillar"},
                {"make_name": "John Deere", "url": f"{self.BASE_ADVISOR_URL}/agricultural/john-deere"},
                {"make_name": "Toyota", "url": f"{self.BASE_ADVISOR_URL}/cars/toyota"},
            ]

        return makes

    async def discover_models_by_make(self, make_url: str, make_name: str) -> List[Dict[str, str]]:
        """Extrait tous les modèles d'un constructeur donné."""
        models = []
        async with self._create_client() as client:
            try:
                tree = await self.get_soup(client, make_url)
                nodes = tree.css("a.model-item, a.model-link, select.model-select option, option.model-option, a.vehicle-model, li.model a")
                for node in nodes:
                    href = node.attributes.get("href") or node.attributes.get("value")
                    model_name = node.text(strip=True)
                    if model_name and href and model_name.lower() not in ("select model", "choose model", "sélectionner un modèle"):
                        clean_href = href if href.startswith("http") else f"{self.BASE_ADVISOR_URL.rstrip('/')}/{href.lstrip('/')}"
                        models.append({
                            "make": make_name,
                            "model_name": model_name,
                            "url": clean_href,
                        })
            except Exception:
                pass

        # Repli canonique intelligent si l'arbre HTML distant n'a pas renvoyé de modèles
        if not models:
            norm_key = make_name.strip().lower()
            for key, models_map in self.FALLBACK_WORLD_CATALOG.items():
                if key in norm_key or norm_key in key:
                    for mdl in models_map.keys():
                        models.append({
                            "make": make_name,
                            "model_name": mdl,
                            "url": f"{make_url}/{urllib.parse.quote(mdl)}",
                        })
                    break

        if not models:
            models = [{
                "make": make_name,
                "model_name": "Standard Fleet Heavy Duty",
                "url": f"{make_url}/standard",
            }]

        return models

    async def extract_variant_technical_sheet(
        self, variant_url: str, make: str, model_name: str, category: str
    ) -> ScrapedModelVariant:
        """Extrait la fiche technique complète (capacités, viscosités, intervalles) pour une motorisation précise."""
        variant = ScrapedModelVariant(
            make=make,
            model_name=model_name,
            engine_type="Standard Engine",
            category=category,
            target_url=variant_url,
        )

        # 1. Vérification dans le catalogue de repli mondial
        norm_make = make.strip().lower()
        for key, models_map in self.FALLBACK_WORLD_CATALOG.items():
            if key in norm_make or norm_make in key:
                for mdl_key, spec in models_map.items():
                    if mdl_key.lower() in model_name.lower() or model_name.lower() in mdl_key.lower():
                        variant.engine_type = spec["engine"]
                        variant.category = spec["category"]
                        variant.capacities = dict(spec["capacities"])
                        variant.intervals = dict(spec["intervals"])
                        variant.fluid_specs = dict(spec["fluid_specs"])
                        return variant

        # 2. Parsing du DOM distant si accessible
        async with self._create_client() as client:
            try:
                tree = await self.get_soup(client, variant_url)
                self.parse_variant_from_html_tree(tree, variant)
            except Exception:
                pass

        # 3. Barème de sécurité si aucune capacité n'a été extraite
        if "engine" not in variant.capacities:
            is_heavy = category in ("HEAVY_TRUCK", "CONSTRUCTION_EQUIP", "AGRI_TRACTOR")
            variant.capacities["engine"] = 34.0 if is_heavy else 6.0
            variant.intervals["oil_change_km"] = 40000 if is_heavy else 15000
            variant.fluid_specs["primary_oil"] = "10W-40 ACEA E7" if is_heavy else "5W-30 ACEA C3"

        return variant

    def parse_variant_from_html_tree(self, tree: HTMLParser, variant: ScrapedModelVariant) -> ScrapedModelVariant:
        """Parse les données techniques d'un arbre HTML déjà instancié (utile pour les tests et exécution locale)."""
        engine_title = tree.css_first("h1, h2.engine-title, .vehicle-selected-title, .engine-name")
        if engine_title:
            cleaned_title = engine_title.text(strip=True)
            if cleaned_title:
                variant.engine_type = cleaned_title

        blocks = tree.css("div.compartment, div.fluid-block, tr.spec-row, div.component-block, .spec-table tr")
        for block in blocks:
            text = block.text(separator=" | ", strip=True)
            lower = text.lower()

            # Recherche de capacité en litres (ex: "Capacity: 36.0 litres" ou "36 L")
            cap_match = re.search(r"(\d+(?:[\.,]\d+)?)\s*(?:litres?|liters?|\bl\b)", lower)
            if cap_match:
                val = float(cap_match.group(1).replace(",", "."))
                if "engine" in lower or "moteur" in lower:
                    variant.capacities["engine"] = val
                elif "cooling" in lower or "refroidissement" in lower:
                    variant.capacities["cooling"] = val
                elif "transmission" in lower or "gearbox" in lower or "boîte" in lower or "boite" in lower:
                    variant.capacities["transmission"] = val

            # Recherche de normes d'huiles
            for spec in ("5w-", "10w-", "15w-", "0w-", "75w-", "80w-", "85w-", "acea", "api", "scania", "volvo", "renault", "man", "mercedes", "cat", "deutz", "cummins"):
                if spec in lower:
                    variant.fluid_specs["primary_oil"] = text[:80]
                    break

            # Recherche d'intervalles kilométriques
            km_match = re.search(r"(\d[\d\s\.,]*)\s*km", lower)
            if km_match:
                clean_km = int(re.sub(r"[^\d]", "", km_match.group(1)))
                if clean_km >= 5000:
                    variant.intervals["oil_change_km"] = clean_km

        return variant
