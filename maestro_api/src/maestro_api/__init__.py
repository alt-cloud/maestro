from flask import Flask

from maestro_api.auth import register_api_key_auth
from maestro_api.config import Config
from maestro_api.extensions import init_extensions
from maestro_api.routes import register_blueprints
from maestro_api.security import (
    register_security_headers,
    register_ip_whitelist_check,
)
from werkzeug.middleware.proxy_fix import ProxyFix
import sys
import logging

def create_app() -> Flask:
   # Fail-fast: refuse to start with insecure configuration
    Config.validate()
    app = Flask(__name__)
    app.config.from_object(Config)

    # === Explicit logging configuration ===
    app.logger.handlers.clear()
    log_stream = sys.stderr
    handler = logging.StreamHandler(log_stream)
    handler.setLevel(logging.WARNING)  # Minimum level for this handler
    formatter = logging.Formatter(
        '[%(asctime)s] %(levelname)s in %(module)s: %(message)s',
        datefmt='%Y-%m-%d %H:%M:%S'
    )
    handler.setFormatter(formatter)
    app.logger.addHandler(handler)
    app.logger.setLevel(logging.WARNING)

    # ProxyFix so the real client IP is detected behind a reverse proxy
    # (reads the X-Forwarded-For, X-Forwarded-Proto, etc. headers).
    app.wsgi_app = ProxyFix(app.wsgi_app, x_for=1, x_proto=1, x_host=1, x_prefix=1)

    @app.before_request
    def debug_log_pre_cors():
        # We use WARNING to ensure the output, given that the base logger level in the code is set to WARNING
        print('debug_log_pre_cors:: ', flush=True)
        app.logger.warning(
            f"[DEBUG PRE-CORS] {request.method} {request.path} | "
            f"IP: {request.remote_addr} | "
            f"Headers: {dict(request.headers)}"
        )

    init_extensions(app)
    register_api_key_auth(app)

    # Register security layers
    register_security_headers(app)
    register_ip_whitelist_check(app)
    register_blueprints(app)
    return app
