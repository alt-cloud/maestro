import json
import os
import subprocess
from pathlib import Path
from typing import Any

from flask import Blueprint, current_app, jsonify, request

from maestro_api import maestro
from maestro_api.services.paths import get_cluster_config_dir
from maestro_api.services.validators import (
    validate_apply_actions,
    validate_cluster_name,
)

apply_bp = Blueprint("apply", __name__)


@apply_bp.route("/apply", methods=["GET", "POST"])
def apply():
    if request.method == "GET":
        return jsonify(
            {"status": "ok", "message": "Use POST /apply with JSON payload"}
        ), 200

    payload = request.get_json(silent=True)
    if not isinstance(payload, dict):
        return jsonify({"error": "JSON object payload is required"}), 400

    talos_timeout_seconds = float(current_app.config["TALOS_COMMAND_TIMEOUT_SECONDS"])

    for cluster_name, actions in payload.items():
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
            patch = (
                '{"machine":{"kernel":{"modules":[{"name":"bridge"}]},'
                '"registries":{"config":{"registry.altlinux.org":{"tls":{"insecureSkipVerify":true}}}}}}'
            )
            command = [
                "talosctl",
                "gen",
                "config",
                cluster_name,
                kube_endpoint,
                "--install-image",
                "altlinux.space/alt-orchestra/installer:v1.10.6",
                "--config-patch",
                patch,
                "--install-disk",
                install_disk,
            ]
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
                patch = f'{{"machine":{{"install":{{"disk":"{install_disk}"}}}}}}'
                command = [
                    "talosctl",
                    "apply-config",
                    "--config-patch",
                    patch,
                    "--insecure",
                    "-n",
                    ip,
                    "--file",
                    f"{action}.yaml",
                ]
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
                            or f"Failed to apply config on {ip}"
                        }
                    ), 502

                if action == "controlplane":
                    bootstrap_file = os.path.join(talosconfig_dir, "bootstrap.log")

                    if not Path(bootstrap_file).exists():
                        try:
                            print(
                                "start_background_command "
                                f"cwd={talosconfig_dir} ip={ip} output_file={bootstrap_file}"
                            )

                            bootstrap_command = f"""set -x

sleep 5

until nmap "{ip}/32" -p 50000 | grep open; do
  sleep 5
done

until talosctl bootstrap -e "{ip}" -n "{ip}" 2>&1 | grep AlreadyExists; do
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
