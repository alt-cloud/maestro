import os
from pathlib import Path

from flask import Blueprint, jsonify

import maestro
from app.services.paths import get_maestro_config_dir

nodes_tree_bp = Blueprint("nodes_tree", __name__)


@nodes_tree_bp.get("/nodesTree")
def nodes_tree():
    config_dir = get_maestro_config_dir()
    os.makedirs(config_dir, exist_ok=True)

    for virtual_cluster in maestro.VIRTUALCLUSTERS:
        virtual_cluster_dir = os.path.join(config_dir, virtual_cluster)
        if not Path(virtual_cluster_dir).is_dir():
            maestro.initTalosconfig()
            break

    return jsonify(maestro.refreshTalosconfigs())
