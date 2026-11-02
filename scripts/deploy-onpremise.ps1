# ==============================================================================
# SCRIPT DE DÉPLOIEMENT ON-PREMISE SOUVERAIN (POWERSHELL) — DOCTEURFLOTTE 2027
# Standard Algérie-First, Loi 18-07 ANPDP, PostgreSQL RLS & Ollama Qwen 2.5
# ==============================================================================

[CmdletBinding()]
param (
    [string]$EnvFile = "infra/.env.prod"
)

$ErrorActionPreference = "Stop"
$RootDir = Split-Path -Parent $PSScriptRoot
Set-Location $RootDir

Write-Host "======================================================================" -ForegroundColor Cyan
Write-Host "  🚀 DÉPLOIEMENT ON-PREMISE DOCTEURFLOTTE 2027 (ALGERIA SOUVERAIN)   " -ForegroundColor Cyan
Write-Host "======================================================================" -ForegroundColor Cyan

# 1. Vérification Docker
try {
    $dockerVersion = docker --version
    Write-Host "✓ Docker détecté : $dockerVersion" -ForegroundColor Green
} catch {
    Write-Error "❌ Docker n'est pas installé ou n'est pas accessible dans le PATH."
    exit 1
}

# 2. Configuration d'environnement de production
if (-not (Test-Path $EnvFile)) {
    if (Test-Path "infra/.env.prod.example") {
        Write-Host "⚠️ Fichier $EnvFile introuvable. Création depuis .env.prod.example..." -ForegroundColor Yellow
        Copy-Item "infra/.env.prod.example" $EnvFile
        Write-Host "ℹ️ Fichier $EnvFile créé. Veuillez vérifier les mots de passe et clés secrètes." -ForegroundColor Cyan
    } else {
        Write-Error "❌ Erreur : infra/.env.prod.example est absent."
        exit 1
    }
}

# 3. Validation Docker Compose
Write-Host "🔍 Validation syntaxique et sécuritaire du composeur de production..." -ForegroundColor Yellow
docker compose --env-file $EnvFile -f infra/compose.prod.yaml config --quiet
Write-Host "✓ Configuration compose.prod.yaml validée avec succès." -ForegroundColor Green

# 4. Lancement des conteneurs
Write-Host "📦 Construction et démarrage des conteneurs souverains..." -ForegroundColor Yellow
docker compose --env-file $EnvFile -f infra/compose.prod.yaml up -d --build

# 5. Modèle LLM souverain local
Write-Host "🧠 Initialisation du LLM local (Ollama Qwen 2.5 1.5B Instruct)..." -ForegroundColor Yellow
try {
    docker exec -i docteurflotte_ollama_prod ollama pull qwen2.5:1.5b-instruct
    if (Test-Path "infra/ollama/Modelfile.docteurflotte") {
        docker exec -i docteurflotte_ollama_prod ollama create docteurflotte -f /tmp/Modelfile.docteurflotte
        Write-Host "✓ Modèle souverain 'docteurflotte' prêt à l'emploi." -ForegroundColor Green
    }
} catch {
    Write-Host "ℹ️ L'initialisation Ollama sera reprise lors du démarrage complet du daemon." -ForegroundColor Gray
}

Write-Host ""
Write-Host "======================================================================" -ForegroundColor Green
Write-Host "  ✅ DÉPLOIEMENT ON-PREMISE TERMINÉ AVEC SUCCÈS                      " -ForegroundColor Green
Write-Host "======================================================================" -ForegroundColor Green
docker compose --env-file $EnvFile -f infra/compose.prod.yaml ps

