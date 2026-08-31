#!/bin/sh
set -eu

SCRIPT_DIR="$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)"
API_DIR="$(dirname "$SCRIPT_DIR")"
VENV_DIR="$API_DIR/.venv"

apt-get install -y python3 python3-module-pip python3-module-virtualenv talosctl nmap yq


python3 -m venv "$VENV_DIR"
# shellcheck disable=SC1091
. "$VENV_DIR/bin/activate"
pip install -U pip
pip install -e "$API_DIR"
