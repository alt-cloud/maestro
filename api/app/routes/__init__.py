from flask import Flask

from app.routes.apply import apply_bp
from app.routes.nodes_tree import nodes_tree_bp
from app.routes.scan_nets import scan_nets_bp
from app.routes.talosctl import talosctl_bp


def register_blueprints(app: Flask) -> None:
    app.register_blueprint(talosctl_bp)
    app.register_blueprint(apply_bp)
    app.register_blueprint(scan_nets_bp)
    app.register_blueprint(nodes_tree_bp)
