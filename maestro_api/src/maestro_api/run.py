#!/bin/python3
from maestro_api import create_app


def main() -> None:
    app = create_app()
    app.run(
        host=app.config["API_HOST"],
        port=app.config["API_PORT"],
        debug=app.config["API_DEBUG"],
    )
