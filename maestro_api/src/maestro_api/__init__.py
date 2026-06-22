from flask import Flask

from maestro_api.auth import register_api_key_auth
from maestro_api.config import Config
from maestro_api.extensions import init_extensions
from maestro_api.routes import register_blueprints
from maestro_api.security import register_csrf_protection, register_security_headers, register_strict_origin_check


def create_app() -> Flask:
   # Fail-fast: refuse to start with insecure configuration
    Config.validate()
    app = Flask(__name__)
    app.config.from_object(Config)

    init_extensions(app)
    register_api_key_auth(app)

    # Register security layers
    register_security_headers(app)
    register_strict_origin_check(app)
    register_csrf_protection(app)

    register_blueprints(app)
    return app
