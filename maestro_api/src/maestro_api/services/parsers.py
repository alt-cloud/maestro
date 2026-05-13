import json
from typing import Any


def parse_talos_json_stream(raw_output: str) -> list[dict[str, Any]]:
    text = (raw_output or "").strip()
    if not text:
        return []

    normalized = f"[{text.replace('}\n{', '},{')}]"
    return json.loads(normalized)
