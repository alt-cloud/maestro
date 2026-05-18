import requests
from flask import Blueprint, jsonify

factory_bp = Blueprint("factory", __name__)

FACTORY_BASE_URL = "https://factory.altlinux.space"
FACTORY_TIMEOUT = 15



@factory_bp.route("/factory/versions", methods=["GET"])
def get_versions():
    try:
        resp = requests.get(f"{FACTORY_BASE_URL}/versions", timeout=FACTORY_TIMEOUT)
        resp.raise_for_status()
        return jsonify(resp.json()), 200
    except requests.RequestException as err:
        return jsonify({"error": f"Failed to fetch versions from factory: {err}"}), 502


@factory_bp.route("/factory/extensions/<version>", methods=["GET"])
def get_extensions(version: str):
    try:
        resp = requests.get(
            f"{FACTORY_BASE_URL}/version/{version}/extensions/official",
            timeout=FACTORY_TIMEOUT,
        )
        resp.raise_for_status()
        return jsonify(resp.json()), 200
    except requests.RequestException as err:
        return jsonify({"error": f"Failed to fetch extensions from factory: {err}"}), 502


