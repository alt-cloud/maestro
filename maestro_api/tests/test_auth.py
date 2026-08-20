"""API-key authentication behaviour (not just header presence)."""

from datetime import datetime, timedelta, timezone


def test_missing_key_returns_401(client):
    resp = client.get("/test")
    assert resp.status_code == 401


def test_invalid_key_returns_403(client):
    resp = client.get("/test", headers={"X-API-Key": "totally-wrong-key-xxxx"})
    assert resp.status_code == 403


def test_valid_read_key_allows_get(client, read_key):
    resp = client.get("/test", headers={"X-API-Key": read_key})
    assert resp.status_code == 200


def test_bearer_scheme_is_accepted(client, read_key):
    resp = client.get("/test", headers={"Authorization": f"Bearer {read_key}"})
    assert resp.status_code == 200


def test_read_key_cannot_write(client, read_key):
    # POST requires the 'write' scope; a read key must be rejected at auth (403),
    # before method dispatch.
    resp = client.post("/test", headers={"X-API-Key": read_key})
    assert resp.status_code == 403


def test_write_key_passes_scope_check(client, write_key):
    # Auth passes for a write key, so we reach routing and get 405 (no POST
    # handler on /test) — i.e. NOT blocked by auth.
    resp = client.post("/test", headers={"X-API-Key": write_key})
    assert resp.status_code == 405


def test_options_preflight_bypasses_auth(client):
    # Browsers send OPTIONS without custom headers; it must not be 401.
    resp = client.options("/test")
    assert resp.status_code != 401


def test_expired_key_returns_403(app):
    from maestro_api.config import APIKeyConfig

    expired = APIKeyConfig(
        key="expired-key-0123456789ab",
        scopes=["read"],
        rate_limit_per_minute=60,
        expires_at=datetime.now(timezone.utc) - timedelta(days=1),
    )
    app.config["API_KEYS_CONFIG"] = [expired]

    resp = app.test_client().get("/test", headers={"X-API-Key": expired.key})
    assert resp.status_code == 403
    assert "expired" in resp.get_json()["error"].lower()


def test_rate_limit_returns_429(app):
    from maestro_api.auth import rate_limiter
    from maestro_api.config import APIKeyConfig

    limited = APIKeyConfig(
        key="rate-key-0123456789abcd",
        scopes=["read"],
        rate_limit_per_minute=2,
        expires_at=None,
    )
    app.config["API_KEYS_CONFIG"] = [limited]
    rate_limiter.requests.clear()

    client = app.test_client()
    headers = {"X-API-Key": limited.key}
    assert client.get("/test", headers=headers).status_code == 200
    assert client.get("/test", headers=headers).status_code == 200
    assert client.get("/test", headers=headers).status_code == 429
