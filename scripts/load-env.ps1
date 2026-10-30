# ==============================================================================
# DOCTEURFLOTTE 2027 -- Chargement rapide de l'environnement local PowerShell
# Usage : . .\scripts\load-env.ps1
# ==============================================================================

$jsonPath = Join-Path $PSScriptRoot "env-paths.json"
if (-not (Test-Path $jsonPath)) {
    Write-Error "Fichier env-paths.json introuvable: $jsonPath"
    return
}

$rawJson = Get-Content -Path $jsonPath -Raw
$config = $rawJson | ConvertFrom-Json

$nodeBinDir = $config.runtimes.node.directory
$nodeExe = $config.runtimes.node.bin
$pnpmCjs = $config.runtimes.pnpm.cjs
$pythonBinDir = $config.runtimes.python.directory
$pythonExe = $config.runtimes.python.bin

$sandboxTmp = "E:\docteurflotte_2027\.agents\tmp"
if (-not (Test-Path $sandboxTmp)) {
    New-Item -ItemType Directory -Path $sandboxTmp -Force | Out-Null
}
$env:LOCALAPPDATA = $sandboxTmp
$env:APPDATA = $sandboxTmp
$env:PNPM_HOME = "$sandboxTmp\pnpm"

if (Test-Path $nodeBinDir) {
    $cleanPathParts = $env:PATH -split ';' | Where-Object { $_ -and $_ -notlike '*Program Files\nodejs*' }
    $env:PATH = "$nodeBinDir;" + ($cleanPathParts -join ';')
}
$env:NODE_OPTIONS = if ($env:NODE_OPTIONS) { "$env:NODE_OPTIONS --disable-warning=DEP0190 --preserve-symlinks-main --max-old-space-size=1536" } else { "--disable-warning=DEP0190 --preserve-symlinks-main --max-old-space-size=1536" }

if ($pythonBinDir -and (Test-Path $pythonBinDir)) {
    $currentPathParts = $env:PATH -split ';'
    if (-not ($currentPathParts -contains $pythonBinDir)) {
        $env:PATH = "$pythonBinDir;$env:PATH"
    }
}

function global:node-run {
    & $nodeExe --preserve-symlinks-main $args
}

function global:pnpm-run {
    & $nodeExe --preserve-symlinks-main $pnpmCjs $args
}

function global:python-run {
    & $pythonExe $args
}

Set-Alias -Name node -Value node-run -Scope Global -Option AllScope -Force
Set-Alias -Name pnpm -Value pnpm-run -Scope Global -Option AllScope -Force
Set-Alias -Name python -Value python-run -Scope Global -Option AllScope -Force

Write-Host "Environnement local charge avec succes :" -ForegroundColor Green
Write-Host "  Node.js : $nodeExe" -ForegroundColor Cyan
Write-Host "  pnpm    : $pnpmCjs" -ForegroundColor Cyan
Write-Host "  Python  : $pythonExe" -ForegroundColor Cyan
Write-Host "  Postgres Local Port : 5434" -ForegroundColor Gray
Write-Host "  Redis Local Port    : 6380" -ForegroundColor Gray
Write-Host "  Traccar Local Port  : 8085" -ForegroundColor Gray

# ──────────────────────────────────────────────────────────────────────────────
# Ollama (IA Souveraine — CPU-only, offline, Loi 18-07)
# ──────────────────────────────────────────────────────────────────────────────
$env:OLLAMA_BASE_URL = "http://localhost:11434"
$env:OLLAMA_MODEL_NAME = "docteurflotte"
$env:OLLAMA_NUM_PARALLEL = "1"          # 1 requête simultanée (8 Go RAM)
$env:OLLAMA_MAX_LOADED_MODELS = "1"     # 1 seul modèle en RAM
$env:OLLAMA_KEEP_ALIVE = "5m"           # Décharger après 5 min d'inactivité
$env:OLLAMA_FLASH_ATTENTION = "1"       # Réduction mémoire ~20%
$env:OLLAMA_MAX_TOKENS = "512"
$env:OLLAMA_TIMEOUT = "30"
$env:OLLAMA_CACHE_TTL = "3600"

# Vérification de la disponibilité d'Ollama
$ollamaAvailable = $false
try {
    $ollamaResp = Invoke-RestMethod -Uri "$($env:OLLAMA_BASE_URL)/api/tags" -TimeoutSec 2 -ErrorAction SilentlyContinue
    if ($ollamaResp) { $ollamaAvailable = $true }
} catch { }
if ($ollamaAvailable) {
    Write-Host "  Ollama Local Port   : 11434 (IA Souveraine Active)" -ForegroundColor Green
} else {
    Write-Host "  Ollama Local Port   : 11434 (Non detecte - mode degrade)" -ForegroundColor Yellow
}
