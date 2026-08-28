import base64
import json
import os
import subprocess
from pathlib import Path
from typing import Any

import requests
from flask import Blueprint, current_app, jsonify, request

from maestro_api import maestro
from maestro_api.services.paths import get_cluster_config_dir
from maestro_api.services.validators import (
    validate_apply_actions,
    validate_cluster_name,
    validate_image_config,
    validate_patches,
)

apply_bp = Blueprint("apply", __name__)

FACTORY_BASE_URL = "https://factory.altlinux.space"
FACTORY_TIMEOUT = 30
DEFAULT_INSTALL_IMAGE = "altlinux.space/alt-orchestra/installer:v11.0-alpha.0"
BASE_CONFIG_PATCH = (
    '{"machine":{"kernel":{"modules":[{"name":"bridge"}]},'
    '"registries":{"config":{"registry.altlinux.org":{"tls":{"insecureSkipVerify":true}}}}}}'
)


def _create_schematic(image_config: dict) -> str:
    customization: dict = {}

    if image_config.get("extensions"):
        customization["systemExtensions"] = {"officialExtensions": image_config["extensions"]}
    if image_config.get("kernelArgs"):
        customization["extraKernelArgs"] = image_config["kernelArgs"]
    if image_config.get("secureBoot"):
        customization["secureboot"] = {"includeWellKnownCertificates": True}

    payload = {"customization": customization} if customization else {}
    resp = requests.post(
        f"{FACTORY_BASE_URL}/schematics",
        json=payload,
        timeout=FACTORY_TIMEOUT,
    )
    resp.raise_for_status()
    return resp.json()["id"]


def _build_install_image(image_config: dict) -> str:
    schematic_id = _create_schematic(image_config)
    version = image_config["version"]
    installer_type = (
        "alt-orchestra-metal-installer-secureboot"
        if image_config.get("secureBoot")
        else "alt-orchestra-metal-installer"
    )
    return f"factory.altlinux.space/{installer_type}/{schematic_id}:{version}"


def _get_install_image(image_config: dict) -> str:
    if image_config.get("installerImageUrl"):
        return image_config["installerImageUrl"]
    return _build_install_image(image_config)


def _decode_patches(patch_list: list[dict]) -> list[str]:
    return [base64.b64decode(p["content"]).decode("utf-8") for p in patch_list]


