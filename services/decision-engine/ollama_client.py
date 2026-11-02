"""
Client Ollama souverain pour DocteurFlotte — Intégration locale CPU-only.

Architecture :
- Zéro dépendance externe au-delà de la stdlib Python (urllib)
- Cache Redis optionnel pour éviter les appels redondants
- Timeout strict pour ne pas bloquer les API critiques
- Mode dégradé gracieux : si Ollama est arrêté, le moteur décisionnel
  déterministe continue de fonctionner sans interruption

Conformité Loi 18-07 ANPDP :
- Aucune PII ne transite vers le modèle LLM
- Seuls les codes de violation, métriques techniques et identifiants
  pseudonymisés sont transmis au modèle
"""

import hashlib
import json
import logging
import os
from typing import Optional
from urllib.request import urlopen, Request
from urllib.error import URLError

logger = logging.getLogger("docteurflotte.ollama")

# Configuration par variables d'environnement (ou valeurs par défaut)
OLLAMA_BASE_URL = os.environ.get("OLLAMA_BASE_URL", "http://127.0.0.1:11434")
MODEL_NAME = os.environ.get("OLLAMA_MODEL_NAME", "docteurflotte")
MAX_TOKENS = int(os.environ.get("OLLAMA_MAX_TOKENS", "512"))
TIMEOUT_SECONDS = int(os.environ.get("OLLAMA_TIMEOUT", "60"))
CACHE_TTL = int(os.environ.get("OLLAMA_CACHE_TTL", "3600"))


