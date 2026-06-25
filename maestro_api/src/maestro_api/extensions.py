from flask import Flask
from flask_cors import CORS

cors = CORS()


def init_extensions(app: Flask) -> None:
    cors.init_app(app, origins=app.config["CORS_ORIGINS"])
    cors_origins = app.config.get("CORS_ORIGINS", "localhost")
    if cors_origins == "*":
        CORS(
            app,
            supports_credentials=True,
            # Разрешаем кастомные заголовки
            allow_headers=["X-API-Key", "Authorization", "Content-Type"],
            # Разрешаем все методы, включая OPTIONS
            methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
        )
    else:
        CORS(
            app,
            origins=cors_origins,
            supports_credentials=True,
            allow_headers=["X-API-Key", "Authorization", "Content-Type"],
            methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
            # Кэшируем preflight на 1 час, чтобы уменьшить нагрузку
            max_age=3600,
        )
