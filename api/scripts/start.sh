#!/bin/sh
set -eu

SCRIPT_DIR="$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)"
API_DIR="$(dirname "$SCRIPT_DIR")"

mkdir -p "$HOME/.maestro"
cp "$SCRIPT_DIR/bootstrap.sh" "$HOME/.maestro/bootstrap.sh"
chmod +x "$HOME/.maestro/bootstrap.sh"

exec python3 "$API_DIR/run.py"
