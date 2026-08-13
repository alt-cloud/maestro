import re

import requests
from flask import Blueprint, jsonify

from maestro_api.services.compat import (
    filter_supported_versions,
    get_supported_k8s_minors,
    get_talos_minor,
    newest_version,
)

factory_bp = Blueprint("factory", __name__)

FACTORY_BASE_URL = "https://factory.altlinux.space"
FACTORY_TIMEOUT = 15

REGISTRY_BASE_URL = "https://registry.altlinux.org"
KUBE_APISERVER_REPO = "p11/kube-apiserver"
# Only keep real version tags like "v1.35.5" / "1.35.5" (drops "latest" etc.).
_KUBE_VERSION_RE = re.compile(r"^v?\d+\.\d+(\.\d+)?$")



@factory_bp.route("/factory/versions", methods=["GET"])
def get_versions():
    try:
        resp = requests.get(f"{FACTORY_BASE_URL}/versions", timeout=FACTORY_TIMEOUT)
        resp.raise_for_status()
        return jsonify(resp.json()), 200
    except requests.RequestException as err:
        return jsonify({"error": f"Failed to fetch versions from factory: {err}"}), 502


@factory_bp.route("/kubernetes/versions", methods=["GET"])
def get_kubernetes_versions():
    try:
        resp = requests.get(
            f"{REGISTRY_BASE_URL}/v2/{KUBE_APISERVER_REPO}/tags/list",
            timeout=FACTORY_TIMEOUT,
        )
        resp.raise_for_status()
        tags = resp.json().get("tags", [])
    except requests.RequestException as err:
        return jsonify(
            {"error": f"Failed to fetch kubernetes versions from registry: {err}"}
        ), 502

    all_versions = [tag for tag in tags if _KUBE_VERSION_RE.match(tag)]
    supported_minors = get_supported_k8s_minors(get_talos_minor())
    versions = filter_supported_versions(all_versions, supported_minors)
    recommended = newest_version(versions)
    return jsonify({"versions": versions, "recommended": recommended}), 200


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


