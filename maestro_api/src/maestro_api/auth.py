import hmac
import time
import threading
from collections import defaultdict
from typing import Callable

from flask import Flask, g, jsonify, request

from maestro_api.config import APIKeyConfig


class InMemoryRateLimiter:
    """Thread-safe in-memory rate limiter for API keys.

    Limitation: the counters live in the process memory, so the limit is
    enforced per worker process, not globally. Under several workers
    (e.g. ``gunicorn -w N``) the effective limit is multiplied by N, and all
    counters are reset when the API server restarts. It is a best-effort
    throttle, not a hard global guarantee.
    """
    def __init__(self):
        self.requests: dict[str, list[float]] = defaultdict(list)
        self.lock = threading.Lock()

    def is_allowed(self, key: str, limit_per_minute: int) -> bool:
        now = time.time()
        window_start = now - 60.0

        with self.lock:
            # Clean up old requests outside the 60-second window
            self.requests[key] = [t for t in self.requests[key] if t > window_start]

            if len(self.requests[key]) < limit_per_minute:
                self.requests[key].append(now)
                return True
            return False


# Global rate limiter instance
rate_limiter = InMemoryRateLimiter()


def _get_required_scope(method: str) -> str:
    """Map HTTP method to required scope."""
    if method in {"GET", "HEAD", "OPTIONS"}:
        return "read"
    return "write"  # POST, PUT, PATCH, DELETE require 'write' or 'admin'


def _extract_api_key() -> str | None:
    key = request.headers.get("X-API-Key", "").strip()
    if key:
        return key

    auth_header = request.headers.get("Authorization", "").strip()
    if auth_header.lower().startswith("bearer "):
        return auth_header[7:].strip()

    return  None


def register_api_key_auth(app: Flask) -> None:
    @app.before_request
    def check_api_key():  # noqa: ANN001
        # ============================================================
        # CRITICAL: Skip authentication for CORS preflight requests.
        #
        # Browsers send OPTIONS requests WITHOUT custom headers (like
        # X-API-Key) to check if the server allows cross-origin requests.
        # If we require auth here, preflight fails with 401, and the
        # browser blocks the actual request.
        # ============================================================
        if request.method == "OPTIONS":
            return None
        provided_key = _extract_api_key()
        if not provided_key:
            return (
                jsonify({
                    "error": "API key is required. "
                    "Provide it via X-API-Key or Authorization: Bearer header."
                }),
                401,
            )

        # Find matching key config
        key_config: APIKeyConfig | None = None
        for cfg in app.config.get("API_KEYS_CONFIG", []):
            if hmac.compare_digest(provided_key, cfg.key):
                key_config = cfg
                break

        if not key_config:
            return jsonify({"error": "Invalid API key."}), 403

        if key_config.is_expired():
            return jsonify({"error": "API key has expired."}), 403

        # Check scopes
        required_scope = _get_required_scope(request.method)
        if not key_config.has_scope(required_scope):
            return jsonify({
                "error": f"API key lacks '{required_scope}' permission for {request.method} requests."
            }), 403

        # Check rate limit
        if not rate_limiter.is_allowed(provided_key, key_config.rate_limit_per_minute):
            return jsonify({
                "error": f"Rate limit exceeded. Max {key_config.rate_limit_per_minute} requests per minute."
            }), 429

        # Store validated key info in Flask's g object for potential use in routes/logging
        g.api_key_config = key_config

        return None
