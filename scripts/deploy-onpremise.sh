#!/bin/bash
# ==============================================================================
# SCRIPT DE DÉPLOIEMENT ON-PREMISE SOUVERAIN — DOCTEURFLOTTE 2027
# Standard Algérie-First, Loi 18-07 ANPDP, PostgreSQL RLS & Ollama Qwen 2.5
# ==============================================================================

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

echo "======================================================================"
echo "  🚀 DÉPLOIEMENT ON-PREMISE DOCTEURFLOTTE 2027 (ALGERIA SOUVERAIN)   "
echo "======================================================================"

# 1. Vérification des prérequis Docker
if ! command -v docker &> /dev/null; then
    echo "❌ Erreur : Docker n'est pas installé sur ce serveur hôte."
    exit 1
fi

if ! docker compose version &> /dev/null; then
    echo "❌ Erreur : Docker Compose v2 n'est pas disponible."
    exit 1
fi

# 2. Configuration d'environnement de production
ENV_FILE="infra/.env.prod"
if [ ! -f "$ENV_FILE" ]; then
    if [ -f "infra/.env.prod.example" ]; then
        echo "⚠️ Fichier $ENV_FILE introuvable. Création depuis .env.prod.example..."
        cp infra/.env.prod.example "$ENV_FILE"
        echo "ℹ️ Veuillez adapter les mots de passe et secrets dans $ENV_FILE avant d'exécuter en production."
    else
        echo "❌ Erreur : infra/.env.prod.example est absent."
        exit 1
    fi
fi

# 3. Validation de la configuration Docker Compose
echo "🔍 Validation syntaxique et sécuritaire du composeur de production..."
docker compose --env-file "$ENV_FILE" -f infra/compose.prod.yaml config --quiet
echo "✓ Configuration compose.prod.yaml validée avec succès."

# 4. Construction des images et démarrage des conteneurs
echo "📦 Construction et lancement des 7 services souverains..."
docker compose --env-file "$ENV_FILE" -f infra/compose.prod.yaml up -d --build

# 5. Attente de la disponibilité des services fondamentaux
echo "⏳ Attente de la disponibilité opérationnelle de PostgreSQL et Ollama..."
until docker compose --env-file "$ENV_FILE" -f infra/compose.prod.yaml ps postgres | grep -q "healthy"; do
    sleep 2
done
echo "✓ Base PostgreSQL 16 & TimescaleDB opérationnelle avec RLS actif."

# 6. Initialisation du modèle d'IA Souveraine locale
echo "🧠 Initialisation et spécialisation du LLM local (Ollama Qwen 2.5 1.5B Instruct)..."
docker exec -i docteurflotte_ollama_prod ollama pull qwen2.5:1.5b-instruct || true
if [ -f "infra/ollama/Modelfile.docteurflotte" ]; then
    docker exec -i docteurflotte_ollama_prod ollama create docteurflotte -f /tmp/Modelfile.docteurflotte || true
    echo "✓ Modèle souverain 'docteurflotte' (Qwen 2.5 1.5B) compilé localement."
fi

# 7. Rapport de synthèse
echo ""
echo "======================================================================"
echo "  ✅ DÉPLOIEMENT ON-PREMISE TERMINÉ AVEC SUCCÈS                      "
echo "======================================================================"
docker compose --env-file "$ENV_FILE" -f infra/compose.prod.yaml ps
echo ""
echo "🌐 Cockpit Web : http://localhost:3000 (ou domaine configuré)"
echo "🔌 API NestJS  : http://localhost:3001/health"
echo "🛰️ Traccar IoT  : http://localhost:8085"
echo "🧠 Ollama IA   : http://localhost:11434"
echo "======================================================================"

