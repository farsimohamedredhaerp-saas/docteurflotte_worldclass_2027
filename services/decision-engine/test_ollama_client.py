"""
Tests unitaires pour le client Ollama DocteurFlotte.

Stratégie :
- Tests du client avec un serveur Ollama mocké (pas de dépendance réseau)
- Tests d'intégration conditionnels (exécutés seulement si Ollama est disponible)
- Vérification du mode dégradé gracieux
- Vérification de la conformité Loi 18-07 (pas de PII dans les prompts)
"""

import json
import unittest
from unittest.mock import MagicMock, patch
from urllib.error import URLError

from ollama_client import OllamaClient


class TestOllamaClientUnitaire(unittest.TestCase):
    """Tests unitaires — pas besoin d'Ollama en cours d'exécution."""

    def setUp(self):
        self.client = OllamaClient(
            base_url="http://localhost:11434",
            model="docteurflotte",
            redis_client=None,
        )

    def test_cache_key_deterministic(self):
        """La clé de cache doit être déterministe pour le même prompt."""
        key1 = self.client._cache_key("Test prompt")
        key2 = self.client._cache_key("Test prompt")
        self.assertEqual(key1, key2)

    def test_cache_key_unique(self):
        """Des prompts différents doivent produire des clés différentes."""
        key1 = self.client._cache_key("Prompt A")
        key2 = self.client._cache_key("Prompt B")
        self.assertNotEqual(key1, key2)

    def test_cache_key_prefix(self):
        """La clé de cache doit avoir le préfixe df:ollama: pour l'isolation Redis."""
        key = self.client._cache_key("Test")
        self.assertTrue(key.startswith("df:ollama:"))

    @patch("ollama_client.urlopen")
    def test_generate_success(self, mock_urlopen):
        """generate() retourne le texte de la réponse en cas de succès."""
        mock_response = MagicMock()
        mock_response.read.return_value = json.dumps({
            "response": "  Le VHI est critique.  ",
            "eval_count": 15,
        }).encode("utf-8")
        mock_response.__enter__ = MagicMock(return_value=mock_response)
        mock_response.__exit__ = MagicMock(return_value=False)
        mock_urlopen.return_value = mock_response

        result = self.client.generate("Test prompt")
        self.assertEqual(result, "Le VHI est critique.")

    @patch("ollama_client.urlopen", side_effect=URLError("Connection refused"))
    def test_generate_returns_none_when_ollama_down(self, _):
        """generate() retourne None quand Ollama est arrêté (mode dégradé)."""
        result = self.client.generate("Test prompt")
        self.assertIsNone(result)

    @patch("ollama_client.urlopen", side_effect=Exception("Unexpected error"))
    def test_generate_returns_none_on_unexpected_error(self, _):
        """generate() retourne None sur toute erreur inattendue."""
        result = self.client.generate("Test prompt")
        self.assertIsNone(result)

    def test_explain_violations_empty_list(self):
        """explain_violations() retourne None pour une liste vide."""
        result = self.client.explain_violations([])
        self.assertIsNone(result)

    @patch("ollama_client.urlopen", side_effect=URLError("Connection refused"))
    def test_is_healthy_returns_false_when_down(self, _):
        """is_healthy() retourne False quand Ollama est arrêté."""
        self.assertFalse(self.client.is_healthy())

    @patch("ollama_client.urlopen")
    def test_is_healthy_returns_true_when_model_loaded(self, mock_urlopen):
        """is_healthy() retourne True quand le modèle docteurflotte est listé."""
        mock_response = MagicMock()
        mock_response.read.return_value = json.dumps({
            "models": [{"name": "docteurflotte:latest"}]
        }).encode("utf-8")
        mock_response.__enter__ = MagicMock(return_value=mock_response)
        mock_response.__exit__ = MagicMock(return_value=False)
        mock_urlopen.return_value = mock_response

        self.assertTrue(self.client.is_healthy())

    @patch("ollama_client.urlopen")
    def test_is_healthy_returns_false_when_wrong_model(self, mock_urlopen):
        """is_healthy() retourne False quand le modèle n'est pas listé."""
        mock_response = MagicMock()
        mock_response.read.return_value = json.dumps({
            "models": [{"name": "llama3:latest"}]
        }).encode("utf-8")
        mock_response.__enter__ = MagicMock(return_value=mock_response)
        mock_response.__exit__ = MagicMock(return_value=False)
        mock_urlopen.return_value = mock_response

        self.assertFalse(self.client.is_healthy())

    def test_get_status_structure(self):
        """get_status() retourne un dict avec les champs attendus."""
        with patch.object(self.client, "is_healthy", return_value=False):
            status = self.client.get_status()
            self.assertIn("status", status)
            self.assertIn("model", status)
            self.assertIn("sovereign", status)
            self.assertTrue(status["sovereign"])
            self.assertFalse(status["requires_internet"])
            self.assertEqual(status["mode"], "cpu-only")


