"""IP whitelist behaviour and parsing."""

import ipaddress

import pytest

from maestro_api.config import WhitelistConfig, parse_api_whitelist


def test_whitelisted_ip_is_allowed(client, read_key):
    # Default test client remote_addr is 127.0.0.1, which is whitelisted.
    resp = client.get("/test", headers={"X-API-Key": read_key})
    assert resp.status_code == 200


def test_non_whitelisted_ip_is_blocked(client, read_key):
    # Valid key, but the request comes from an IP outside the whitelist -> 403.
    resp = client.get(
        "/test",
        headers={"X-API-Key": read_key},
        environ_base={"REMOTE_ADDR": "9.9.9.9"},
    )
    assert resp.status_code == 403
    assert "denied" in resp.get_json()["error"].lower()


def test_empty_whitelist_allows_any_ip(app, read_key):
    app.config["API_WHITELIST"] = WhitelistConfig(ip_networks=[])
    resp = app.test_client().get(
        "/test",
        headers={"X-API-Key": read_key},
        environ_base={"REMOTE_ADDR": "9.9.9.9"},
    )
    assert resp.status_code == 200


def test_parse_whitelist_accepts_mask():
    parsed = parse_api_whitelist("10.0.0.0/24")
    assert ipaddress.ip_address("10.0.0.5") in parsed.ip_networks[0]
    assert ipaddress.ip_address("10.0.1.5") not in parsed.ip_networks[0]


def test_parse_whitelist_rejects_garbage():
    with pytest.raises(ValueError):
        parse_api_whitelist("http://not-an-ip")
