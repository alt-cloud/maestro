from flask import Flask

from maestro_api.config import Config
from maestro_api.extensions import init_extensions
from maestro_api.routes import register_blueprints


def create_app() -> Flask:
    app = Flask(__name__)
    app.config.from_object(Config)

    init_extensions(app)
    register_blueprints(app)
    return app
