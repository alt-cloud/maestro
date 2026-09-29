#!/bin/python3

# SPDX-FileCopyrightText: 2026 BaseALT LLC
#
# SPDX-License-Identifier: MPL-2.0

from maestro_api import create_app


def main() -> None:
    app = create_app()
    app.run(
        host=app.config["API_HOST"],
        port=app.config["API_PORT"],
        debug=app.config["API_DEBUG"],
    )
