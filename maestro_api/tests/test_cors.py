"""CORS behaviour: allowed vs blocked origin, no credentials, no wildcard."""

import pytest

from conftest import ALLOWED_ORIGIN, DISALLOWED_ORIGIN
from maestro_api.config import parse_cors_origins


def test_allowed_origin_gets_acao(client, read_key):
    resp = client.get(
        "/test", headers={"X-API-Key": read_key, "Origin": ALLOWED_ORIGIN}
    )
    assert resp.headers.get("Access-Control-Allow-Origin") == ALLOWED_ORIGIN


def test_disallowed_origin_gets_no_acao(client, read_key):
    resp = client.get(
        "/test", headers={"X-API-Key": read_key, "Origin": DISALLOWED_ORIGIN}
    )
    assert resp.headers.get("Access-Control-Allow-Origin") != DISALLOWED_ORIGIN


def test_credentials_are_not_advertised(client, read_key):
    # supports_credentials=False -> the ACAC header must never appear.
    resp = client.get(
        "/test", headers={"X-API-Key": read_key, "Origin": ALLOWED_ORIGIN}
    )
    assert "Access-Control-Allow-Credentials" not in resp.headers


def test_wildcard_origin_is_prohibited():
    with pytest.raises(RuntimeError):
        parse_cors_origins("*")
