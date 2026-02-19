import json
import os

from flask import Blueprint, jsonify, request

import maestro
from app.services.paths import get_home_dir, get_maestro_config_dir
from app.services.validators import validate_scan_networks

scan_nets_bp = Blueprint("scan_nets", __name__)


@scan_nets_bp.route("/scanNets", methods=["GET", "POST"])
def scan_nets():
    maestro_config_dir = get_maestro_config_dir()
    os.makedirs(maestro_config_dir, exist_ok=True)

    scan_nets_file = os.path.join(maestro_config_dir, "scanNets.json")
    if not os.path.isfile(scan_nets_file):
        with open(scan_nets_file, "w", encoding="utf-8") as file_pointer:
            json.dump({"scanNets": []}, file_pointer, indent=2)

    if request.method == "GET":
        with open(scan_nets_file, "r", encoding="utf-8") as file_pointer:
            scan_nets_config = json.load(file_pointer)
        return jsonify(scan_nets_config)

    payload = request.get_json(silent=True)
    if not isinstance(payload, dict):
        return jsonify({"error": "JSON object payload is required"}), 400

    try:
        scan_networks = validate_scan_networks(payload.get("scanNets"))
    except ValueError as err:
        return jsonify({"error": str(err)}), 400

    with open(scan_nets_file, "w", encoding="utf-8") as file_pointer:
        json.dump({"scanNets": scan_networks}, file_pointer, indent=2)

    command = ["nmap", "-p", "50000,6443", *scan_networks]
    result = maestro.run_command(command, get_home_dir())
    if result.returncode != 0:
        return jsonify({"error": result.stderr.strip() or "nmap failed"}), 502

    nodes = maestro.nodes_list(result.stdout.strip())
    nodes = {
        ip: info for ip, info in nodes.items() if info.get("apidState") == "open"
    }

    nodes_file = os.path.join(maestro_config_dir, "nodes.json")
    with open(nodes_file, "w", encoding="utf-8") as file_pointer:
        json.dump(nodes, file_pointer, indent=2)

    maestro.init_talosconfig()
    return jsonify({"status": "success", "message": "Successfully scanned"}), 200
