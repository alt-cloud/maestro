from flask import Flask

from maestro_api.routes.apply import apply_bp
from maestro_api.routes.configs import configs_bp
from maestro_api.routes.factory import factory_bp
from maestro_api.routes.nodes_tree import nodes_tree_bp
from maestro_api.routes.scan_nets import scan_nets_bp
from maestro_api.routes.talosctl import talosctl_bp
from maestro_api.routes.test import test_bp

def register_blueprints(app: Flask) -> None:
    app.register_blueprint(talosctl_bp)
    app.register_blueprint(apply_bp)
    app.register_blueprint(factory_bp)
    app.register_blueprint(configs_bp)
    app.register_blueprint(scan_nets_bp)
    app.register_blueprint(nodes_tree_bp)
    app.register_blueprint(test_bp)
