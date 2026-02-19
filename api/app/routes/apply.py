import json
import os
from pathlib import Path
from typing import Any

from flask import Blueprint, jsonify, request

import maestro
from app.services.paths import get_cluster_config_dir, get_maestro_config_dir
from app.services.validators import validate_apply_actions, validate_cluster_name

apply_bp = Blueprint("apply", __name__)


@apply_bp.route("/apply", methods=["GET", "POST"])
def apply():
    if request.method == "GET":
        return jsonify({"status": "ok", "message": "Use POST /apply with JSON payload"}), 200

    payload = request.get_json(silent=True)
    if not isinstance(payload, dict):
        return jsonify({"error": "JSON object payload is required"}), 400

    maestro_config_dir = get_maestro_config_dir()

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
            return jsonify({"error": f"No nodes provided for cluster {cluster_name}"}), 400

        if not os.path.isdir(talosconfig_dir):
            if not controlplanes:
                return jsonify({"error": f"Missing controlplane node for cluster {cluster_name}"}), 400

            try:
                install_disk = maestro.get_disk_name(controlplanes[0])
            except RuntimeError as err:
                return jsonify({"error": str(err)}), 502
            os.makedirs(talosconfig_dir, exist_ok=True)

            kube_endpoint = f"https://{controlplanes[0]}:6443"
            patch = (
                '{"machine":{"kernel":{"modules":[{"name":"bridge"}]},'
                '"registries":{"config":{"registry.altlinux.org":{"tls":{"insecureSkipVerify":true}}}}}}'
            )
            run_cmd = (
                f"talosctl gen config {cluster_name} {kube_endpoint} "
                "--install-image altlinux.space/alt-orchestra/installer:v1.10.6 "
                f"--config-patch '{patch}' --install-disk {install_disk}"
            )
            result = maestro.run_shell_command(run_cmd, talosconfig_dir)
            if result.returncode != 0:
                return jsonify({"error": result.stderr.strip() or "Failed to generate cluster talosconfig"}), 502

        config_result = maestro.run_shell_command("talosctl config info -o json", talosconfig_dir)
        if config_result.returncode != 0:
            return jsonify({"error": config_result.stderr.strip() or "Failed to read talos config"}), 502

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
            points = config[field_name] if field_name in config and config[field_name] else []
            points = list(set(points + list(add_points[action])))

            run_cmd = f"talosctl config {node_type} {' '.join(points)}"
            result = maestro.run_shell_command(run_cmd, talosconfig_dir)
            if result.returncode != 0:
                return jsonify({"error": result.stderr.strip() or f"Failed to update {field_name}"}), 502

            for ip in ips:
                try:
                    install_disk = maestro.get_disk_name(ip)
                except RuntimeError as err:
                    return jsonify({"error": str(err)}), 502
                patch = f'{{"machine":{{"install":{{"disk":"{install_disk}"}}}}}}'
                run_cmd = (
                    f"talosctl apply-config --config-patch '{patch}' "
                    f"--insecure -n {ip} --file {action}.yaml"
                )
                result = maestro.run_shell_command(run_cmd, talosconfig_dir)
                if result.returncode != 0:
                    return jsonify({"error": result.stderr.strip() or f"Failed to apply config on {ip}"}), 502

                if action == "controlplane":
                    bootstrap_file = os.path.join(talosconfig_dir, "bootstrap.log")
                    if not Path(bootstrap_file).exists():
                        bootstrap_script = os.path.join(maestro_config_dir, "bootstrap.sh")
                        run_cmd = f"{bootstrap_script} {ip} > {bootstrap_file} 2>&1 &"
                        result = maestro.run_shell_command(run_cmd, talosconfig_dir)
                        if result.returncode != 0:
                            return jsonify({"error": result.stderr.strip() or "Failed to start bootstrap"}), 502

    return jsonify({})