@apply_bp.route("/apply", methods=["GET", "POST"])
def apply():
    if request.method == "GET":
        return jsonify(
            {"status": "ok", "message": "Use POST /apply with JSON payload"}
        ), 200

    payload = request.get_json(silent=True)
    if not isinstance(payload, dict):
        return jsonify({"error": "JSON object payload is required"}), 400

    # New format: {"actions": {clusterName: {controlplane, worker}}, "imageConfig": {...}, "patches": {...}}
    # Old format (backward compat): {clusterName: {controlplane, worker}}
    if "actions" in payload:
        actions_map = payload.get("actions", {})
        raw_image_config = payload.get("imageConfig")
        raw_patches = payload.get("patches")
    else:
        actions_map = payload
        raw_image_config = None
        raw_patches = None

    if not isinstance(actions_map, dict) or not actions_map:
        return jsonify({"error": "actions must be a non-empty object"}), 400

    talos_timeout_seconds = float(current_app.config["TALOS_COMMAND_TIMEOUT_SECONDS"])

    image_config = None
    if raw_image_config is not None:
        try:
            image_config = validate_image_config(raw_image_config)
        except ValueError as err:
            return jsonify({"error": str(err)}), 400

    patches = None
    if raw_patches is not None:
        try:
            patches = validate_patches(raw_patches)
        except ValueError as err:
            return jsonify({"error": str(err)}), 400

    install_image = DEFAULT_INSTALL_IMAGE
    if image_config:
        try:
            install_image = _get_install_image(image_config)
        except requests.RequestException as err:
            return jsonify({"error": f"Failed to create image schematic: {err}"}), 502

    for cluster_name, actions in actions_map.items():
        try:
            validate_cluster_name(cluster_name)
            normalized_actions = validate_apply_actions(actions)
            talosconfig_dir = get_cluster_config_dir(cluster_name)
        except ValueError as err:
            return jsonify({"error": str(err)}), 400

        controlplanes = normalized_actions.get("controlplane") or []
        workers = normalized_actions.get("worker") or []
        if not controlplanes and not workers:
            return jsonify(
                {"error": f"No nodes provided for cluster {cluster_name}"}
            ), 400

        if not os.path.isdir(talosconfig_dir):
            if not controlplanes:
                return jsonify(
                    {"error": f"Missing controlplane node for cluster {cluster_name}"}
                ), 400

            try:
                install_disk = maestro.get_disk_name(
                    controlplanes[0],
                    timeout_seconds=talos_timeout_seconds,
                )
            except (RuntimeError, maestro.CommandTimeoutError) as err:
                status = 504 if isinstance(err, maestro.CommandTimeoutError) else 502
                return jsonify({"error": str(err)}), status
            os.makedirs(talosconfig_dir, exist_ok=True)

            kube_endpoint = f"https://{controlplanes[0]}:6443"
            command = [
                "talosctl",
                "gen",
                "config",
                cluster_name,
                kube_endpoint,
                "--install-image",
                install_image,
                "--config-patch",
                BASE_CONFIG_PATCH,
                "--install-disk",
                install_disk,
            ]

            cni_name = (image_config or {}).get("cni")
            if cni_name in ("flannel", "none"):
                command.extend([
                    "--config-patch",
                    f'{{"cluster":{{"network":{{"cni":{{"name":"{cni_name}"}}}}}}}}',
                ])

            kube_version = (image_config or {}).get("kubernetesVersion")
            if kube_version:
                command.extend(["--kubernetes-version", kube_version])

            if patches:
                for content in _decode_patches(patches.get("common", [])):
                    command.extend(["--config-patch", content])
                for content in _decode_patches(patches.get("controlplane", [])):
                    command.extend(["--config-patch-control-plane", content])
                for content in _decode_patches(patches.get("worker", [])):
                    command.extend(["--config-patch-worker", content])

            try:
                result = maestro.run_command(
                    command,
                    talosconfig_dir,
                    timeout_seconds=talos_timeout_seconds,
                )
            except maestro.CommandTimeoutError as err:
                return jsonify({"error": str(err)}), 504
            if result.returncode != 0:
                return jsonify(
                    {
                        "error": result.stderr.strip()
                        or "Failed to generate cluster talosconfig"
                    }
                ), 502

        try:
            config_result = maestro.run_command(
                ["talosctl", "config", "info", "-o", "json"],
                talosconfig_dir,
                timeout_seconds=talos_timeout_seconds,
            )
        except maestro.CommandTimeoutError as err:
            return jsonify({"error": str(err)}), 504
        if config_result.returncode != 0:
            return jsonify(
                {"error": config_result.stderr.strip() or "Failed to read talos config"}
            ), 502

        try:
            config = json.loads(config_result.stdout)
        except json.JSONDecodeError as err:
            return jsonify({"error": f"Invalid talos config JSON: {err}"}), 502

        for action, ips in normalized_actions.items():
            add_points: dict[str, list[Any]] = {
                "controlplane": controlplanes,
                "worker": list(workers) + list(controlplanes),
            }
            node_type = "endpoint" if action == "controlplane" else "node"
            field_name = f"{node_type}s"
            points = (
                config[field_name]
                if field_name in config and config[field_name]
                else []
            )
            points = list(set(points + list(add_points[action])))

            command = ["talosctl", "config", node_type, *points]
            try:
                result = maestro.run_command(
                    command,
                    talosconfig_dir,
                    timeout_seconds=talos_timeout_seconds,
                )
            except maestro.CommandTimeoutError as err:
                return jsonify({"error": str(err)}), 504
            if result.returncode != 0:
                return jsonify(
                    {"error": result.stderr.strip() or f"Failed to update {field_name}"}
                ), 502

            for ip in ips:
                try:
                    install_disk = maestro.get_disk_name(
                        ip,
                        timeout_seconds=talos_timeout_seconds,
                    )
                except (RuntimeError, maestro.CommandTimeoutError) as err:
                    status = (
                        504 if isinstance(err, maestro.CommandTimeoutError) else 502
                    )
                    return jsonify({"error": str(err)}), status

                ip_patch = f'{{"machine":{{"install":{{"disk":"{install_disk}"}}}}}}'
                apply_command = [
                    "talosctl",
                    "apply-config",
                    "--config-patch",
                    ip_patch,
                    "--insecure",
                    "-n",
                    ip,
                    "--file",
                    f"{action}.yaml",
                ]

                if patches and patches.get("nodes", {}).get(ip):
                    for content in _decode_patches(patches["nodes"][ip]):
                        apply_command.extend(["--config-patch", content])

                try:
                    result = maestro.run_command(
                        apply_command,
                        talosconfig_dir,
                        timeout_seconds=talos_timeout_seconds,
                    )
                except maestro.CommandTimeoutError as err:
                    return jsonify({"error": str(err)}), 504
                if result.returncode != 0:
                    return jsonify(
                        {
                            "error": result.stderr.strip()
                            or f"Failed to apply config on {ip}"
                        }
                    ), 502

                if action == "controlplane":
                    bootstrap_file = os.path.join(talosconfig_dir, "bootstrap.log")

                    if not Path(bootstrap_file).exists():
                        try:
                            print(
                                "start_background_command "
                                f"cwd={talosconfig_dir} ip={ip} output_file={bootstrap_file}", flush=True
                            )

                            bootstrap_command = f"""set -x

sleep 5

until nmap "{ip}/32" -p 50000 | grep open; do
  sleep 5
done

# Bootstrap has to be requested exactly once. Piping into `grep AlreadyExists`
# used to make a *successful* bootstrap look like a failure (it prints nothing),
# so the loop kept firing more requests — and a second request arriving while
# Talos is stopping etcd to apply the first leaves the service wedged in
# "Finished / Bootstrap requested", where it never restarts and the cluster
# never forms. Stop on success; treat AlreadyExists as success too, since it
# just means etcd is bootstrapped already. Only retry a genuine "node isn't
# accepting the call yet" error.
until bootstrap_output=$(talosctl bootstrap -e "{ip}" -n "{ip}" 2>&1); do
  printf '%s\n' "$bootstrap_output"
  printf '%s' "$bootstrap_output" | grep -q AlreadyExists && break
  sleep 5
done

until talosctl health -e "{ip}" -n "{ip}"; do
  sleep 5
done

talosctl -e "{ip}" -n "{ip}" kubeconfig -f
"""

                            with open(bootstrap_file, "ab") as file_pointer:
                                subprocess.Popen(
                                    ["/bin/sh", "-c", bootstrap_command],
                                    cwd=talosconfig_dir,
                                    env=maestro.build_command_env(talosconfig_dir),
                                    stdout=file_pointer,
                                    stderr=subprocess.STDOUT,
                                    start_new_session=True,
                                )

                        except OSError as err:
                            return jsonify(
                                {"error": f"Failed to start bootstrap: {err}"}
                            ), 502

    return jsonify({})
