"""Script CLI autonome pour exécuter le pipeline ETL et exporter les jeux de données
de référence pour la base PostgreSQL souveraine.
"""

import sys
import os

# Forcer l'encodage UTF-8 sous Windows PowerShell
if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")

# Ajout du répertoire courant au PYTHONPATH
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from etl import OEMCatalogPipeline


def main():
    print("=== DEMARRAGE PIPELINE ETL DOCTEURFLOTTE OEM CATALOG ===")
    pipeline = OEMCatalogPipeline()
    print(f"[OK] Profils consolides charges : {len(pipeline.catalog)} modeles de vehicules")

    # Chemins de sortie
    base_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
    sql_out = os.path.join(base_dir, "database", "seeds", "02_oem_catalog_seed.sql")
    json_out = os.path.join(base_dir, "database", "seeds", "oem_catalog_master.json")

    print(f"-> Generation du script SQL : {sql_out}")
    pipeline.export_sql_seed(sql_out)
    print(f"[OK] Fichier SQL genere ({os.path.getsize(sql_out)} octets)")

    print(f"-> Generation du fichier JSON : {json_out}")
    pipeline.export_json_catalog(json_out)
    print(f"[OK] Fichier JSON genere ({os.path.getsize(json_out)} octets)")

    # Test d'interrogation rapide
    print("\n=== VERIFICATION DES RECHERCHES ===")
    test_vin = "VF611G16000019284"
    match_vin = pipeline.find_by_vin_or_wmi(test_vin)
    if match_vin:
        print(f"[OK] Recherche VIN {test_vin} -> {match_vin.brand.name} {match_vin.model.name} ({match_vin.variant.engine_name})")
    else:
        print(f"[FAIL] Echec recherche VIN {test_vin}")

    match_text = pipeline.search_by_text("Shacman", "X3000")
    if match_text:
        print(f"[OK] Recherche Texte Shacman X3000 -> PTAC: {match_text.variant.gross_vehicle_weight_kg} kg, Reservoirl: {match_text.variant.fuel_tank_capacity_liters} L, Huile: {match_text.variant.oil_capacity_liters} L")
    else:
        print("[FAIL] Echec recherche Texte Shacman X3000")

    print("\n[OK] PIPELINE ETL TERMINE AVEC SUCCES.")


if __name__ == "__main__":
    main()
