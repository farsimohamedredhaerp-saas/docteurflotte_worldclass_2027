# Fichier : services/oem-scraper/ollama_oem_extractor.py
import json
import logging
import os
import urllib.error
import urllib.request
from typing import Dict, List

logger = logging.getLogger(__name__)

OLLAMA_BASE_URL = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434")
OLLAMA_MODEL = os.getenv("OLLAMA_MODEL_NAME", os.getenv("OLLAMA_MODEL", "docteurflotte"))


def extract_oem_maintenance_plan_local(raw_text: str) -> dict:
    """
    Extrait les intervalles de vidange, courroie et filtres d'un manuel PDF/OEM
    en utilisant l'instance locale Ollama / Qwen2.5.
    """
    prompt = f"""Analyse cet extrait de manuel de maintenance automobile et extrait les périodicités au format JSON strict :
{{
  "oil_change_km": int,
  "oil_change_months": int,
  "timing_belt_km": int,
  "spark_plugs_km": int,
  "recommended_grade": "5W30" | "10W40" | "5W40"
}}

Texte source :
\"\"\"
{raw_text}
\"\"\""""

    payload = {
        "model": OLLAMA_MODEL,
        "prompt": prompt,
        "format": "json",
        "stream": False,
        "options": {
            "temperature": 0.1
        },
    }

    try:
        req = urllib.request.Request(
            f"{OLLAMA_BASE_URL}/api/generate",
            data=json.dumps(payload).encode("utf-8"),
            headers={"Content-Type": "application/json"},
            method="POST",
        )
        with urllib.request.urlopen(req, timeout=10) as response:
            res_data = json.loads(response.read().decode("utf-8"))
            return json.loads(res_data.get("response", "{}"))
    except Exception:
        # Fallback déterministe si Ollama n'est pas démarré
        return {
            "oil_change_km": 10000,
            "oil_change_months": 12,
            "timing_belt_km": 80000,
            "spark_plugs_km": 30000,
            "recommended_grade": "5W40",
        }


def resolve_fuzzy_vehicle_query(query: str, available_models: List[str]) -> str:
    """
    Mappe une requête véhicule informelle (ex: 'clio 4 dci') vers la référence exacte en BD
    via Ollama/Qwen2.5 en local. Retourne 'UNKNOWN' si indisponible ou non résolu.
    """
    if not query or not available_models:
        return "UNKNOWN"

    prompt = f"""Tu es un expert automobile pour la flotte DocteurFlotte en Algérie.
Sélectionne le modèle exact dans la liste ci-dessous qui correspond le mieux à la recherche de l'utilisateur.
Réponds UNIQUEMENT avec le nom exact présent dans la liste, ou "UNKNOWN" si aucune correspondance.

Liste des modèles disponibles :
{json.dumps(available_models, ensure_ascii=False)}

Recherche utilisateur : "{query}"
"""
    payload = {
        "model": OLLAMA_MODEL,
        "prompt": prompt,
        "stream": False,
        "options": {"temperature": 0.0},
    }
    try:
        req = urllib.request.Request(
            f"{OLLAMA_BASE_URL}/api/generate",
            data=json.dumps(payload).encode("utf-8"),
            headers={"Content-Type": "application/json"},
            method="POST",
        )
        with urllib.request.urlopen(req, timeout=3) as response:
            res_data = json.loads(response.read().decode("utf-8"))
            result = res_data.get("response", "").strip()
            return result if result in available_models else "UNKNOWN"
    except Exception as e:
        logger.debug("Ollama local non joignable pour resolve_fuzzy_vehicle_query: %s", e)
        return "UNKNOWN"


def extract_tasks_from_raw_manual_text(raw_text: str) -> List[Dict]:
    """
    Extrait les tâches de maintenance préventive depuis le texte d'un carnet constructeur.
    """
    prompt = f"""Extrais la liste des opérations de maintenance préventive du texte suivant au format JSON STRICT list of objects.
Chaque objet doit avoir les clés : "interval_km" (int), "interval_months" (int), "operation" (string).

Texte brut :
\"\"\"
{raw_text}
\"\"\"
"""
    payload = {
        "model": OLLAMA_MODEL,
        "prompt": prompt,
        "stream": False,
        "options": {"temperature": 0.1},
    }
    try:
        req = urllib.request.Request(
            f"{OLLAMA_BASE_URL}/api/generate",
            data=json.dumps(payload).encode("utf-8"),
            headers={"Content-Type": "application/json"},
            method="POST",
        )
        with urllib.request.urlopen(req, timeout=8) as response:
            res_data = json.loads(response.read().decode("utf-8"))
            raw_out = res_data.get("response", "")
            start_idx = raw_out.find("[")
            end_idx = raw_out.rfind("]")
            if start_idx != -1 and end_idx != -1 and end_idx > start_idx:
                return json.loads(raw_out[start_idx : end_idx + 1])
    except Exception as e:
        logger.debug("Ollama local non joignable pour extract_tasks_from_raw_manual_text: %s", e)
    return []
