"""Shared pytest fixtures for the security tests.

The environment must be configured BEFORE ``maestro_api.config`` is imported,
because ``Config`` reads the environment at class-definition time. pytest imports
this conftest before collecting the test modules, so setting os.environ here (and
importing the app lazily inside fixtures) guarantees the right order.
"""

import json
import os

READ_KEY = "read-key-0123456789abcdef"
WRITE_KEY = "write-key-0123456789abcdef"
ADMIN_KEY = "admin-key-0123456789abcdef"

ALLOWED_ORIGIN = "https://maestro.example.com"
DISALLOWED_ORIGIN = "https://evil.example.org"

os.environ["MAESTRO_API_KEYS"] = json.dumps(
    [
        {"key": READ_KEY, "scopes": ["read"], "rate_limit_per_minute": 60},
        {"key": WRITE_KEY, "scopes": ["write"], "rate_limit_per_minute": 60},
        {"key": ADMIN_KEY, "scopes": ["admin"], "rate_limit_per_minute": 60},
    ]
)
os.environ["MAESTRO_CORS_ORIGINS"] = f"http://localhost:4466,{ALLOWED_ORIGIN}"
os.environ["MAESTRO_API_WHITELIST"] = "127.0.0.1"
os.environ["MAESTRO_API_DEBUG"] = "false"

import pytest  # noqa: E402


@pytest.fixture()
def app():
    from maestro_api import create_app

    application = create_app()
    application.config.update(TESTING=True)
    return application


@pytest.fixture()
def client(app):
    return app.test_client()


@pytest.fixture(autouse=True)
def _reset_rate_limiter():
    """Keep the process-global rate limiter from leaking between tests."""
    from maestro_api.auth import rate_limiter

    rate_limiter.requests.clear()
    yield
    rate_limiter.requests.clear()


@pytest.fixture()
def read_key():
    return READ_KEY


@pytest.fixture()
def write_key():
    return WRITE_KEY
