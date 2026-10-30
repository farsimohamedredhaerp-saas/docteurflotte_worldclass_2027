#!/usr/bin/env bash
# ==============================================================================
# DOCTEURFLOTTE 2027 -- Déploiement Cartographie Souveraine Algérie (PMTiles)
# Conforme Loi 18-07 (ANPDP) & Master Spec v2.0
# Usage: ./scripts/setup-sovereign-maps.sh [/chemin/vers/maps]
# ==============================================================================

set -euo pipefail

TARGET_DIR="${1:-/var/www/maps}"
MAX_ZOOM=14
BBOX="-8.7,18.9,12.0,37.2"

echo "=== DOCTEURFLOTTE : Déploiement Cartographie Souveraine Algérie ==="
mkdir -p "$TARGET_DIR"

PMTILES_DEST="$TARGET_DIR/algeria.pmtiles"

if [ -f "$PMTILES_DEST" ]; then
    SIZE_MB=$(du -m "$PMTILES_DEST" | cut -f1)
    echo "[OK] Fichier algeria.pmtiles déjà présent (${SIZE_MB} Mo)."
    exit 0
fi

echo "[INFO] Téléchargement de l'utilitaire go-pmtiles..."
TMP_DIR=$(mktemp -d)
trap 'rm -rf "$TMP_DIR"' EXIT

ARCH="Linux_x86_64"
if [ "$(uname -m)" = "aarch64" ]; then
    ARCH="Linux_arm64"
fi

wget -q "https://github.com/protomaps/go-pmtiles/releases/latest/download/go-pmtiles_${ARCH}.tar.gz" -O "$TMP_DIR/pmtiles.tar.gz"
tar -xzf "$TMP_DIR/pmtiles.tar.gz" -C "$TMP_DIR"

echo "[INFO] Extraction du territoire souverain Algérie (BBOX: $BBOX)..."
"$TMP_DIR/pmtiles" extract https://build.protomaps.com/20261025.pmtiles "$PMTILES_DEST" \
    --bbox="$BBOX" \
    --maxzoom="$MAX_ZOOM"

echo "[INFO] Rapatriement des polices Noto Sans Arabe / Latin et sprites..."
git clone --depth 1 https://github.com/protomaps/basemaps-assets.git "$TMP_DIR/assets"
cp -r "$TMP_DIR/assets/fonts" "$TARGET_DIR/fonts"
cp -r "$TMP_DIR/assets/sprites/v4" "$TARGET_DIR/sprites"

chmod -R 755 "$TARGET_DIR"
echo "[SUCCÈS] Cartographie souveraine 100% hors-ligne opérationnelle dans $TARGET_DIR !"
