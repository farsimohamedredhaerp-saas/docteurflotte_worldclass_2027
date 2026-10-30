from dataclasses import dataclass
import importlib
from typing import Any, Dict, Optional, Tuple
import re

Vin: Any = None
try:
    _vininfo_mod = importlib.import_module("vininfo")
    Vin = getattr(_vininfo_mod, "Vin", None)
except Exception:
    Vin = None


@dataclass
class DecodedVehicleSignature:
    vin: str
    wmi: str
    vds: str
    make: str
    model: str
    engine_code: str
    asset_category: str  # LIGHT_VEHICLE, VAN, HEAVY_TRUCK, CONSTRUCTION_EQUIP, AGRI_TRACTOR
    fuel_type: str = "DIESEL"


class AlgerianVINResolver:
    """Décodeur de VIN (17 caractères) adapté au parc roulant en Algérie.

    Identifie la signature technique (Marque, Modèle, Moteur) sans dépendre d'une
    API payante externe.
    """

    # Référentiel des WMI (3 premiers caractères) courants en Algérie
    WMI_MANUFACTURERS: Dict[str, Tuple[str, str]] = {
        "VF1": ("Renault", "VAN"),
        "VF3": ("Peugeot", "VAN"),
        "VF6": ("Renault Trucks", "HEAVY_TRUCK"),
        "VF7": ("Citroën", "VAN"),
        "UU1": ("Dacia", "LIGHT_VEHICLE"),
        "ZFA": ("Fiat", "VAN"),
        "ZFC": ("Iveco", "HEAVY_TRUCK"),
        "WMA": ("MAN", "HEAVY_TRUCK"),
        "WDB": ("Mercedes-Benz", "HEAVY_TRUCK"),
        "WDF": ("Mercedes-Benz", "VAN"),
        "YV2": ("Volvo Trucks", "HEAVY_TRUCK"),
        "YS2": ("Scania", "HEAVY_TRUCK"),
        "LZG": ("Shacman", "HEAVY_TRUCK"),
        "LZZ": ("Sinotruk Howo", "HEAVY_TRUCK"),
        "LJ1": ("JAC Motors", "HEAVY_TRUCK"),
        "VFA": ("SNVI", "HEAVY_TRUCK"),  # Société Nationale des Véhicules Industriels (Algérie)
        "JAA": ("Isuzu", "HEAVY_TRUCK"),
        "KMF": ("Hyundai", "HEAVY_TRUCK"),
        "AHT": ("Toyota", "LIGHT_VEHICLE"),
        "JTF": ("Toyota", "VAN"),
        "JTE": ("Toyota", "BUS"),
        "SLP": ("JCB", "CONSTRUCTION_EQUIP"),
        "XLR": ("DAF", "HEAVY_TRUCK"),
        "TYB": ("Fuso", "HEAVY_TRUCK"),
        "MMC": ("Mitsubishi", "LIGHT_VEHICLE"),
        "LVT": ("DFSK", "LIGHT_VEHICLE"),
        "LFP": ("FAW", "HEAVY_TRUCK"),
        "KM1": ("Komatsu", "CONSTRUCTION_EQUIP"),
        "LDC": ("SDLG", "CONSTRUCTION_EQUIP"),
        "LG1": ("LiuGong", "CONSTRUCTION_EQUIP"),
    }

    # Signatures VDS (Positions 4 à 8 du VIN) vers (Modèle, Code Moteur, Catégorie)
    VDS_SIGNATURES: Dict[Tuple[str, str], Tuple[str, str, str]] = {
        ("VF6", "11G"): ("T 480 / K 480", "DTI 13 (12.8L)", "HEAVY_TRUCK"),
        ("VF6", "24C"): ("Kerax 440 / K 440", "DXi 11 / DTI 11", "HEAVY_TRUCK"),
        ("WMA", "26S"): ("TGS 33.440 / 40.440", "D2066 LF (10.5L)", "HEAVY_TRUCK"),
        ("WDB", "934"): ("Actros 2041 / 3344", "OM 501 LA V6 (11.9L)", "HEAVY_TRUCK"),
        ("LZG", "JL4"): ("X3000 / F3000 6x4", "Weichai WP12.430E201", "HEAVY_TRUCK"),
        ("VFA", "K66"): ("K66 / K120", "Deutz F6L912 (Air-Cooled)", "HEAVY_TRUCK"),
        ("JAA", "NPR"): ("NPR 71 / NQR 75", "4HK1-TCN (5.2L)", "HEAVY_TRUCK"),
        ("KMF", "HD7"): ("HD65 / HD72", "D4DB (3.9L Turbo)", "HEAVY_TRUCK"),
        ("VF1", "MA0"): ("Master III", "2.3 dCi M9T", "VAN"),
        ("ZFA", "250"): ("Ducato / Boxer", "2.2 MultiJet3 / HDi 140", "VAN"),
        ("VF3", "7B9"): ("Partner / Doblo", "1.6 HDi 92 (DV6DTED)", "VAN"),
        ("AHT", "FR2"): ("Hilux 4x4 Double Cab", "2.4 D-4D (2GD-FTV)", "LIGHT_VEHICLE"),
        ("UU1", "HSD"): ("Duster / Logan", "1.5 dCi (K9K)", "LIGHT_VEHICLE"),
        ("XLR", "TE4"): ("XF 105.460 / XF 460", "PACCAR MX-13 460 (12.9L Euro 5)", "HEAVY_TRUCK"),
        ("ZFC", "STR"): ("Stralis 440 / 480 Active Time/Space", "Cursor 13 F3B (12.9L Euro 3/5)", "HEAVY_TRUCK"),
        ("TYB", "FEB"): ("Canter 6C15 / 7C15", "4P10-T4 3.0L Common Rail 150ch", "HEAVY_TRUCK"),
        ("MMC", "KB4"): ("L200 Double Cabine 4x4", "2.5 DI-D Common Rail 136ch (4D56)", "LIGHT_VEHICLE"),
        ("LVT", "K01"): ("K01 / K02 / C31 Mini-Camion", "DK12 1.2L 16V EFI Essence (88ch)", "LIGHT_VEHICLE"),
        ("JTF", "TRH"): ("HiAce Commuter / Fourgon", "2.5 D-4D 102ch (2KD-FTV)", "VAN"),
        ("JTE", "HZB"): ("Coaster Minibus 30-Places", "1HZ 4.2L 6-Cylindres Diesel Atmosphérique", "BUS"),
    }

    @classmethod
    def resolve_vin(cls, vin: str) -> DecodedVehicleSignature:
        clean_vin = re.sub(r"[^A-HJ-NPR-Z0-9]", "", vin.upper())
        if len(clean_vin) != 17:
            raise ValueError(f"VIN invalide ({len(clean_vin)} caractères au lieu de 17) : {vin}")

        wmi = clean_vin[:3]
        vds = clean_vin[3:9]
        vds_prefix = clean_vin[3:6]

        make, default_cat = cls.WMI_MANUFACTURERS.get(wmi, ("Inconnu", "LIGHT_VEHICLE"))

        # Fallback sur la librairie open-source vininfo si le WMI n'est pas dans la table prioritaire
        if make == "Inconnu" and Vin is not None:
            try:
                parsed = Vin(clean_vin)
                if parsed.manufacturer:
                    make = parsed.manufacturer
            except Exception:
                pass

        # Recherche de correspondance exacte sur le préfixe VDS
        if (wmi, vds_prefix) in cls.VDS_SIGNATURES:
            model, engine_code, category = cls.VDS_SIGNATURES[(wmi, vds_prefix)]
        else:
            model = f"Série VDS-{vds[:4]}"
            engine_code = f"STD-{wmi}-{vds[3:5]}"
            category = default_cat

        return DecodedVehicleSignature(
            vin=clean_vin,
            wmi=wmi,
            vds=vds,
            make=make,
            model=model,
            engine_code=engine_code,
            asset_category=category,
            fuel_type="DIESEL",
        )
