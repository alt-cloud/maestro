from flask import Flask
from flask_cors import CORS

cors = CORS()


def init_extensions(app: Flask) -> None:
    cors.init_app(app, origins=app.config["CORS_ORIGINS"])
