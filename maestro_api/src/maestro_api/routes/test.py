# SPDX-FileCopyrightText: 2026 BaseALT LLC
#
# SPDX-License-Identifier: MPL-2.0

from flask import Blueprint, jsonify

test_bp = Blueprint("test", __name__)

@test_bp.route("/test", methods=["GET"])
def test():
    return jsonify({})