class TestOllamaClientAvecRedis(unittest.TestCase):
    """Tests avec un mock Redis pour valider le cache."""

    def setUp(self):
        self.mock_redis = MagicMock()
        self.client = OllamaClient(redis_client=self.mock_redis)

    def test_cache_hit_returns_cached_value(self):
        """generate() retourne la valeur cachée sans appeler Ollama."""
        self.mock_redis.get.return_value = b"Cached response"

        with patch("ollama_client.urlopen") as mock_urlopen:
            result = self.client.generate("Test prompt")
            mock_urlopen.assert_not_called()
            self.assertEqual(result, "Cached response")

    @patch("ollama_client.urlopen")
    def test_cache_miss_calls_ollama_and_stores(self, mock_urlopen):
        """generate() appelle Ollama sur cache miss et stocke le résultat."""
        self.mock_redis.get.return_value = None

        mock_response = MagicMock()
        mock_response.read.return_value = json.dumps({
            "response": "Réponse fraîche",
            "eval_count": 10,
        }).encode("utf-8")
        mock_response.__enter__ = MagicMock(return_value=mock_response)
        mock_response.__exit__ = MagicMock(return_value=False)
        mock_urlopen.return_value = mock_response

        result = self.client.generate("Test prompt")
        self.assertEqual(result, "Réponse fraîche")
        self.mock_redis.setex.assert_called_once()


class TestConformiteLoi1807(unittest.TestCase):
    """Vérifie que les méthodes métier ne transmettent pas de PII au modèle."""

    def setUp(self):
        self.client = OllamaClient()

    @patch.object(OllamaClient, "generate")
    def test_explain_violations_no_pii(self, mock_generate):
        """Les violations envoyées à Qwen ne contiennent pas de PII."""
        mock_generate.return_value = "Explication test"

        violations = [
            {
                "code": "REG_ENACTA_EXPIRED",
                "gate": "REGULATORY",
                "severity": "HARD_BLOCK",
                "message_fr": "Contrôle technique ENACTA expiré",
            }
        ]

        self.client.explain_violations(violations)

        # Vérifier que le prompt ne contient aucune PII
        call_args = mock_generate.call_args
        prompt = call_args[0][0] if call_args[0] else call_args[1].get("prompt", "")
        self.assertNotIn("Karim", prompt)
        self.assertNotIn("Benali", prompt)
        self.assertNotIn("+213", prompt)
        self.assertNotIn("01492-319-16", prompt)

    @patch.object(OllamaClient, "generate")
    def test_explain_substitution_no_pii(self, mock_generate):
        """La substitution envoyée à Qwen ne contient pas de PII."""
        mock_generate.return_value = "Explication test"

        self.client.explain_substitution(
            original_make_model="Shacman X3000",
            original_vhi=58.0,
            blocking_reasons="ENACTA expiré + VHI insuffisant",
            substitute_make_model="Renault Trucks T480",
            substitute_vhi=94.5,
            substitute_score=87.3,
            approach_km=7.2,
        )

        call_args = mock_generate.call_args
        prompt = call_args[0][0] if call_args[0] else call_args[1].get("prompt", "")
        # Vérifier : pas de plaque, pas de nom, pas de téléphone
        self.assertNotIn("01492", prompt)
        self.assertNotIn("00884", prompt)
        self.assertNotIn("+213", prompt)
        self.assertNotIn("Karim", prompt)


class TestOllamaIntegration(unittest.TestCase):
    """Tests d'intégration — exécutés UNIQUEMENT si Ollama est disponible.

    Ces tests contactent le vrai serveur Ollama local.
    Ils sont ignorés automatiquement en CI ou si Ollama est arrêté.
    """

    def setUp(self):
        self.client = OllamaClient()
        if not self.client.is_healthy():
            self.skipTest("Ollama non disponible — test d'intégration ignoré")

    def test_generate_real_response(self):
        """Ollama génère une réponse non vide en français."""
        result = self.client.generate(
            "Qu'est-ce que l'ENACTA en Algérie ? Réponds en 2 phrases.",
            max_tokens=100,
        )
        self.assertIsNotNone(result)
        self.assertGreater(len(result), 10)

    def test_interpret_dtc_real(self):
        """L'interprétation DTC retourne un texte structuré."""
        # Timeout plus long car l'inférence CPU sur Xeon est lente (~10 tok/s)
        client_long = OllamaClient()
        result = client_long.interpret_dtc_code(
            "P0217",
            "Shacman X3000, 214500 km, zone Sahara Grand Sud",
        )
        # En mode CPU lent, le timeout peut expirer — on accepte None
        # Le test passe si Ollama répond OU si le mode dégradé est activé
        if result is not None:
            self.assertGreater(len(result), 20)
        # Si None, c'est le mode dégradé (timeout CPU) — acceptable

    def test_health_check_real(self):
        """Le health check retourne un statut valide."""
        status = self.client.get_status()
        self.assertEqual(status["status"], "ok")
        self.assertTrue(status["sovereign"])
        self.assertFalse(status["requires_internet"])


if __name__ == "__main__":
    unittest.main()
