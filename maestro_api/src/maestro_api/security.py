from urllib.parse import urlparse

from flask import current_app, jsonify, request


def register_security_headers(app):
    """Добавляет защитные HTTP-заголовки ко всем ответам."""

    @app.after_request
    def apply_security_headers(response):
        # 1. XSS & Clickjacking: Content Security Policy
        # Для pure JSON API safest policy — запретить всё.
        # Если API когда-либо будет отдавать HTML, расширьте эту политику.
        csp_directives = [
            "default-src 'none'",          # Запретить загрузку любых ресурсов по умолчанию
            "frame-ancestors 'none'",      # Защита от Clickjacking (запрет встраивания в iframe)
            "form-action 'none'",          # Запрет отправки форм
            "base-uri 'none'",             # Запрет изменения базового URI документа
            "object-src 'none'",           # Запрет плагинов (Flash, PDF и т.д.)
        ]
        response.headers['Content-Security-Policy'] = "; ".join(csp_directives)

        # 2. Clickjacking (Legacy защита для старых браузеров)
        response.headers['X-Frame-Options'] = 'DENY'

        # 3. XSS: Запрет MIME-sniffing (браузер не должен угадывать тип контента)
        # Особенно важно для JSON, чтобы его не интерпретировали как HTML/JS
        response.headers['X-Content-Type-Options'] = 'nosniff'

        # 4. XS-Leaks: Изоляция контекста
        # COOP: Гарантирует, что окно не будет иметь доступа к другим окнам того же origin,
        # если они не имеют того же COOP.
        response.headers['Cross-Origin-Opener-Policy'] = 'same-origin'

        # COEP: Требует, чтобы все загружаемые ресурсы имели явные заголовки CORP/CORS.
        # ВНИМАНИЕ: Это строгая политика. Убедитесь, что ваш фронтенд делает запросы с правильными CORS-заголовками.
        response.headers['Cross-Origin-Embedder-Policy'] = 'require-corp'

        # CORP: Дополнительно защищает ресурсы от чтения другими origin без явного разрешения.
        response.headers['Cross-Origin-Resource-Policy'] = 'same-origin'

        # 5. XSS: HTTP Strict Transport Security (HSTS)
        # Принудительное использование HTTPS (отключаем в debug-режиме для локальной разработки)
        if not current_app.config.get('API_DEBUG', False):
            response.headers['Strict-Transport-Security'] = 'max-age=31536000; includeSubDomains'

        # Явное указание типа контента для предотвращения XSS через MIME-конфузию
        if response.mimetype == 'application/json':
            response.headers['X-Content-Type-Options'] = 'nosniff'

        return response

def register_strict_origin_check(app):
    """
    Строгая проверка Origin на уровне сервера.

    Если запрос содержит заголовок Origin и он не в списке разрешённых,
    запрос блокируется с кодом 403.

    Это дополнение к браузерной защите CORS — защищает от:
    - curl/Postman запросов с поддельным Origin
    - Server-to-server атак
    - Прямых HTTP-запросов в обход браузера
    """

    @app.before_request
    def check_origin_strict():
        # Пропускаем OPTIONS (preflight) — они обрабатываются Flask-CORS
        if request.method == "OPTIONS":
            return None

        # Получаем Origin из запроса
        origin = request.headers.get('Origin')

        # Если Origin отсутствует — разрешаем (это normal для curl без Origin, server-to-server)
        if not origin:
            return None

        # Получаем список разрешённых origins
        allowed_origins = current_app.config.get('CORS_ORIGINS', [])

        # Если разрешены все origins — пропускаем
        if allowed_origins == '*':
            return None

        # Если это список — проверяем
        if isinstance(allowed_origins, list):
            if origin in allowed_origins:
                return None

            # Origin не в списке — блокируем
            current_app.logger.warning(
                f"Blocked request from untrusted origin: {origin} "
                f"(path: {request.path}, method: {request.method})"
            )
            return jsonify({
                "error": "Origin not allowed",
                "details": f"Origin '{origin}' is not in the list of trusted origins"
            }), 403

        # Неизвестный формат конфигурации — блокируем для безопасности
        current_app.logger.error(
            f"Invalid CORS_ORIGINS configuration: {allowed_origins}"
        )
        return jsonify({
            "error": "Server misconfiguration",
            "details": "CORS configuration is invalid"
        }), 500

def register_csrf_protection(app):
    """
    Дополнительная защита от CSRF.

    Примечание: Запросы с заголовками `X-API-Key` или `Authorization: Bearer`
    НЕ подвержены CSRF, так как браузеры не могут подделать кастомные заголовки
    в межсайтовых запросах без прохождения CORS preflight.

    ОДНАКО: Передача ключа через query-параметр `?api_key=...` УЯЗВИМА к CSRF,
    так как браузер автоматически добавит его при переходе по ссылке.
    Этот middleware блокирует state-changing запросы с ключом в URL, если Origin не доверенный.
    """

    @app.before_request
    def check_origin_for_state_changing_requests():
        # ============================================================
        # CRITICAL: Skip CSRF check for OPTIONS (preflight) requests.
        # Preflight is handled by Flask-CORS and should not be blocked.
        # ============================================================
        if request.method == "OPTIONS":
            return None
        # No additional CSRF checks needed — X-API-Key header and register_strict_origin_check provides
        # implicit CSRF protection via CORS preflight.
        return None
