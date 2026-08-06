import os
import json
from dataclasses import dataclass
from datetime import datetime, timezone
import ipaddress
from typing import List, Set, Union

LOCALHOST_ORIGINS = [
    "http://localhost",
    "http://127.0.0.1",
    "http://localhost:4466",
    "http://127.0.0.1:4466",
]

@dataclass
class APIKeyConfig:
    key: str
    scopes: list[str]
    rate_limit_per_minute: int
    expires_at: datetime | None

    def is_expired(self) -> bool:
        if not self.expires_at:
            return False
        return datetime.now(timezone.utc) > self.expires_at

    def has_scope(self, required_scope: str) -> bool:
        # 'admin' implicitly grants all permissions
        return "admin" in self.scopes or required_scope in self.scopes

def parse_cors_origins(raw_value: str) -> List[str]:
    """
    Парсит разрешённые CORS-источники из строки окружения.
    Использование '*' запрещено из соображений безопасности.
    """
    stripped = raw_value.strip()

    if stripped == "*":
        raise RuntimeError(
            "Using MAESTRO_CORS_ORIGINS='*' is prohibited for security reasons. "
            "Please provide a specific list of IP addresses separated by commas. "
            "(for example, 'http://127.0.0.1:4466')."
        )

    if not stripped or stripped.lower() in ("localhost", "127.0.0.1"):
        return LOCALHOST_ORIGINS.copy()

    # Преобразуем строку с разделителями-запятыми в список
    return [origin.strip() for origin in stripped.split(",") if origin.strip()]

def parse_positive_float(env_name: str, default_value: float) -> float:
    raw_value = os.getenv(env_name, str(default_value))
    try:
        parsed = float(raw_value)
    except ValueError as err:
        raise ValueError(f"{env_name} must be a positive number") from err

    if parsed <= 0:
        raise ValueError(f"{env_name} must be greater than zero")
    return parsed

def parse_api_keys_config(raw_value: str) -> list[APIKeyConfig]:
    """Parse JSON array of API key configurations."""
    if not raw_value or raw_value.strip() == "":
        return []
    try:
        data = json.loads(raw_value)
    except json.JSONDecodeError as err:
        raise ValueError(f"MAESTRO_API_KEYS is not valid JSON: {err}")

    if not isinstance(data, list):
        raise ValueError("MAESTRO_API_KEYS must be a JSON array")

    configs = []
    for i, item in enumerate(data):
        if not isinstance(item, dict):
            raise ValueError(f"Item {i} in MAESTRO_API_KEYS must be an object")

        key = item.get("key", "").strip()
        if not key:
            raise ValueError(f"Item {i} in MAESTRO_API_KEYS is missing 'key'")
        if len(key) < 16:
            raise ValueError(f"Key in item {i} is too short (min 16 chars)")

        scopes = item.get("scopes", [])
        if not isinstance(scopes, list) or not scopes:
            raise ValueError(f"Item {i} in MAESTRO_API_KEYS must have a non-empty 'scopes' list")

        valid_scopes = {"read", "write", "admin"}
        if not set(scopes).issubset(valid_scopes):
            raise ValueError(f"Item {i} has invalid scopes. Allowed: {valid_scopes}")

        rate_limit = item.get("rate_limit_per_minute", 60)
        if not isinstance(rate_limit, int) or rate_limit <= 0:
            raise ValueError(f"Item {i} 'rate_limit_per_minute' must be a positive integer")

        expires_at_str = item.get("expires_at")
        expires_at = None
        if expires_at_str:
            try:
                # Handle 'Z' suffix for UTC
                normalized = expires_at_str.replace("Z", "+00:00")
                expires_at = datetime.fromisoformat(normalized)
            except ValueError as err:
                raise ValueError(f"Item {i} 'expires_at' is invalid ISO 8601: {err}")

        configs.append(APIKeyConfig(
            key=key,
            scopes=scopes,
            rate_limit_per_minute=rate_limit,
            expires_at=expires_at,
        ))

    return configs

