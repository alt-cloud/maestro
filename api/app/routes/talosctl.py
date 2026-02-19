import json
import os

from flask import Blueprint, jsonify, request, send_file

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

    endpoint = f"-e {node}"
    insecure = "" if not cluster_name.startswith("_") else "-i"

    if cmd == "get":
        missing = _missing_query_params(params, ("subCommand",))
        if missing:
            return jsonify({"error": f"Missing required query parameters: {', '.join(missing)}"}), 400

        sub_command = params["subCommand"]
        try:
            validate_talos_subcommand(sub_command)
        except ValueError as err:
            return jsonify({"error": str(err)}), 400

        run_cmd = f"talosctl get {sub_command} -o json -n {node} {endpoint} {insecure}"
        result = maestro.run_shell_command(run_cmd, talosconfig_dir)
        if result.returncode != 0:
            return jsonify({"error": result.stderr.strip() or "talosctl get command failed"}), 502

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
        run_cmd = f"talosctl {table_cmd} -n {node} {endpoint}"
        result = maestro.run_shell_command(run_cmd, talosconfig_dir)
        if result.returncode != 0:
            return jsonify({"error": result.stderr.strip() or "talosctl table command failed"}), 502
        table_json = maestro.table_to_json(result.stdout)
        return table_json, 200, {"Content-Type": "application/json"}

    if cmd == "support":
        tmp_dir = os.path.join("/tmp", f"talossupport_{os.getpid()}")
        os.makedirs(tmp_dir, exist_ok=True)
        support_file = f"support_{node.replace('.', '_')}.zip"
        support_path = os.path.join(tmp_dir, support_file)
        if os.path.exists(support_path):
            os.remove(support_path)

        run_cmd = f"talosctl support -O {support_path} -n {node} {endpoint}"
        result = maestro.run_shell_command(run_cmd, talosconfig_dir)
        if result.returncode != 0 or not os.path.exists(support_path):
            return jsonify({"error": result.stderr.strip() or "Failed to generate support bundle"}), 502

        return send_file(
            support_path,
            mimetype="application/zip",
            as_attachment=True,
            download_name=support_file,
        )

    if is_text_command(cmd):
        text_cmd = cmd.replace("/", " ")
        run_cmd = f"talosctl {text_cmd} -n {node} {endpoint}"
        result = maestro.run_shell_command(run_cmd, talosconfig_dir)
        if result.returncode != 0:
            return jsonify({"error": result.stderr.strip() or "talosctl text command failed"}), 502
        return jsonify({"content": result.stdout})

    return jsonify({"all_params": dict(request.args), "params_dict": params}), 400
