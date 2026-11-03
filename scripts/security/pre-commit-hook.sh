#!/usr/bin/env sh
# ==============================================================================
# DOCTEURFLOTTE — Pre-commit Hook (Anti-Leak & Secrets Blocker)
# ==============================================================================

echo "🔒 [PRE-COMMIT] Audit de sécurité anti-fuite de secrets en cours..."

# 1. Vérification stricte des fichiers staggés (.env, clés privées, certificats)
FORBIDDEN_FILES=$(git diff --cached --name-only | grep -E '\.env$|\.env\.local$|\.pem$|\.key$|\.pfx$|\.p12$|\.onnx$|\.mbtiles$|\.dump$')
if [ -n "$FORBIDDEN_FILES" ]; then
    echo "❌ [BLOCKED] Fichiers interdits détectés dans le commit staggé :"
    echo "$FORBIDDEN_FILES"
    echo "🚨 Erreur critique : Retirez ces fichiers avec 'git reset HEAD <fichier>'."
    exit 1
fi

# 2. Exécution de Gitleaks si présent sur la machine
if command -v gitleaks >/dev/null 2>&1; then
    echo "🔍 Analyse par Gitleaks (mode staged)..."
    gitleaks protect --staged --verbose --config .gitleaks.toml
    GITLEAKS_STATUS=$?
    if [ $GITLEAKS_STATUS -ne 0 ]; then
        echo "❌ [BLOCKED] Gitleaks a détecté un secret ou une clé privée dans le commit !"
        exit 1
    fi
else
    # 3. Fallback rapide Node.js intégré
    echo "ℹ Gitleaks non détecté dans le PATH. Exécution de l'analyseur Node.js intégré..."
    node scripts/guardrails/check-secrets.cjs
    SECRETS_STATUS=$?
    if [ $SECRETS_STATUS -ne 0 ]; then
        echo "❌ [BLOCKED] Des secrets ont été détectés par l'analyseur statique."
        exit 1
    fi
fi

echo "✓ [PASS] Aucun secret détecté. Intégrité validée."
exit 0