class OllamaClient:
    """Client léger pour Ollama API REST — CPU-only, offline, souverain.

    Principes de conception :
    - Ne jamais bloquer le pipeline décisionnel
    - Retourner None en cas d'erreur (fail-open pour l'IA, fail-closed pour le métier)
    - Logger les erreurs pour le monitoring sans exposer de PII
    """

    def __init__(
        self,
        base_url: str = OLLAMA_BASE_URL,
        model: str = MODEL_NAME,
        redis_client=None,
    ):
        self.base_url = base_url.rstrip("/")
        self.model = model
        self.redis = redis_client
        self.cache_ttl = CACHE_TTL

    def _cache_key(self, prompt: str) -> str:
        """Clé de cache déterministe basée sur le hash SHA-256 du prompt."""
        return f"df:ollama:{hashlib.sha256(prompt.encode('utf-8')).hexdigest()[:16]}"

    def generate(
        self,
        prompt: str,
        system: Optional[str] = None,
        temperature: float = 0.3,
        max_tokens: int = MAX_TOKENS,
    ) -> Optional[str]:
        """Appel synchrone à Ollama /api/generate.

        Retourne None en cas d'erreur — le moteur décisionnel déterministe
        reste pleinement fonctionnel sans l'enrichissement IA.

        Args:
            prompt: Question ou contexte à soumettre au modèle.
            system: System prompt additionnel (optionnel, le Modelfile en a déjà un).
            temperature: Contrôle la créativité (0.0 = déterministe, 1.0 = créatif).
            max_tokens: Nombre maximal de tokens générés.

        Returns:
            Texte de la réponse, ou None si indisponible.
        """
        # 1. Vérifier le cache Redis (évite de solliciter le CPU inutilement)
        if self.redis:
            cache_key = self._cache_key(prompt)
            try:
                cached = self.redis.get(cache_key)
                if cached:
                    logger.debug("Cache hit Ollama pour clé %s", cache_key[:12])
                    return cached.decode("utf-8") if isinstance(cached, bytes) else cached
            except Exception as e:
                logger.warning("Redis indisponible pour le cache Ollama : %s", e)

        # 2. Construire la requête Ollama
        payload = {
            "model": self.model,
            "prompt": prompt,
            "stream": False,
            "options": {
                "temperature": temperature,
                "num_predict": max_tokens,
                "num_thread": 3,  # Laisser 1 core libre pour le système / PostgreSQL
            },
        }
        if system:
            payload["system"] = system

        try:
            req = Request(
                f"{self.base_url}/api/generate",
                data=json.dumps(payload).encode("utf-8"),
                headers={"Content-Type": "application/json"},
                method="POST",
            )
            with urlopen(req, timeout=TIMEOUT_SECONDS) as resp:
                result = json.loads(resp.read().decode("utf-8"))
                response_text = result.get("response", "").strip()

                # 3. Stocker en cache Redis si disponible
                if self.redis and response_text:
                    try:
                        self.redis.setex(cache_key, self.cache_ttl, response_text)
                    except Exception as e:
                        logger.warning("Impossible de cacher la réponse Ollama : %s", e)

                logger.info(
                    "Ollama réponse générée (%d tokens, modèle=%s)",
                    result.get("eval_count", 0),
                    self.model,
                )
                return response_text

        except URLError as e:
            logger.warning("Ollama indisponible (mode dégradé actif) : %s", e)
            return None
        except json.JSONDecodeError as e:
            logger.error("Réponse Ollama mal formée : %s", e)
            return None
        except Exception as e:
            logger.error("Erreur Ollama inattendue : %s", e)
            return None

    # ──────────────────────────────────────────────────────────────────────────
    # Méthodes métier spécialisées DocteurFlotte
    # ──────────────────────────────────────────────────────────────────────────

    def explain_violations(self, violations: list) -> Optional[str]:
        """Génère une explication en langage naturel des violations détectées.

        Destinée au chef de parc algérien. Le moteur réglementaire/prédictif
        a déjà identifié les violations ; Qwen les rend lisibles et actionnables.

        Conformité Loi 18-07 : seuls les codes violations et métriques
        transitent — aucune PII (nom, plaque, téléphone).

        Args:
            violations: Liste de dicts avec 'code', 'gate', 'severity', 'message_fr'.

        Returns:
            Texte explicatif structuré en français, ou None.
        """
        if not violations:
            return None

        # Construire un prompt structuré SANS données personnelles
        violation_lines = []
        for v in violations:
            code = v.get("code", "INCONNU")
            gate = v.get("gate", "")
            severity = v.get("severity", "")
            message = v.get("message_fr", "")
            violation_lines.append(f"- [{code}] {gate} | {severity} : {message}")

        violation_text = "\n".join(violation_lines)

        prompt = (
            "Analyse ces violations détectées sur un véhicule avant départ mission :\n\n"
            f"{violation_text}\n\n"
            "Pour chaque violation :\n"
            "1. Explique le risque concret (sécurité routière, réglementaire, financier en DZD)\n"
            "2. Indique l'action corrective prioritaire avec son urgence\n"
            "3. Estime le coût d'inaction (immobilisation, amende, casse mécanique)\n\n"
            "Réponds de manière concise et structurée pour un chef de parc algérien."
        )

        return self.generate(prompt)

    def explain_substitution(
        self,
        original_make_model: str,
        original_vhi: float,
        blocking_reasons: str,
        substitute_make_model: str,
        substitute_vhi: float,
        substitute_score: float,
        approach_km: float,
    ) -> Optional[str]:
        """Explique pourquoi un véhicule de substitution a été choisi (XAI).

        Fournit une justification explicable pour le décideur, conformément
        au pilier d'Explicabilité Algorithmique de la plateforme.

        Conformité Loi 18-07 : aucune plaque, nom ou identifiant nominal
        ne transite — uniquement le modèle du véhicule et les métriques.
        """
        prompt = (
            "Le moteur décisionnel a remplacé automatiquement le véhicule demandé.\n\n"
            "Véhicule demandé (BLOQUÉ) :\n"
            f"- Modèle : {original_make_model}\n"
            f"- VHI : {original_vhi}/100\n"
            f"- Raisons du blocage : {blocking_reasons}\n\n"
            "Véhicule de substitution (ASSIGNÉ) :\n"
            f"- Modèle : {substitute_make_model}\n"
            f"- VHI : {substitute_vhi}/100\n"
            f"- Score multicritère : {substitute_score}/100\n"
            f"- Distance d'approche : {approach_km} km\n\n"
            "Explique au chef de parc pourquoi ce choix est optimal, en mentionnant "
            "les économies en DZD et la réduction du risque opérationnel."
        )

        return self.generate(prompt)

    def interpret_dtc_code(
        self,
        dtc_code: str,
        vehicle_context: str = "",
    ) -> Optional[str]:
        """Interprète un code défaut DTC/J1939 pour un mécanicien algérien.

        Le contexte véhicule ne doit contenir que le modèle, le kilométrage
        et la zone climatique — jamais de PII.

        Args:
            dtc_code: Code défaut (ex: "P0217", "SPN 110 FMI 0").
            vehicle_context: Contexte anonymisé (ex: "Shacman X3000, 214500 km, zone Sahara").

        Returns:
            Interprétation structurée en français, ou None.
        """
        prompt = (
            f"Code défaut détecté : {dtc_code}\n"
            f"Contexte véhicule : {vehicle_context or 'Non spécifié'}\n\n"
            "Explique :\n"
            "1. Ce que signifie ce code défaut\n"
            "2. Les causes probables (adaptées au contexte algérien : chaleur extrême, "
            "poussière saharienne, qualité variable du gasoil)\n"
            "3. La procédure de diagnostic à suivre par le mécanicien\n"
            "4. Les pièces potentiellement concernées et l'urgence de l'intervention"
        )

        return self.generate(prompt)

    def generate_work_order_description(
        self,
        wo_title: str,
        tasks: list,
        priority: str,
        vehicle_model: str = "",
    ) -> Optional[str]:
        """Rédige une description enrichie d'ordre de travail pour l'atelier.

        Args:
            wo_title: Titre de l'OT (ex: "Vidange + Filtres Moteur").
            tasks: Liste des tâches à effectuer.
            priority: Niveau d'urgence (URGENT, HIGH, MEDIUM).
            vehicle_model: Modèle du véhicule (sans plaque).

        Returns:
            Description structurée pour le mécanicien, ou None.
        """
        tasks_text = "\n".join(f"- {t}" for t in tasks) if tasks else "- Aucune tâche spécifiée"

        prompt = (
            f"Rédige les instructions de maintenance pour cet ordre de travail :\n\n"
            f"Titre : {wo_title}\n"
            f"Priorité : {priority}\n"
            f"Véhicule : {vehicle_model or 'Non spécifié'}\n"
            f"Tâches prévues :\n{tasks_text}\n\n"
            "Rédige des instructions claires et séquentielles pour un mécanicien "
            "d'atelier algérien, incluant les points de contrôle et les spécifications "
            "techniques essentielles."
        )

        return self.generate(prompt)

    def summarize_daily_events(self, events_summary: str) -> Optional[str]:
        """Résume les événements quotidiens de la flotte pour le directeur.

        Args:
            events_summary: Résumé structuré des événements (anonymisé).

        Returns:
            Paragraphe de synthèse en français, ou None.
        """
        prompt = (
            "Résume ces événements de la journée pour le directeur de flotte :\n\n"
            f"{events_summary}\n\n"
            "Rédige un résumé exécutif concis (5-8 lignes) mettant en avant :\n"
            "1. Les alertes critiques nécessitant une décision immédiate\n"
            "2. Les performances opérationnelles (missions réalisées, taux de disponibilité)\n"
            "3. Les économies réalisées ou les surcoûts identifiés en DZD\n"
            "4. Les actions prioritaires pour le lendemain"
        )

        return self.generate(prompt)

    # ──────────────────────────────────────────────────────────────────────────
    # Santé et diagnostic
    # ──────────────────────────────────────────────────────────────────────────

    def is_healthy(self) -> bool:
        """Vérifie qu'Ollama est joignable et que le modèle est disponible.

        Utilisé par le health check et pour décider si l'enrichissement IA
        est activé ou si on reste en mode déterministe pur.
        """
        try:
            req = Request(f"{self.base_url}/api/tags", method="GET")
            with urlopen(req, timeout=5) as resp:
                data = json.loads(resp.read().decode("utf-8"))
                models = [m.get("name", "") for m in data.get("models", [])]
                return any(self.model in m for m in models)
        except Exception:
            return False

    def get_status(self) -> dict:
        """Retourne l'état détaillé du service IA local.

        Utilisé par le dashboard d'administration pour afficher le statut
        de la couche IA souveraine.
        """
        healthy = self.is_healthy()
        return {
            "status": "ok" if healthy else "degraded",
            "model": f"{self.model} (qwen2.5:1.5b-instruct)",
            "mode": "cpu-only",
            "base_url": self.base_url,
            "sovereign": True,
            "requires_internet": False,
            "cache_enabled": self.redis is not None,
        }
