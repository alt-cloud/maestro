#!/bin/sh
set -eu

SCRIPT_DIR="$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)"
API_DIR="$(dirname "$SCRIPT_DIR")"
PYTHON_BIN="python3"

if [ -x "$API_DIR/.venv/bin/python" ]; then
  PYTHON_BIN="$API_DIR/.venv/bin/python"
fi

mkdir -p "$HOME/.maestro"
cp "$SCRIPT_DIR/bootstrap.sh" "$HOME/.maestro/bootstrap.sh"
chmod +x "$HOME/.maestro/bootstrap.sh"

exec "$PYTHON_BIN" "$API_DIR/run.py"
