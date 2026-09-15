from flask import Flask, Response
from flask_cors import CORS

def init_extensions(app: Flask) -> None:
    """
    Initialize Flask extensions.
    CORS is configured strictly from the list of domains in app.config["CORS_ORIGINS"].
    """
    cors_origins = app.config.get("CORS_ORIGINS", [])

    # Single, correct initialization without duplication
    CORS(
        app,
        origins=cors_origins,
        supports_credentials=False,
        allow_headers=["X-API-Key", "Authorization", "Content-Type"],
        methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
        max_age=3600,  # Cache preflight for 1 hour
    )

    @app.after_request
    def disable_caching(response: Response) -> Response:
        # Every response here reflects live cluster/node state — the browser must
        # never serve a stale cached copy of it on a repeated GET.
        response.headers["Cache-Control"] = "no-store"
        return response
