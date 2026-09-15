import os

from flask import Blueprint, current_app, jsonify

from maestro_api import maestro
from maestro_api.services.paths import get_maestro_config_dir

nodes_tree_bp = Blueprint("nodes_tree", __name__)


@nodes_tree_bp.get("/nodesTree")
def nodes_tree():
    config_dir = get_maestro_config_dir()
    os.makedirs(config_dir, exist_ok=True)

    talos_timeout_seconds = float(current_app.config["TALOS_COMMAND_TIMEOUT_SECONDS"])
    port_check_timeout_seconds = float(current_app.config["PORT_CHECK_TIMEOUT_SECONDS"])
    try:
        return jsonify(
            maestro.refresh_talosconfigs(
                command_timeout_seconds=talos_timeout_seconds,
                port_check_timeout_seconds=port_check_timeout_seconds,
            )
        )
    except maestro.CommandTimeoutError as err:
        return jsonify({"error": str(err)}), 504
