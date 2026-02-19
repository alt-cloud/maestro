import os
from typing import Union


def parse_cors_origins(raw_value: str) -> Union[str, list[str]]:
    if raw_value.strip() == "*":
        return "*"
    return [origin.strip() for origin in raw_value.split(",") if origin.strip()]


class Config:
    API_HOST = os.getenv("MAESTRO_API_HOST", "127.0.0.1")
    API_PORT = int(os.getenv("MAESTRO_API_PORT", "5000"))
    API_DEBUG = os.getenv("MAESTRO_API_DEBUG", "false").lower() == "true"
    CORS_ORIGINS = parse_cors_origins(os.getenv("MAESTRO_CORS_ORIGINS", "*"))
