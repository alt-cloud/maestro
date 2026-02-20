import os
from typing import Union


def parse_cors_origins(raw_value: str) -> Union[str, list[str]]:
    if raw_value.strip() == "*":
        return "*"
    return [origin.strip() for origin in raw_value.split(",") if origin.strip()]


def parse_positive_float(env_name: str, default_value: float) -> float:
    raw_value = os.getenv(env_name, str(default_value))
    try:
        parsed = float(raw_value)
    except ValueError as err:
        raise ValueError(f"{env_name} must be a positive number") from err

    if parsed <= 0:
        raise ValueError(f"{env_name} must be greater than zero")
    return parsed


def parse_bool(env_name: str, default_value: bool) -> bool:
    raw_value = os.getenv(env_name, "true" if default_value else "false").strip().lower()
    if raw_value in {"1", "true", "yes", "on"}:
        return True
    if raw_value in {"0", "false", "no", "off"}:
        return False
    raise ValueError(f"{env_name} must be a boolean value (true/false)")


class Config:
    API_HOST = os.getenv("MAESTRO_API_HOST", "127.0.0.1")
    API_PORT = int(os.getenv("MAESTRO_API_PORT", "5000"))
    API_DEBUG = os.getenv("MAESTRO_API_DEBUG", "false").lower() == "true"
    CORS_ORIGINS = parse_cors_origins(os.getenv("MAESTRO_CORS_ORIGINS", "*"))
    TALOS_VERIFY_CERTIFICATES = parse_bool("MAESTRO_TALOS_VERIFY_CERTIFICATES", True)
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
