#!/bin/sh
set -eu

SCRIPT_DIR="$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)"
#PROJECT_ROOT="$(CDPATH= cd -- "$SCRIPT_DIR/../.." && pwd)"
API_ENV_FILE="$SCRIPT_DIR/.env"

if [ -f "$API_ENV_FILE" ]; then
  set -a
  # shellcheck disable=SC1090
  . "$API_ENV_FILE"
  set +a
fi

NODE_ENV=development npm start
