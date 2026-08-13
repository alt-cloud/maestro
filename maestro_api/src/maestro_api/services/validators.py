import base64
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


VALID_ARCHES = {"amd64", "arm64"}
VALID_CNI_NAMES = {"flannel", "custom", "none"}


def _normalize_kube_version(image_config: dict) -> str:
    # Applied via `talosctl gen config --kubernetes-version`, which expects the
    # version without a leading "v" (e.g. "1.35.5", not "v1.35.5").
    kube_version = image_config.get("kubernetesVersion", "")
    if not isinstance(kube_version, str):
        raise ValueError("imageConfig.kubernetesVersion must be a string")
    return re.sub(r"^v", "", kube_version.strip())


def validate_image_config(image_config: Any) -> dict:
    if not isinstance(image_config, dict):
        raise ValueError("imageConfig must be an object")

    installer_url = image_config.get("installerImageUrl")
    if installer_url is not None:
        if not isinstance(installer_url, str) or not installer_url.strip():
            raise ValueError("imageConfig.installerImageUrl must be a non-empty string")
        result: dict = {"installerImageUrl": installer_url.strip()}
        # CNI and Kubernetes version are applied via talosctl gen config
        # regardless of the image source.
        cni = image_config.get("cni", "")
        if not isinstance(cni, str):
            raise ValueError("imageConfig.cni must be a string")
        if cni.strip():
            result["cni"] = cni.strip()
        kube_version = _normalize_kube_version(image_config)
        if kube_version:
            result["kubernetesVersion"] = kube_version
        return result

    version = image_config.get("version")
    if not isinstance(version, str) or not version.strip():
        raise ValueError("imageConfig.version must be a non-empty string")

    arch = image_config.get("arch", "amd64")
    if arch not in VALID_ARCHES:
        raise ValueError(f"imageConfig.arch must be one of: {', '.join(sorted(VALID_ARCHES))}")

    secure_boot = image_config.get("secureBoot", False)
    if not isinstance(secure_boot, bool):
        raise ValueError("imageConfig.secureBoot must be a boolean")

    extensions = image_config.get("extensions", [])
    if not isinstance(extensions, list):
        raise ValueError("imageConfig.extensions must be a list")
    for ext in extensions:
        if not isinstance(ext, str) or not ext.strip():
            raise ValueError("imageConfig.extensions items must be non-empty strings")

    kernel_args = image_config.get("kernelArgs", [])
    if not isinstance(kernel_args, list):
        raise ValueError("imageConfig.kernelArgs must be a list")
    for arg in kernel_args:
        if not isinstance(arg, str) or not arg.strip():
            raise ValueError("imageConfig.kernelArgs items must be non-empty strings")

    cni = image_config.get("cni", "")
    if not isinstance(cni, str):
        raise ValueError("imageConfig.cni must be a string")

    return {
        "version": version.strip(),
        "arch": arch,
        "secureBoot": secure_boot,
        "extensions": [e.strip() for e in extensions],
        "kernelArgs": [a.strip() for a in kernel_args],
        "cni": cni.strip(),
        "kubernetesVersion": _normalize_kube_version(image_config),
    }


def _validate_patch_file(patch: Any, field_name: str) -> dict:
    if not isinstance(patch, dict):
        raise ValueError(f"'{field_name}' item must be an object")

    name = patch.get("name")
    if not isinstance(name, str) or not name.strip():
        raise ValueError(f"'{field_name}' item 'name' must be a non-empty string")

    content = patch.get("content")
    if not isinstance(content, str) or not content.strip():
        raise ValueError(f"'{field_name}' item 'content' must be a non-empty string")

    try:
        base64.b64decode(content, validate=True)
    except Exception as err:
        raise ValueError(f"'{field_name}' item '{name}' content must be valid base64") from err

    return {"name": name.strip(), "content": content}


def _validate_patch_list(patches: Any, field_name: str) -> list[dict]:
    if not isinstance(patches, list):
        raise ValueError(f"'{field_name}' must be a list")
    return [_validate_patch_file(p, field_name) for p in patches]


def validate_patches(patches: Any) -> dict:
    if not isinstance(patches, dict):
        raise ValueError("patches must be an object")

    result: dict = {
        "common": _validate_patch_list(patches.get("common", []), "patches.common"),
        "controlplane": _validate_patch_list(patches.get("controlplane", []), "patches.controlplane"),
        "worker": _validate_patch_list(patches.get("worker", []), "patches.worker"),
        "nodes": {},
    }

    nodes = patches.get("nodes", {})
    if not isinstance(nodes, dict):
        raise ValueError("patches.nodes must be an object")
    for ip, node_patches in nodes.items():
        validate_ip_address(ip, "patches.nodes key")
        result["nodes"][ip] = _validate_patch_list(node_patches, f"patches.nodes.{ip}")

    return result


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
