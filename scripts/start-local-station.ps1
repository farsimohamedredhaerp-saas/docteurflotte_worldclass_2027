# ==============================================================================
# DOCTEURFLOTTE 2027 -- Lanceur Déploiement Local Station Windows 10 (64-bits)
# Usage : .\scripts\start-local-station.ps1
# ==============================================================================

[CmdletBinding()]
param (
    [switch]$BuildFirst = $false,
    [switch]$NoBrowser = $false
)

$ErrorActionPreference = "Continue"
$RootDir = Split-Path -Parent $PSScriptRoot
Set-Location $RootDir

Write-Host "======================================================================" -ForegroundColor Cyan
Write-Host "  🚀 DOCTEURFLOTTE 2027 — DÉPLOIEMENT LOCAL WINDOWS 10 (64-BITS)       " -ForegroundColor Cyan
Write-Host "  Standard Souverain Algérie-First, Loi 18-07 ANPDP, RLS & Maintenance 5.0" -ForegroundColor Cyan
Write-Host "======================================================================" -ForegroundColor Cyan

# 1. Chargement de l'environnement local
if (Test-Path "scripts/load-env.ps1") {
    . .\scripts\load-env.ps1
} else {
    Write-Warning "scripts/load-env.ps1 introuvable, utilisation de l'environnement courant."
}

# 2. Vérification et Démarrage de l'Infrastructure Docker Locale
Write-Host "`n[1/4] Vérification de l'infrastructure Docker..." -ForegroundColor Yellow
$infraRunning = $false
try {
    $containers = docker ps --format '{{.Names}}'
    if ($containers -match 'docteurflotte_postgres' -and $containers -match 'docteurflotte_redis') {
        Write-Host "  ✓ Conteneurs PostgreSQL (5434) et Redis (6380) actifs." -ForegroundColor Green
        $infraRunning = $true
    } else {
        Write-Host "  Démarrage des conteneurs via infra/compose.yaml..." -ForegroundColor Cyan
        docker compose -f infra/compose.yaml up -d
        $infraRunning = $true
    }
} catch {
    Write-Warning "Docker non accessible ou en cours de démarrage."
}

if (-not $infraRunning) {
    Write-Warning "L'infrastructure de données locale (PostgreSQL / Redis) n'a pas pu être confirmée."
}

# 3. Vérification ou Compilation des Contrats
if ($BuildFirst) {
    Write-Host "`n[2/4] Compilation des paquets et contrats..." -ForegroundColor Yellow
    pnpm --filter @docteurflotte/contracts build
    pnpm --filter @docteurflotte/api build
}

# 4. Vérification de l'API NestJS (Port 3001)
Write-Host "`n[3/4] Contrôle de l'API NestJS (Port 3001)..." -ForegroundColor Yellow
$apiUp = $false
try {
    $apiHealth = Invoke-RestMethod -Uri "http://localhost:3001/health" -TimeoutSec 3 -ErrorAction SilentlyContinue
    if ($apiHealth.status -eq "ok") {
        Write-Host "  ✓ API NestJS opérationnelle sur http://localhost:3001 (uptime: $($apiHealth.uptime)s)" -ForegroundColor Green
        $apiUp = $true
    }
} catch {}

if (-not $apiUp) {
    Write-Host "  Lancement du serveur API NestJS en arrière-plan..." -ForegroundColor Cyan
    Start-Process -FilePath "node" -ArgumentList "--max-old-space-size=2048", "apps/api/dist/main.js" -WindowStyle Minimized
    Start-Sleep -Seconds 3
}

# 5. Contrôle du Frontend Next.js (Port 3000)
Write-Host "`n[4/4] Contrôle du Cockpit Web Next.js (Port 3000)..." -ForegroundColor Yellow
$webUp = $false
try {
    $webTest = Invoke-WebRequest -Uri "http://localhost:3000" -TimeoutSec 3 -UseBasicParsing -ErrorAction SilentlyContinue
    if ($webTest.StatusCode -eq 200) {
        Write-Host "  ✓ Frontend Next.js opérationnel sur http://localhost:3000" -ForegroundColor Green
        $webUp = $true
    }
} catch {}

if (-not $webUp) {
    Write-Host "  Lancement du serveur Web Next.js en arrière-plan..." -ForegroundColor Cyan
    Start-Process -FilePath "pnpm" -ArgumentList "--filter", "@docteurflotte/web", "dev" -WindowStyle Minimized
    Start-Sleep -Seconds 4
}

Write-Host "`n======================================================================" -ForegroundColor Green
Write-Host "  ✨ DÉPLOIEMENT LOCAL OPÉRATIONNEL & PRÊT À L'EMPLOI SUR CETTE STATION " -ForegroundColor Green
Write-Host "======================================================================" -ForegroundColor Green
Write-Host "  • Cockpit Web (Next.js 15)  : http://localhost:3000" -ForegroundColor Cyan
Write-Host "  • API Backend (NestJS)      : http://localhost:3001/health" -ForegroundColor Cyan
Write-Host "  • Passerelle IoT (Traccar)  : http://localhost:8085" -ForegroundColor Cyan
Write-Host "  • Base PostgreSQL RLS       : localhost:5434 (DB: docteurflotte_dev)" -ForegroundColor Cyan
Write-Host "  • Cache Redis Distribué     : localhost:6380" -ForegroundColor Cyan
Write-Host "======================================================================`n" -ForegroundColor Green

if (-not $NoBrowser) {
    Write-Host "Ouverture du navigateur par défaut sur le cockpit..." -ForegroundColor Gray
    Start-Process "http://localhost:3000"
}