@dataclass
class WhitelistConfig:
    """Конфигурация белого списка, содержащая разобранные IP-сети."""
    ip_networks: List[Union[ipaddress.IPv4Network, ipaddress.IPv6Network]]

def parse_api_whitelist(raw_value: str) -> WhitelistConfig:
    """
    Парсит строку MAESTRO_API_WHITELIST, содержащую IP-адреса, IP-сети (с маской) и домены,
    разделенные запятыми.

    :param raw_value: Строка из переменной окружения
                      (например, "192.168.1.0/24, 10.0.0.5)
    :return: Объект WhitelistConfig со списками валидных IP-сетей.
    :raises ValueError: Если хотя бы один элемент строки не является валидным IP/сетью,
    """
    if not raw_value or not raw_value.strip():
        return WhitelistConfig(ip_networks=[])

    ip_networks: List[Union[ipaddress.IPv4Network, ipaddress.IPv6Network]] = []

    # Разделяем по запятой и убираем лишние пробелы
    items = [item.strip() for item in raw_value.split(',') if item.strip()]

    for item in items:
        try:
            # Пытаемся интерпретировать как IP-сеть или одиночный IP-адрес.
            # strict=False позволяет администратору написать 192.168.1.5/24,
            # и система автоматически исправит это на корректную сеть 192.168.1.0/24.
            # Одиночный IP (например, "10.0.0.1") будет преобразован в /32 (или /128 для IPv6).
            network = ipaddress.ip_network(item, strict=False)
            ip_networks.append(network)
        except ValueError:
            # Явно отвергаем мусорные данные (например, URL с http://, некорректные строки и т.д.)
            raise ValueError(
                f"Invalid variable format MAESTRO_API_WHITELIST: '{item}'. "
               f"Expecting IP address, IP network (e.g. 192.168.1.0/24)."
            )

    return WhitelistConfig(ip_networks=ip_networks)

class Config:
    API_HOST = os.getenv("MAESTRO_API_HOST", "127.0.0.1")
    API_PORT = int(os.getenv("MAESTRO_API_PORT", "5000"))
    API_DEBUG = os.getenv("MAESTRO_API_DEBUG", "false").lower() == "true"

    CORS_ORIGINS = parse_cors_origins(os.getenv("MAESTRO_CORS_ORIGINS", "http://127.0.0.1:4466"))

    API_WHITELIST = parse_api_whitelist(os.getenv("MAESTRO_API_WHITELIST", "127.0.0.1"))

    API_KEYS_CONFIG = parse_api_keys_config(os.getenv("MAESTRO_API_KEYS", ""))

    TALOS_COMMAND_TIMEOUT_SECONDS = parse_positive_float(
        "MAESTRO_TALOS_COMMAND_TIMEOUT_SECONDS",
        30.0,
    )
    NMAP_COMMAND_TIMEOUT_SECONDS = parse_positive_float(
        "MAESTRO_NMAP_COMMAND_TIMEOUT_SECONDS",
        120.0,
    )
    PORT_CHECK_TIMEOUT_SECONDS = parse_positive_float(
        "MAESTRO_PORT_CHECK_TIMEOUT_SECONDS",
        3.0,
    )

    # === SECURITY: Cookie Defaults ===
    # Даже если мы используем API-ключи, эти настройки защитят любые служебные куки Flask
    SESSION_COOKIE_HTTPONLY = True       # Защита от XSS (запрет чтения JS)
    SESSION_COOKIE_SECURE = not API_DEBUG # Защита от перехвата (требует HTTPS)
    SESSION_COOKIE_SAMESITE = 'Strict'   # Защита от CSRF (куки не отправляются в cross-origin запросах)

    @classmethod
    def validate(cls) -> None:
        if not cls.API_KEYS_CONFIG:
            raise RuntimeError(
                "MAESTRO_API_KEYS environment variable is required but not set or empty. "
                "Provide a valid JSON array of key configurations."
            )

        active_keys = [k for k in cls.API_KEYS_CONFIG if not k.is_expired()]
        if not active_keys:
            raise RuntimeError(
                "All configured API keys in MAESTRO_API_KEYS are expired. "
                "Please add a valid key to start the application."
            )
