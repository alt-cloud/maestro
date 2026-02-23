import json
import os
import shutil
import tempfile

from flask import Blueprint, after_this_request, current_app, jsonify, request, send_file

import maestro
from app.services.parsers import parse_talos_json_stream
from app.services.paths import get_cluster_config_dir
from app.services.validators import (
    is_table_command,
    is_text_command,
    validate_cluster_name,
    validate_ip_address,
    validate_talos_command,
    validate_talos_subcommand,
)

talosctl_bp = Blueprint("talosctl", __name__)


def _missing_query_params(params: dict[str, str], required: tuple[str, ...]) -> list[str]:
    return [name for name in required if not params.get(name)]


@talosctl_bp.get("/talosctl")
def talosctl():
    params = request.args.to_dict()
    missing = _missing_query_params(params, ("cluster", "n", "cmd"))
    if missing:
        return jsonify({"error": f"Missing required query parameters: {', '.join(missing)}"}), 400

    cluster_name = params["cluster"]
    node = params["n"]
    cmd = params["cmd"]

    try:
        validate_cluster_name(cluster_name)
        validate_ip_address(node, "n")
        validate_talos_command(cmd)
        talosconfig_dir = get_cluster_config_dir(cluster_name)
    except ValueError as err:
        return jsonify({"error": str(err)}), 400

    talos_timeout_seconds = float(current_app.config["TALOS_COMMAND_TIMEOUT_SECONDS"])
    talos_verify_certificates = bool(current_app.config["TALOS_VERIFY_CERTIFICATES"])

    if cmd == "get":
        missing = _missing_query_params(params, ("subCommand",))
        if missing:
            return jsonify({"error": f"Missing required query parameters: {', '.join(missing)}"}), 400

        sub_command = params["subCommand"]
        try:
            validate_talos_subcommand(sub_command)
        except ValueError as err:
            return jsonify({"error": str(err)}), 400

        command = [
            "talosctl",
            "get",
            sub_command,
            "-o",
            "json",
            "-n",
            node,
            "-e",
            node,
        ]
        if cluster_name.startswith("_"):
            command.append("-i")
        try:
            result = maestro.run_command(
                command,
                talosconfig_dir,
                timeout_seconds=talos_timeout_seconds,
                verify_certificates=talos_verify_certificates,
            )
        except maestro.CommandTimeoutError as err:
            return jsonify({"error": str(err)}), 504
        if result.returncode != 0:
            return jsonify({"error": result.stderr.strip() or "talosctl get command failed"}), 502
        if len(result.stdout.strip()) == 0:
            result.stdout = '{}'
        try:
            rows = parse_talos_json_stream(result.stdout)
        except json.JSONDecodeError as err:
            return jsonify({"error": f"Failed to parse talosctl JSON stream: {err}"}), 502

        if rows and isinstance(rows[0].get("spec"), str):
            for row in rows:
                row["spec"] = {"spec": row["spec"]}
        return jsonify(rows)

    if cluster_name.startswith("_"):
        return jsonify([])

    if is_table_command(cmd):
        table_cmd = cmd.replace("/", " ")
        command = ["talosctl", *table_cmd.split(), "-n", node, "-e", node]
        try:
            result = maestro.run_command(
                command,
                talosconfig_dir,
                timeout_seconds=talos_timeout_seconds,
                verify_certificates=talos_verify_certificates,
            )
        except maestro.CommandTimeoutError as err:
            return jsonify({"error": str(err)}), 504
        table_json = maestro.table_to_json(result.stdout)
        if result.returncode != 0 :
            table_json = [ table_json, result.stderr ]
        return table_json, 200, {"Content-Type": "application/json"}

    if cmd == "support":
        tmp_dir = tempfile.mkdtemp(prefix=f"talossupport_{os.getpid()}_")
        support_file = f"support_{node.replace('.', '_')}.zip"
        support_path = os.path.join(tmp_dir, support_file)

        command = ["talosctl", "support", "-O", support_path, "-n", node, "-e", node]
        try:
            result = maestro.run_command(
                command,
                talosconfig_dir,
                timeout_seconds=talos_timeout_seconds,
                verify_certificates=talos_verify_certificates,
            )
        except maestro.CommandTimeoutError as err:
            return jsonify({"error": str(err)}), 504
        if result.returncode != 0 or not os.path.exists(support_path):
            shutil.rmtree(tmp_dir, ignore_errors=True)
            return jsonify({"error": result.stderr.strip() or "Failed to generate support bundle"}), 502

        @after_this_request
        def cleanup_support_artifacts(response):
            shutil.rmtree(tmp_dir, ignore_errors=True)
            return response

        return send_file(
            support_path,
            mimetype="application/zip",
            as_attachment=True,
            download_name=support_file,
        )

    if is_text_command(cmd):
        text_cmd = cmd.replace("/", " ")
        command = ["talosctl", *text_cmd.split(), "-n", node, "-e", node]
        try:
            result = maestro.run_command(
                command,
                talosconfig_dir,
                timeout_seconds=talos_timeout_seconds,
                verify_certificates=talos_verify_certificates,
            )
        except maestro.CommandTimeoutError as err:
            return jsonify({"error": str(err)}), 504
        if result.returncode != 0:
            return jsonify({"error": result.stderr.strip() or "talosctl text command failed"}), 502
        return jsonify({"content": result.stdout})

    return jsonify({"all_params": dict(request.args), "params_dict": params}), 400
