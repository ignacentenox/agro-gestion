#!/usr/bin/env bash
set -euo pipefail

# Configura los secrets requeridos por GitHub Actions para deploy automático en Vercel.
# Uso:
#   export VERCEL_TOKEN=...
#   export VERCEL_ORG_ID=...
#   export VERCEL_PROJECT_ID=...
#   ./scripts/setup-vercel-github-secrets.sh [owner/repo]

if ! command -v gh >/dev/null 2>&1; then
  echo "Error: GitHub CLI (gh) no está instalado."
  echo "Instalá con: brew install gh"
  exit 1
fi

if ! gh auth status >/dev/null 2>&1; then
  echo "Error: gh no está autenticado. Ejecutá: gh auth login"
  exit 1
fi

if [[ -z "${VERCEL_TOKEN:-}" || -z "${VERCEL_ORG_ID:-}" || -z "${VERCEL_PROJECT_ID:-}" ]]; then
  echo "Error: faltan variables requeridas."
  echo "Definí: VERCEL_TOKEN, VERCEL_ORG_ID y VERCEL_PROJECT_ID"
  exit 1
fi

REPO="${1:-}"
if [[ -z "$REPO" ]]; then
  REPO="$(gh repo view --json nameWithOwner -q .nameWithOwner)"
fi

echo "Configurando secrets en $REPO..."

gh secret set VERCEL_TOKEN --repo "$REPO" --body "$VERCEL_TOKEN"
gh secret set VERCEL_ORG_ID --repo "$REPO" --body "$VERCEL_ORG_ID"
gh secret set VERCEL_PROJECT_ID --repo "$REPO" --body "$VERCEL_PROJECT_ID"

echo "OK: secrets configurados para $REPO"
