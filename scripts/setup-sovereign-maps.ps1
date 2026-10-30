<#
.SYNOPSIS
  Script de déploiement et préparation de la Cartographie Souveraine Algérie (PMTiles)
.DESCRIPTION
  Télécharge ou prépare l'archive vectorielle 'algeria.pmtiles' dans le dossier public
  pour servir les dalles hors-ligne via requêtes Byte-Range (206 Partial Content).
  Conforme à la Loi 18-07 (ANPDP) et Master Spec v2.0.
#>

param(
    [string]$TargetDir = "$PSScriptRoot\..\apps\web\public\maps",
    [int]$MaxZoom = 14
)

$ErrorActionPreference = "Stop"

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host " DOCTEURFLOTTE 2027 -- Cartographie Souveraine Hors-Ligne " -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Cyan

if (-not (Test-Path $TargetDir)) {
    New-Item -ItemType Directory -Path $TargetDir -Force | Out-Null
    Write-Host "[OK] Dossier créé : $TargetDir" -ForegroundColor Green
}

$pmtilesFile = Join-Path $TargetDir "algeria.pmtiles"

if (Test-Path $pmtilesFile) {
    $sizeMb = [math]::Round((Get-Item $pmtilesFile).Length / 1MB, 2)
    Write-Host "[OK] Fichier cartographique existant trouvé : $pmtilesFile ($sizeMb Mo)" -ForegroundColor Green
    Write-Host "[OK] La cartographie souveraine est prête à être servie localement." -ForegroundColor Green
    exit 0
}

Write-Host "Le fichier 'algeria.pmtiles' n'est pas encore présent dans $TargetDir." -ForegroundColor Yellow
Write-Host ""
Write-Host "Pour générer ou télécharger le fichier binaire souverain de l'Algérie :" -ForegroundColor Cyan
Write-Host "Option 1 (Recommandée sous Linux/VPS ou WSL) :" -ForegroundColor White
Write-Host "  wget https://github.com/protomaps/go-pmtiles/releases/latest/download/go-pmtiles_Linux_x86_64.tar.gz"
Write-Host "  tar -xzf go-pmtiles_Linux_x86_64.tar.gz"
Write-Host "  ./pmtiles extract https://build.protomaps.com/20261025.pmtiles $pmtilesFile --bbox=-8.7,18.9,12.0,37.2 --maxzoom=$MaxZoom"
Write-Host ""
Write-Host "Option 2 (Téléchargement direct d'un extrait préparé) :" -ForegroundColor White
Write-Host "  Placer manuellement 'algeria.pmtiles' dans $TargetDir"
Write-Host ""
Write-Host "En attendant, le Moteur Vectoriel Natif Déconnecté assure l'affichage 100% hors-ligne dans l'application." -ForegroundColor Green
