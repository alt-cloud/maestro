#!/bin/python3
from app import create_app

app = create_app()


def main() -> None:
    app.run(
        host=app.config["API_HOST"],
        port=app.config["API_PORT"],
        debug=app.config["API_DEBUG"],
    )


if __name__ == "__main__":
    main()
