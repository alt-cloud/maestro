from flask import Flask

from maestro_api.auth import register_api_key_auth
from maestro_api.config import Config, APIKeyConfig
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
    formatter = logging.Formatter(
        '[%(asctime)s] %(levelname)s in %(module)s: %(message)s',
        datefmt='%Y-%m-%d %H:%M:%S'
    )
    handler.setFormatter(formatter)
    app.logger.addHandler(handler)
    if Config.API_DEBUG:
        handler.setLevel(logging.DEBUG)
    else:
        handler.setLevel(logging.WARNING)

    # ProxyFix so the real client IP is detected behind a reverse proxy
    # (reads the X-Forwarded-For, X-Forwarded-Proto, etc. headers).
    app.wsgi_app = ProxyFix(app.wsgi_app, x_for=1, x_proto=1, x_host=1, x_prefix=1)

    init_extensions(app)
    register_api_key_auth(app)

    # Register security layers
    register_security_headers(app)
    register_ip_whitelist_check(app)
    register_blueprints(app)
    app.logger.debug(f"CORS_ORIGINS = {Config.CORS_ORIGINS}")
    app.logger.debug(f"API_WHITELIST = {Config.API_WHITELIST}")
    app.logger.debug(f"TALOS_COMMAND_TIMEOUT_SECONDS = {Config.TALOS_COMMAND_TIMEOUT_SECONDS}")
    app.logger.debug(f"NMAP_COMMAND_TIMEOUT_SECONDS = {Config.NMAP_COMMAND_TIMEOUT_SECONDS}")
    app.logger.debug(f"PORT_CHECK_TIMEOUT_SECONDS = {Config.PORT_CHECK_TIMEOUT_SECONDS}")
    if Config.API_DEBUG:
        app.logger.debug('MAESTRO_API_KEYS:')
        for item in Config.API_KEYS_CONFIG:
            app.logger.debug(f"\t-\tkey: ***")
            for desc in ['scopes', 'rate_limit_per_minute', 'expires_at']:
                value = getattr(item, desc, None)
                if value:
                    app.logger.debug(f"\t\t{desc}:{value}")
    return app
