from dataclasses import dataclass
from typing import Dict, Optional, Tuple


@dataclass
class CatalogSearchQuery:
    make: str
    model: str
    engine_code: Optional[str] = None
    year_range: Optional[str] = None
    asset_category: str = "HEAVY_TRUCK"


class CatalogMatcherDZ:
    """Résout une recherche textuelle (Marque, Modèle, Moteur) vers une signature
    technique standardisée lorsque le numéro VIN n'est pas fourni par l'utilisateur.
    """

    # Table de correspondance de repli (Fallback intelligent pour les flottes en Algérie)
    COMMON_PARK_ALIASES: Dict[str, Dict[str, Tuple[str, str, str]]] = {
        "renault trucks": {
            "t480": ("Renault Trucks", "T 480 / K 480", "DTI 13 (12.8L)"),
            "t 480": ("Renault Trucks", "T 480 / K 480", "DTI 13 (12.8L)"),
            "k480": ("Renault Trucks", "T 480 / K 480", "DTI 13 (12.8L)"),
            "k 480": ("Renault Trucks", "T 480 / K 480", "DTI 13 (12.8L)"),
            "kerax": ("Renault Trucks", "Kerax 440 / K 440", "DXi 11 / DTI 11"),
            "master": ("Renault", "Master III", "2.3 dCi M9T"),
        },
        "renault": {
            "kangoo": ("Renault", "Kangoo II / Express", "1.5 dCi 85 / 90 (K9K)"),
            "kangoo 2": ("Renault", "Kangoo II / Express", "1.5 dCi 85 / 90 (K9K)"),
            "kangoo ii": ("Renault", "Kangoo II / Express", "1.5 dCi 85 / 90 (K9K)"),
            "kangoo express": ("Renault", "Kangoo II / Express", "1.5 dCi 85 / 90 (K9K)"),
            "clio": ("Renault", "Clio IV / Clio Campus", "1.5 dCi 85 / 90 (K9K)"),
            "trafic": ("Renault", "Trafic II / III", "1.6 dCi 125 / 2.0 dCi"),
            "master": ("Renault", "Master III", "2.3 dCi M9T 135/150"),
            "mascott": ("Renault", "Mascott DXi", "3.0 DXi"),
        },
        "ranult": {
            "kangoo": ("Renault", "Kangoo II / Express", "1.5 dCi 85 / 90 (K9K)"),
            "kangoo 2": ("Renault", "Kangoo II / Express", "1.5 dCi 85 / 90 (K9K)"),
            "kangoo ii": ("Renault", "Kangoo II / Express", "1.5 dCi 85 / 90 (K9K)"),
            "kangoo express": ("Renault", "Kangoo II / Express", "1.5 dCi 85 / 90 (K9K)"),
            "clio": ("Renault", "Clio IV / Clio Campus", "1.5 dCi 85 / 90 (K9K)"),
            "trafic": ("Renault", "Trafic II / III", "1.6 dCi 125 / 2.0 dCi"),
            "master": ("Renault", "Master III", "2.3 dCi M9T 135/150"),
        },
        "man": {
            "tgs": ("MAN", "TGS 33.440 / 40.440", "D2066 LF (10.5L)"),
            "tgx": ("MAN", "TGX 26.440", "D2676 LF"),
            "cla": ("MAN", "CLA 26.280", "D0836 LFL"),
        },
        "mercedes-benz": {
            "actros": ("Mercedes-Benz", "Actros 2041 / 3344", "OM 501 LA V6 (11.9L)"),
            "atego": ("Mercedes-Benz", "Atego 1518", "OM 904 LA"),
            "sprinter": ("Mercedes-Benz", "Sprinter CDI", "OM 651 / OM 654"),
        },
        "mercedes": {
            "actros": ("Mercedes-Benz", "Actros 2041 / 3344", "OM 501 LA V6 (11.9L)"),
            "atego": ("Mercedes-Benz", "Atego 1518", "OM 904 LA"),
            "sprinter": ("Mercedes-Benz", "Sprinter CDI", "OM 651 / OM 654"),
        },
        "shacman": {
            "x3000": ("Shacman", "X3000 / F3000 6x4", "Weichai WP12.430E201"),
            "f3000": ("Shacman", "X3000 / F3000 6x4", "Weichai WP12.430E201"),
            "f2000": ("Shacman", "F2000 6x4", "Weichai WP10.380"),
        },
        "sinotruk": {
            "howo": ("Sinotruk Howo", "HOWO 371 / A7", "WD615.47 (9.7L)"),
            "a7": ("Sinotruk Howo", "HOWO A7", "D12.42"),
        },
        "snvi": {
            "k66": ("SNVI", "K66 / K120", "Deutz F6L912 (Air-Cooled)"),
            "k120": ("SNVI", "K66 / K120", "Deutz F6L912 (Air-Cooled)"),
            "100v8": ("SNVI", "TC 100 V8", "Deutz F8L413F"),
            "b260": ("SNVI", "Autocar 100 L6", "Cummins 6BT"),
        },
        "isuzu": {
            "npr": ("Isuzu", "NPR 71 / NQR 75", "4HK1-TCN (5.2L)"),
            "nqr": ("Isuzu", "NPR 71 / NQR 75", "4HK1-TCN (5.2L)"),
            "d-max": ("Isuzu", "D-Max Pick-up", "4JK1-TC (2.5L)"),
        },
        "toyota": {
            "hilux": ("Toyota", "Hilux 4x4 Double Cab", "2.4 D-4D (2GD-FTV)"),
            "land cruiser": ("Toyota", "Land Cruiser HZJ79", "1HZ 4.2L"),
            "coaster": ("Toyota", "Coaster Minibus 30-Places", "1HZ 4.2L 6-Cylindres Diesel Atmosphérique"),
            "hiace": ("Toyota", "HiAce Commuter / Fourgon", "2.5 D-4D 102ch (2KD-FTV)"),
        },
        "daf": {
            "xf": ("DAF", "XF 105.460 / XF 460", "PACCAR MX-13 460 (12.9L Euro 5)"),
            "105": ("DAF", "XF 105.460 / XF 460", "PACCAR MX-13 460 (12.9L Euro 5)"),
            "460": ("DAF", "XF 105.460 / XF 460", "PACCAR MX-13 460 (12.9L Euro 5)"),
        },
        "iveco": {
            "daily": ("Iveco", "Daily 35S / 50C", "2.3 HPI 130 / 140 (F1A)"),
            "stralis": ("Iveco", "Stralis 440 / 480 Active Time/Space", "Cursor 13 F3B (12.9L Euro 3/5)"),
            "cursor": ("Iveco", "Stralis 440 / 480 Active Time/Space", "Cursor 13 F3B (12.9L Euro 3/5)"),
        },
        "fuso": {
            "canter": ("Fuso", "Canter 6C15 / 7C15", "4P10-T4 3.0L Common Rail 150ch"),
        },
        "mitsubishi": {
            "l200": ("Mitsubishi", "L200 Double Cabine 4x4", "2.5 DI-D Common Rail 136ch (4D56)"),
            "canter": ("Fuso", "Canter 6C15 / 7C15", "4P10-T4 3.0L Common Rail 150ch"),
        },
        "dfsk": {
            "k01": ("DFSK (Dongfeng Sokon)", "K01 / K02 / C31 Mini-Camion", "DK12 1.2L 16V EFI Essence (88ch)"),
            "k02": ("DFSK (Dongfeng Sokon)", "K01 / K02 / C31 Mini-Camion", "DK12 1.2L 16V EFI Essence (88ch)"),
            "c31": ("DFSK (Dongfeng Sokon)", "K01 / K02 / C31 Mini-Camion", "DK12 1.2L 16V EFI Essence (88ch)"),
            "mini": ("DFSK (Dongfeng Sokon)", "K01 / K02 / C31 Mini-Camion", "DK12 1.2L 16V EFI Essence (88ch)"),
        },
        "volkswagen": {
            "caddy": ("Volkswagen", "Caddy III / IV Maxi", "1.6 TDI 102 (CAYD)"),
            "golf": ("Volkswagen", "Golf VII / Golf VI", "2.0 TDI 110 / 150 (CRBC)"),
            "crafter": ("Volkswagen", "Crafter Grand Fourgon 2.0 TDI", "2.0 TDI BiTurbo 163ch (CKUB)"),
        },
        "hyundai": {
            "hd": ("Hyundai", "HD65 / HD72", "D4DB (3.9L Turbo Intercooler)"),
            "accent": ("Hyundai", "Accent / i20", "1.6 CRDi 128 (D4FB)"),
            "h100": ("Hyundai", "H100 / Porter II", "2.5 CRDi 130 (D4CB)"),
            "county": ("Hyundai", "County Minibus 29-Places", "D4DB (3.9L Turbo Intercooler 130ch)"),
        },
        "komatsu": {
            "pc200": ("Komatsu", "Pelle Hydraulique PC200-8 / PC220-8", "SAA6D107E-1 (6.69L Turbo 150ch)"),
            "pc220": ("Komatsu", "Pelle Hydraulique PC200-8 / PC220-8", "SAA6D107E-1 (6.69L Turbo 150ch)"),
        },
        "sdlg": {
            "lg956": ("SDLG (Shandong Lingong)", "Chargeuse sur Pneus LG956L / LG958L", "Weichai WD10G220E23 (9.7L 220ch)"),
            "lg958": ("SDLG (Shandong Lingong)", "Chargeuse sur Pneus LG956L / LG958L", "Weichai WD10G220E23 (9.7L 220ch)"),
        },
        "liugong": {
            "clg856": ("LiuGong", "Chargeuse sur Pneus CLG856", "Cummins 6CTA8.3 (8.3L Turbo 215ch)"),
            "856": ("LiuGong", "Chargeuse sur Pneus CLG856", "Cummins 6CTA8.3 (8.3L Turbo 215ch)"),
        },
        "peugeot": {
            "partner": ("Peugeot", "Partner / Doblo", "1.6 HDi 92 (DV6DTED)"),
            "boxer": ("Peugeot", "Ducato / Boxer", "2.2 MultiJet3 / HDi 140"),
            "expert": ("Peugeot", "Expert Tepee", "2.0 HDi 130"),
        },
        "fiat": {
            "ducato": ("Fiat", "Ducato / Boxer", "2.2 MultiJet3 / HDi 140"),
            "doblo": ("Fiat", "Partner / Doblo", "1.3 MultiJet 90"),
        },
        "dacia": {
            "duster": ("Dacia", "Duster / Logan", "1.5 dCi (K9K)"),
            "logan": ("Dacia", "Duster / Logan", "1.5 dCi (K9K)"),
        },
        "jcb": {
            "3cx": ("JCB", "Chargeuse-Pelleteuse 3CX / 4CX", "Dieselmax 4.4L 444"),
            "4cx": ("JCB", "Chargeuse-Pelleteuse 3CX / 4CX", "Dieselmax 4.4L 444"),
        },
        "caterpillar": {
            "320": ("Caterpillar", "Pelle Hydraulique 320D", "Cat C6.4 Acert"),
            "966": ("Caterpillar", "Chargeuse 966H", "Cat C11 Acert"),
        },
        "cirta": {
            "c6807": ("Cirta", "Tracteur Agricole C 6807", "Deutz F4L912 (Air-Cooled)"),
            "c135": ("Cirta", "Tracteur Agricole C 135", "Deutz F6L912"),
        },
    }

    @classmethod
    def resolve_by_text(cls, query: CatalogSearchQuery) -> Tuple[str, str, str]:
        # 1. Tentative via le pipeline ETL enrichi
        try:
            from etl import OEMCatalogPipeline
            entry = OEMCatalogPipeline().search_by_text(query.make, query.model)
            if entry:
                return entry.brand.name, entry.model.name, entry.variant.engine_name
        except Exception:
            pass

        clean_make = query.make.strip().lower()
        clean_model = query.model.strip().lower()

        # 2. Recherche dans les alias connus du parc algérien
        for make_key, make_models in cls.COMMON_PARK_ALIASES.items():
            if make_key in clean_make or clean_make in make_key:
                for alias_key, signature in make_models.items():
                    if alias_key in clean_model:
                        return signature

        # 3. Repli générique normalisé si l'alias exact n'est pas trouvé
        resolved_make = query.make.title()
        resolved_model = query.model.title()
        resolved_engine = query.engine_code or "Moteur Standard / Multi-Variantes"
        return resolved_make, resolved_model, resolved_engine

    @classmethod
    def resolve_full_specs(cls, make: str, model: str) -> Optional[Dict]:
        """Résout la totalité des caractéristiques physiques et d'entretien."""
        try:
            from etl import OEMCatalogPipeline
            entry = OEMCatalogPipeline().search_by_text(make, model)
            if entry:
                return {
                    "brand": entry.brand.name,
                    "model": entry.model.name,
                    "category": entry.model.category,
                    "engine_code": entry.variant.engine_code,
                    "engine_name": entry.variant.engine_name,
                    "wmi": entry.variant.wmi_pattern,
                    "ptac_kg": entry.variant.gross_vehicle_weight_kg,
                    "tank_liters": entry.variant.fuel_tank_capacity_liters,
                    "conso_mixed": entry.variant.ref_consumption_mixed_l_100km,
                    "conso_idle_h": entry.variant.ref_idle_consumption_l_hour,
                    "oil_capacity_liters": entry.variant.oil_capacity_liters,
                    "oil_norm_spec": entry.variant.oil_norm_spec,
                    "coolant_liters": entry.variant.coolant_capacity_liters,
                    "tasks_count": len(entry.tasks),
                }
        except Exception:
            pass
        return None

