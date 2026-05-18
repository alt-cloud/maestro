import json
import os
import re

from flask import Blueprint, jsonify, request

from maestro_api.services.paths import get_configs_dir

configs_bp = Blueprint("configs", __name__)

_CONFIG_NAME_RE = re.compile(r"^[A-Za-z0-9_][A-Za-z0-9_ .\-]{0,62}$")


def _safe_config_path(name: str) -> str:
    if not _CONFIG_NAME_RE.fullmatch(name):
        raise ValueError("Invalid config name")
    base = os.path.abspath(get_configs_dir())
    path = os.path.abspath(os.path.join(base, f"{name}.json"))
    if os.path.commonpath([base, path]) != base:
        raise ValueError("Config path escapes configs directory")
    return path


@configs_bp.route("/configs", methods=["GET"])
def list_configs():
    configs_dir = get_configs_dir()
    if not os.path.isdir(configs_dir):
        return jsonify([]), 200
    names = sorted(f[:-5] for f in os.listdir(configs_dir) if f.endswith(".json"))
    return jsonify(names), 200


@configs_bp.route("/configs/<name>", methods=["GET"])
def get_config(name: str):
    try:
        path = _safe_config_path(name)
    except ValueError as err:
        return jsonify({"error": str(err)}), 400

    if not os.path.isfile(path):
        return jsonify({"error": "Config not found"}), 404

    with open(path) as f:
        return jsonify(json.load(f)), 200


@configs_bp.route("/configs/<name>", methods=["POST"])
def save_config(name: str):
    try:
        path = _safe_config_path(name)
    except ValueError as err:
        return jsonify({"error": str(err)}), 400

    data = request.get_json(silent=True)
    if not isinstance(data, dict):
        return jsonify({"error": "JSON object payload is required"}), 400

    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, "w") as f:
        json.dump(data, f, indent=2)

    return jsonify({}), 200


@configs_bp.route("/configs/<name>", methods=["DELETE"])
def delete_config(name: str):
    try:
        path = _safe_config_path(name)
    except ValueError as err:
        return jsonify({"error": str(err)}), 400

    if not os.path.isfile(path):
        return jsonify({"error": "Config not found"}), 404

    os.remove(path)
    return jsonify({}), 200
