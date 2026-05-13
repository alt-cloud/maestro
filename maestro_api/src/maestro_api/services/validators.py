import ipaddress
import re
from typing import Any

TABLE_COMMANDS = {
    "containers",
    "memory",
    "mounts",
    "netstat",
    "processes",
    "service",
    "stats",
    "time",
    "usage",
}

TEXT_COMMANDS = {
    "dmesg",
    "version",
}

APPLY_ACTIONS = {"controlplane", "worker"}
VIRTUAL_CLUSTERS = {"_Orphans", "_Unknown"}

_CLUSTER_NAME_RE = re.compile(r"^[A-Za-z0-9_][A-Za-z0-9_.-]{0,62}$")
_COMMAND_SEGMENT_RE = re.compile(r"^[A-Za-z0-9_.:-]+$")


def _validate_command_segments(value: str, field_name: str) -> None:
    if not isinstance(value, str) or not value:
        raise ValueError(f"'{field_name}' must be a non-empty string")
    if len(value) > 256:
        raise ValueError(f"'{field_name}' is too long")
    if value.startswith("/") or value.endswith("/") or "//" in value:
        raise ValueError(f"'{field_name}' has invalid path format")

    for segment in value.split("/"):
        if not segment or not _COMMAND_SEGMENT_RE.fullmatch(segment):
            raise ValueError(f"'{field_name}' contains unsupported characters")


def is_table_command(cmd: str) -> bool:
    return cmd in TABLE_COMMANDS or cmd.startswith("etcd/") or cmd.startswith("image/")


def is_text_command(cmd: str) -> bool:
    return cmd in TEXT_COMMANDS or cmd.startswith("logs/") or cmd.startswith("inspect/")


def validate_cluster_name(cluster_name: str) -> None:
    if not isinstance(cluster_name, str) or not cluster_name:
        raise ValueError("'cluster' must be a non-empty string")
    if cluster_name in {".", ".."}:
        raise ValueError("Cluster name cannot be '.' or '..'")
    if "/" in cluster_name or "\\" in cluster_name:
        raise ValueError("Cluster name cannot contain path separators")
    if not _CLUSTER_NAME_RE.fullmatch(cluster_name):
        raise ValueError("Cluster name contains unsupported characters")
    if cluster_name.startswith("_") and cluster_name not in VIRTUAL_CLUSTERS:
        raise ValueError("Cluster names starting with '_' are reserved")


def validate_ip_address(value: str, field_name: str) -> None:
    if not isinstance(value, str) or not value:
        raise ValueError(f"'{field_name}' must be a non-empty string")
    try:
        ipaddress.ip_address(value)
    except ValueError as err:
        raise ValueError(f"'{field_name}' must be a valid IP address") from err


def validate_talos_command(cmd: str) -> None:
    _validate_command_segments(cmd, "cmd")
    if cmd in {"get", "support"}:
        return
    if is_table_command(cmd) or is_text_command(cmd):
        return
    raise ValueError("Unsupported 'cmd' value")


def validate_talos_subcommand(sub_command: str) -> None:
    _validate_command_segments(sub_command, "subCommand")


def validate_scan_networks(scan_networks: Any) -> list[str]:
    if not isinstance(scan_networks, list):
        raise ValueError("'scanNets' must be a list")
    if not scan_networks:
        raise ValueError("'scanNets' cannot be empty")

    validated_networks: list[str] = []
    for value in scan_networks:
        if not isinstance(value, str):
            raise ValueError("Each item in 'scanNets' must be a string")
        try:
            normalized = str(ipaddress.ip_network(value, strict=False))
        except ValueError as err:
            raise ValueError(f"Invalid network format: {value}") from err
        validated_networks.append(normalized)

    return list(dict.fromkeys(validated_networks))


def validate_apply_actions(actions: Any) -> dict[str, list[str]]:
    if not isinstance(actions, dict):
        raise ValueError("Actions must be an object")
    if not actions:
        raise ValueError("Actions object cannot be empty")

    normalized_actions: dict[str, list[str]] = {}
    for action, ips in actions.items():
        if action not in APPLY_ACTIONS:
            raise ValueError(f"Unsupported action '{action}'")
        if not isinstance(ips, list):
            raise ValueError(f"Action '{action}' must be a list")

        normalized_ips: list[str] = []
        for ip in ips:
            validate_ip_address(ip, f"{action} item")
            normalized_ips.append(ip)

        normalized_actions[action] = list(dict.fromkeys(normalized_ips))

    return normalized_actions
