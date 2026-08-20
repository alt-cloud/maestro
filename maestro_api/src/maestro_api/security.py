import ipaddress

from flask import current_app, jsonify, request


def register_security_headers(app):
    """Add protective HTTP headers to every response."""

    @app.after_request
    def apply_security_headers(response):
        # 1. XSS & Clickjacking: Content Security Policy.
        # For a pure JSON API the safest policy is to forbid everything.
        # If the API ever serves HTML, widen this policy.
        csp_directives = [
            "default-src 'none'",          # Forbid loading any resource by default
            "frame-ancestors 'none'",      # Anti-clickjacking (no embedding in an iframe)
            "form-action 'none'",          # Forbid form submissions
            "base-uri 'none'",             # Forbid changing the document base URI
            "object-src 'none'",           # Forbid plugins (Flash, PDF, etc.)
        ]
        response.headers['Content-Security-Policy'] = "; ".join(csp_directives)

        # 2. Clickjacking (legacy protection for old browsers).
        response.headers['X-Frame-Options'] = 'DENY'

        # 3. XSS: forbid MIME sniffing (the browser must not guess the content type).
        # Matters for JSON so it is not interpreted as HTML/JS.
        response.headers['X-Content-Type-Options'] = 'nosniff'

        # 4. XS-Leaks: browsing-context isolation.
        # COOP: ensures the window cannot access other windows of the same origin
        # unless they share the same COOP.
        response.headers['Cross-Origin-Opener-Policy'] = 'same-origin'

        # COEP: requires every loaded resource to carry explicit CORP/CORS headers.
        # NOTE: strict policy — make sure the frontend sends proper CORS headers.
        response.headers['Cross-Origin-Embedder-Policy'] = 'require-corp'

        # CORP: additionally protects resources from being read by other origins
        # without explicit permission.
        response.headers['Cross-Origin-Resource-Policy'] = 'same-origin'

        # 5. HTTP Strict Transport Security (HSTS): force HTTPS.
        # Disabled in debug mode for local development.
        if not current_app.config.get('API_DEBUG', False):
            response.headers['Strict-Transport-Security'] = 'max-age=31536000; includeSubDomains'
        return response


def register_ip_whitelist_check(app):
    """Register a before_request hook that checks the client IP against the
    pre-parsed whitelist in app.config["API_WHITELIST"].
    """

    @app.before_request
    def check_api_whitelist():
        # Skip preflight requests — handled by Flask-CORS.
        if request.method == "OPTIONS":
            return None

        # Already-parsed whitelist from the config (a WhitelistConfig object).
        whitelist = current_app.config.get("API_WHITELIST")

        # If the whitelist is empty (env var not set) no filtering is applied:
        # if the admin did not configure a whitelist, it is not needed.
        if whitelist is None or (not whitelist.ip_networks):
            return None

        # Client IP. ProxyFix (applied in create_app) makes request.remote_addr
        # hold the real client IP taken from the X-Forwarded-For header.
        client_ip_str = request.remote_addr

        try:
            client_ip = ipaddress.ip_address(client_ip_str)
        except ValueError:
            current_app.logger.warning(
                f"Cannot determine a valid client IP: {client_ip_str}"
            )
            return jsonify({"error": "Invalid client IP format"}), 400

        # Deny unless the client IP falls into one of the whitelisted networks
        # (mask-aware).
        ip_allowed = any(client_ip in network for network in whitelist.ip_networks)

        if not ip_allowed:
            current_app.logger.warning(
                f"Access blocked: IP '{client_ip_str}' is not in the whitelist."
            )
            return jsonify({
                "error": "Access denied",
                "details": "Your IP or Host is not in the API whitelist."
            }), 403

        return None
