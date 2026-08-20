"""Defense-in-depth security headers are present on responses.

These are a cheap secondary control (the real XSS/clickjacking surface is the
frontend), so this only checks that the headers are actually emitted.
"""


def test_core_security_headers_present(client, read_key):
    resp = client.get("/test", headers={"X-API-Key": read_key})

    csp = resp.headers.get("Content-Security-Policy", "")
    assert "default-src 'none'" in csp
    assert "frame-ancestors 'none'" in csp

    assert resp.headers.get("X-Frame-Options") == "DENY"
    assert resp.headers.get("X-Content-Type-Options") == "nosniff"
    assert resp.headers.get("Cross-Origin-Opener-Policy") == "same-origin"


def test_hsts_present_when_not_debug(client, read_key):
    # conftest sets MAESTRO_API_DEBUG=false, so HSTS must be emitted.
    resp = client.get("/test", headers={"X-API-Key": read_key})
    assert "Strict-Transport-Security" in resp.headers
