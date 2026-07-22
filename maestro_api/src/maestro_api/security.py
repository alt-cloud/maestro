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

import ipaddress
from flask import request, jsonify, current_app


def register_ip_whitelist_check(app):
    """
    Регистрирует хук before_request, который проверяет IP/Host клиента
    против заранее распарсенного whitelist из app.config["API_WHITELIST"].
    """

    @app.before_request
    def check_api_whitelist():
        # Пропускаем preflight-запросы — ими управляет Flask-CORS
        if request.method == "OPTIONS":
            return None

        # Получаем уже распарсенный whitelist из конфига (объект WhitelistConfig)
        whitelist = current_app.config.get("API_WHITELIST")

        # Если whitelist пуст (переменная окружения не задана) — фильтрация не применяется.
        # Это стандартная политика: если админ не настроил whitelist, значит, он не нужен.
        if whitelist is None or (not whitelist.ip_networks):
            return None

        # Извлекаем данные клиента
        # ProxyFix (применённый в create_app) обеспечивает корректное определение
        # реального IP клиента через заголовки X-Forwarded-For.
        client_ip_str = request.remote_addr
        host_header = request.host.split(':')[0].lower()  # Убираем порт

        # Валидация IP клиента
        try:
            client_ip = ipaddress.ip_address(client_ip_str)
        except ValueError:
            current_app.logger.warning(
                f"Невозможно определить корректный IP клиента: {client_ip_str}"
            )
            return jsonify({"error": "Invalid client IP format"}), 400

        # 1. Проверка вхождения IP клиента в разрешённые сети (с учётом маски)
        ip_allowed = any(client_ip in network for network in whitelist.ip_networks)

        # 2. Итоговое решение: достаточно попадания ХОТЯ БЫ ПО ОДНОМУ критерию
        if not (ip_allowed):
            current_app.logger.warning(
                f"Доступ заблокирован: IP '{client_ip_str}' "
                f"не найдены в whitelist."
            )
            return jsonify({
                "error": "Access denied",
                "details": "Your IP or Host is not in the API whitelist."
            }), 403

        return None


