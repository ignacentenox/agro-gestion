#!/bin/bash
set -e

# Alias de compatibilidad histórica.
# Usar `start.sh` como script canónico (DB/Prisma + dev server).

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

exec ./start.sh
