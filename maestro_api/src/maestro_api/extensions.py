from flask import Flask
from flask_cors import CORS

def init_extensions(app: Flask) -> None:
    """
    Инициализирует расширения Flask.
    CORS настраивается строго на основе списка доменов из app.config["CORS_ORIGINS"].
    """
    cors_origins = app.config.get("CORS_ORIGINS", [])

    # Дополнительная защита на уровне типа: если вдруг в конфиге оказался "*", блокируем
    if cors_origins == "*" or (isinstance(cors_origins, list) and "*" in cors_origins):
        raise ValueError(
            "Инициализация CORS с '*' запрещена. Проверьте конфигурацию CORS_ORIGINS."
        )

    # Единая и корректная инициализация без дублирования
    CORS(
        app,
        origins=cors_origins,
        supports_credentials=False,
        allow_headers=["X-API-Key", "Authorization", "Content-Type"],
        methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
        max_age=3600,  # Кэшируем preflight на 1 час
    )
