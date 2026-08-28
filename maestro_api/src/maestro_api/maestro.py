import json
import os
import shlex
import socket
import subprocess
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path
from typing import Any, TypedDict

import yaml

from maestro_api.services.validators import ORPHANS_CLUSTER_NAME

TALOS_NODE_TYPE_TO_KUBE = {"endpoints": "controlplanes", "nodes": "workers"}


class NodeClassification(TypedDict):
    ip: str
    to_cluster_name: str
    kube_node_type: str
    node_info: dict[str, Any]
    trackable: bool
    changed: bool


class CommandTimeoutError(RuntimeError):
    def __init__(self, args: list[str], timeout_seconds: float):
        command = shlex.join(args)
        super().__init__(f"Command timed out after {timeout_seconds:.1f}s: {command}")
        self.command = command
        self.timeout_seconds = timeout_seconds


def _parse_json_stream(raw_output: str) -> list[dict[str, Any]]:
    normalized = f"[{raw_output.replace('}\n{', '},{')}]"
    return json.loads(normalized)


def build_command_env(cluster_dir: str) -> dict[str, str]:
    env = os.environ.copy()
    env["clusterDir"] = cluster_dir
    env["TALOSCONFIG"] = "talosconfig"
    return env


def run_command(
    args: list[str],
    cluster_dir: str,
    timeout_seconds: float | None = None,
) -> subprocess.CompletedProcess[str]:
    if not args:
        raise ValueError("Command arguments cannot be empty")
    if timeout_seconds is not None and timeout_seconds <= 0:
        raise ValueError("timeout_seconds must be greater than zero")

    timeout_info = f" timeout={timeout_seconds}s" if timeout_seconds is not None else ""
    print(f"run_command cwd={cluster_dir} args={shlex.join(args)}{timeout_info}", flush=True)
    try:
        return subprocess.run(
            args,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            cwd=cluster_dir,
            encoding="utf-8",
            env=build_command_env(cluster_dir),
            timeout=timeout_seconds,
        )
    except subprocess.TimeoutExpired as err:
        effective_timeout = (
            timeout_seconds
            if timeout_seconds is not None
            else float(err.timeout or 0.0)
        )
        raise CommandTimeoutError(args, effective_timeout) from err


def table_to_json(text: str) -> str:
    lines = text.splitlines()
    if not lines:
        return "[]"

    header = lines[0]
    columns = header.split()
    body_lines = lines if len(columns) == 1 else lines[1:]
    if len(columns) == 1:
        header = "Id"
        columns = header.split()

    column_offsets: dict[str, dict[str, int]] = {}
    previous_column: str | None = None
    shift = 0

    for column in columns:
        column_name = column.title()
        column_offsets[column_name] = {}
        start = header[shift:].find(column) + shift

        if previous_column:
            previous_start = column_offsets[previous_column]["start"]
            if start - previous_start - len(previous_column) == 1:
                merged_column_name = previous_column + column_name
                column_offsets[merged_column_name] = {"start": previous_start}
                del column_offsets[column_name]
                del column_offsets[previous_column]
                column_name = merged_column_name
                previous_column = column_name
            else:
                column_offsets[previous_column]["end"] = start
                column_offsets[column_name]["start"] = start
                previous_column = column_name
        else:
            previous_column = column_name
            column_offsets[column_name]["start"] = start

        shift = start

    if previous_column:
        column_offsets[previous_column]["end"] = -1

    rows: list[dict[str, str]] = []
    for row in body_lines:
        if not row:
            break

        values: dict[str, str] = {}
        for column_name, offsets in column_offsets.items():
            start = offsets["start"]
            end = offsets["end"]
            values[column_name] = (
                row[start:].strip() if end < 0 else row[start:end].strip()
            )
        rows.append(values)

    return json.dumps(rows, indent=2)


def get_disk_name(ip: str, timeout_seconds: float | None = None) -> str:
    home_dir = os.getenv("HOME", "")
    command = [
        "talosctl",
        "get",
        "discoveredvolume",
        "-o",
        "json",
        "-n",
        ip,
        "-e",
        ip,
        "-i",
    ]
    result = run_command(command, home_dir, timeout_seconds=timeout_seconds)

    if result.returncode != 0:
        err = (
            result.stderr.strip()
            or result.stdout.strip()
            or "talosctl discoveredvolume command failed"
        )
        raise RuntimeError(f"Failed to detect install disk for node {ip}: {err}")

    raw_output = (result.stdout or "").strip()
    if not raw_output:
        raise RuntimeError(
            f"Failed to detect install disk for node {ip}: empty talosctl output"
        )

    try:
        volumes = _parse_json_stream(raw_output)
    except json.JSONDecodeError as err:
        raise RuntimeError(
            f"Failed to parse discovered volumes for node {ip}: {err}"
        ) from err

    for volume_info in volumes:
        metadata = volume_info.get("metadata", {})
        spec = volume_info.get("spec", {})
        disk_id = metadata.get("id", "")
        if disk_id.startswith("loop") or disk_id.startswith("sr"):
            continue
        disk = spec.get("dev_path")
        if disk:
            return disk

    raise RuntimeError(
        f"Failed to detect install disk for node {ip}: no suitable disk found"
    )


def nodes_list(nmap_output: str) -> dict[str, dict[str, str]]:
    lines = nmap_output.splitlines()
    prefix = "Nmap scan report for "
    kube_port_prefix = "6443/tcp"
    apid_port_prefix = "50000/tcp"

    nodes: dict[str, dict[str, str]] = {}
    node_state: dict[str, str] = {}

    for line in lines:
        if line.startswith(prefix):
            print(line, flush=True)
            if node_state:
                nodes[node_state["ip"]] = node_state

            node_state = {}
            tail = line[len(prefix) :].split()
            if len(tail) > 1:
                node_state["dns"] = tail[0]
                node_state["ip"] = tail[1][1:-1]
            else:
                node_state["dns"] = ""
                node_state["ip"] = tail[0]
        elif line.startswith(kube_port_prefix):
            node_state["kubeState"] = line.split()[1]
        elif line.startswith(apid_port_prefix):
            node_state["apidState"] = line.split()[1]

    if node_state and node_state.get("apidState") == "open":
        nodes[node_state["ip"]] = node_state
        print(f"nodes_list:: node_state={node_state}", flush=True)

    return nodes


def is_port_open(host: str, port: int, timeout: float = 3.0) -> bool:
    sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    sock.settimeout(timeout)
    result = sock.connect_ex((host, port))
    sock.close()
    return result == 0


def is_maintenance(ip: str, timeout_seconds: float | None = None) -> bool:
    """Tells whether the node has no machine config applied yet.

    Talos's maintenance service accepts unauthenticated requests only while no config
    is applied, so an insecure (no client certificate) machinestatus call succeeds only
    against a genuinely unconfigured node; a configured node's apid rejects it outright
    for lacking a client certificate. This needs no talosconfig for the node's cluster.
    """
    home_dir = os.getenv("HOME", "")
    command = [
        "talosctl",
        "get",
        "machinestatus",
        "-o",
        "json",
        "-n",
        ip,
        "-e",
        ip,
        "-i",
    ]
    try:
        result = run_command(command, home_dir, timeout_seconds=timeout_seconds)
    except CommandTimeoutError:
        return False
    if result.returncode != 0:
        return False

    raw_output = (result.stdout or "").strip()
    if not raw_output:
        return False

    try:
        data = json.loads(raw_output)
    except json.JSONDecodeError:
        return False

    return data.get("spec", {}).get("stage") == "maintenance"


def talos_get_spec(
    cluster_name: str,
    sub_cmd: str,
    node: str,
    timeout_seconds: float | None = None,
) -> tuple[dict[str, Any], int, str]:
    home_dir = os.getenv("HOME", "")
    maestro_config_dir = f"{home_dir}/.maestro"
    cluster_config_dir = f"{maestro_config_dir}/{cluster_name}"
    result_spec: dict[str, Any] = {}
    command = [
        "talosctl",
        "get",
        sub_cmd,
        "-e",
        node,
        "-n",
        node,
        "-o",
        "json",
    ]
    try:
        result = run_command(command, cluster_config_dir, timeout_seconds=timeout_seconds)
    except CommandTimeoutError as err:
        return {}, -1, str(err)

    if result.returncode == 0:
        json_str = result.stdout.strip()
        if json_str:
            try:
                json_dict = json.loads(json_str)
            except json.JSONDecodeError as err:
                return (
                    {},
                    result.returncode,
                    f"{result.stderr.strip()} JSON parse error: {err}".strip(),
                )
            spec = json_dict.get("spec")
            if isinstance(spec, dict):
                result_spec = spec

    return result_spec, result.returncode, result.stderr


def talos_machine_type(
    cluster_name: str,
    node: str,
    timeout_seconds: float | None = None,
) -> str | None:
    """Returns the node's configured Talos role ("controlplane", "init", "worker").

    None means no role could be established — the call failed, or Talos itself reported
    "unknown", which is what it returns when the node has no machine config at all.
    """
    home_dir = os.getenv("HOME", "")
    cluster_config_dir = f"{home_dir}/.maestro/{cluster_name}"
    command = ["talosctl", "get", "machinetype", "-e", node, "-n", node, "-o", "json"]
    try:
        result = run_command(command, cluster_config_dir, timeout_seconds=timeout_seconds)
    except CommandTimeoutError:
        return None
    if result.returncode != 0:
        return None

    raw_output = result.stdout.strip()
    if not raw_output:
        return None

    try:
        data = json.loads(raw_output)
    except json.JSONDecodeError:
        return None

    machine_type = data.get("spec")
    if not isinstance(machine_type, str) or machine_type == "unknown":
        # Talos's machine.Type stringifies to "unknown" when no machine config is applied
        # yet. That's the absence of a role, not a role — reporting it as None keeps both
        # callers on their "can't confirm, don't guess" path instead of silently filing
        # the node under "workers" as any non-controlplane string otherwise would.
        return None
    return machine_type


def init_talosconfig() -> None:
    home_dir = os.getenv("HOME", "")
    maestro_config_dir = Path(f"{home_dir}/.maestro")
    cluster_dir = maestro_config_dir / ORPHANS_CLUSTER_NAME
    if cluster_dir.exists():
        return

    cluster_dir.mkdir(parents=True, exist_ok=True)
    talosconfig_file = cluster_dir / "talosconfig"
    talosconfig_file.write_text(
        f"""context: {ORPHANS_CLUSTER_NAME}
contexts:
  {ORPHANS_CLUSTER_NAME}:
    endpoints: []
    nodes: []
""",
        encoding="utf-8",
    )


def load_talos_configs() -> dict[str, dict[str, Any]]:
    home_dir = os.getenv("HOME", "")
    maestro_config_dir = Path(f"{home_dir}/.maestro")
    talos_configs: dict[str, dict[str, Any]] = {"context": "", "contexts": {}}

    for maestro_dir in maestro_config_dir.iterdir():
        if not maestro_dir.is_dir():
            continue

        talosconfig_file = maestro_dir / "talosconfig"
        if not talosconfig_file.is_file():
            continue

        cluster_name = maestro_dir.name
        with open(talosconfig_file, "r", encoding="utf-8") as file_pointer:
            cluster_talosconfig = yaml.safe_load(file_pointer) or {}

        contexts = cluster_talosconfig.get("contexts", {})
        if cluster_name in contexts:
            talos_configs["contexts"][cluster_name] = contexts[cluster_name]

    return talos_configs


def node_cluster_name(
    cluster_names: list[str],
    node: str,
    timeout_seconds: float | None = None,
) -> tuple[str | None, bool]:
    """Returns (cluster_name, is_maintenance).

    cluster_name is None when the node doesn't belong to any cluster we manage and isn't
    in maintenance either — the caller should drop it rather than filing it under a
    placeholder cluster. is_maintenance is only meaningful when cluster_name is "_Orphans".
    """
    for cluster_name in cluster_names:
        if node_belongs_to_cluster(cluster_name, node, timeout_seconds=timeout_seconds):
            return cluster_name, False

    if is_maintenance(node, timeout_seconds=timeout_seconds):
        return ORPHANS_CLUSTER_NAME, True
    return None, False


def node_belongs_to_cluster(
    cluster_name: str,
    node: str,
    timeout_seconds: float | None = None,
) -> bool:
    """True if `node` still authenticates against `cluster_name`'s own talosconfig."""
    home_dir = os.getenv("HOME", "")
    cluster_config_dir = f"{home_dir}/.maestro/{cluster_name}"
    command = ["talosctl", "get", "info", "-e", node, "-n", node, "-o", "json"]
    try:
        result = run_command(command, cluster_config_dir, timeout_seconds=timeout_seconds)
    except CommandTimeoutError:
        return False
    return result.returncode == 0


def fetch_cluster_node_info(
    cluster_name: str,
    ip: str,
    timeout_seconds: float | None,
) -> dict[str, Any] | None:
    """Gathers a real cluster member's status via that cluster's own authenticated API.

    Returns None if the node's machinestatus can't be fetched at all — the caller decides
    what that means (drop a not-yet-confirmed node, or mark a known member unreachable).
    """
    node_info: dict[str, Any] = {"ip": ip}
    machine_spec, return_code, _ = talos_get_spec(
        cluster_name, "machinestatus", ip, timeout_seconds=timeout_seconds
    )
    if return_code != 0 or not machine_spec:
        return None

    node_info["stage"] = machine_spec.get("stage", "unavailable or installing")
    status = machine_spec.get("status")
    node_info["status"] = status if isinstance(status, dict) else {}

    node_status_spec, return_code, _ = talos_get_spec(
        cluster_name, "nodestatus", ip, timeout_seconds=timeout_seconds
    )
    if return_code == 0 and node_status_spec:
        node_info["nodeReady"] = node_status_spec.get("nodeReady", "-")
        manifest_spec, _, _ = talos_get_spec(
            cluster_name, "manifeststatus", ip, timeout_seconds=timeout_seconds
        )
        manifests_applied = (
            manifest_spec.get("manifestsApplied", []) if manifest_spec else []
        )
        node_info["manifestsApplied"] = (
            manifests_applied if isinstance(manifests_applied, list) else []
        )
        etcd_member_spec, _, _ = talos_get_spec(
            cluster_name, "etcdmember", ip, timeout_seconds=timeout_seconds
        )
        node_info["memberID"] = (
            etcd_member_spec.get("memberID", "-") if etcd_member_spec else "-"
        )

    return node_info


def classify_known_node(
    ip: str,
    cluster_name: str,
    kube_node_type: str,
    real_cluster_names: list[str],
    command_timeout_seconds: float | None,
    port_check_timeout_seconds: float,
) -> NodeClassification | None:
    """Re-checks a node already tracked under a real cluster.

    Talosctl's own authenticated API is the reachability check here — no raw port probe.
    A node that doesn't answer at all, or answers ambiguously (mid-reboot connections can
    reset mid-handshake without meaning anything), stays listed under its real cluster as
    unreachable — that includes a node still installing after a fresh bootstrap, which is
    exactly as unauthenticatable as one that was actually `talosctl reset`.

    It's reclassified away from here only on POSITIVE proof of a new identity: it now
    authenticates against a different real cluster, or it confirms maintenance stage.
    Anything short of that keeps its old placement — an ambiguous blip must never erase a
    node's recorded membership, only a real answer can.

    The reachability check itself uses the short probe timeout, not the full command
    timeout: a node that's actually there answers in well under a second, so there's no
    reason to let a genuinely silent one block the batch for the full 30s twice over.
    """
    node_info = fetch_cluster_node_info(cluster_name, ip, port_check_timeout_seconds)
    if node_info is None:
        to_cluster_name, node_is_maintenance = node_cluster_name(
            real_cluster_names, ip, timeout_seconds=port_check_timeout_seconds
        )
        if to_cluster_name is not None:
            print(
                f"refresh_talosconfigs:: ip={ip} no longer part of cluster={cluster_name}, "
                f"now {to_cluster_name}",
                flush=True,
            )
            return build_cluster_node_result(
                ip, to_cluster_name, node_is_maintenance, command_timeout_seconds
            )

        print(
            f"refresh_talosconfigs:: ip={ip} cluster={cluster_name} unreachable, keeping placement",
            flush=True,
        )
        return {
            "ip": ip,
            "to_cluster_name": cluster_name,
            "kube_node_type": kube_node_type,
            "node_info": {"ip": ip, "stage": "unreachable"},
            "trackable": True,
            "changed": False,
        }

    machine_type = talos_machine_type(
        cluster_name, ip, timeout_seconds=command_timeout_seconds
    )
    if machine_type is None:
        new_kube_node_type = kube_node_type
    elif machine_type in ("controlplane", "init"):
        new_kube_node_type = "controlplanes"
    else:
        new_kube_node_type = "workers"
    return {
        "ip": ip,
        "to_cluster_name": cluster_name,
        "kube_node_type": new_kube_node_type,
        "node_info": node_info,
        "trackable": True,
        "changed": new_kube_node_type != kube_node_type,
    }


def build_cluster_node_result(
    ip: str,
    to_cluster_name: str,
    node_is_maintenance: bool,
    command_timeout_seconds: float | None,
) -> NodeClassification | None:
    """Builds the final classification once a node's cluster (or _Orphans) is already
    resolved — shared by the fresh-candidate and reclassified-known-node paths.
    """
    if to_cluster_name == ORPHANS_CLUSTER_NAME:
        # No machine config applied yet — there's no reliable role to report.
        return {
            "ip": ip,
            "to_cluster_name": to_cluster_name,
            "kube_node_type": "unassigned",
            "node_info": {"ip": ip, "stage": "maintenance" if node_is_maintenance else "-"},
            "trackable": False,
            "changed": False,
        }

    machine_type = talos_machine_type(
        to_cluster_name, ip, timeout_seconds=command_timeout_seconds
    )
    if machine_type is None:
        # Can't confirm a role yet — try again on the next scan rather than guess.
        print(
            f"refresh_talosconfigs:: ip={ip} cluster={to_cluster_name} machinetype unreadable, retrying later",
            flush=True,
        )
        return None
    kube_node_type = "controlplanes" if machine_type in ("controlplane", "init") else "workers"

    node_info = fetch_cluster_node_info(to_cluster_name, ip, command_timeout_seconds)
    if node_info is None:
        return None

    return {
        "ip": ip,
        "to_cluster_name": to_cluster_name,
        "kube_node_type": kube_node_type,
        "node_info": node_info,
        "trackable": True,
        "changed": True,
    }


def classify_candidate_node(
    ip: str,
    real_cluster_names: list[str],
    command_timeout_seconds: float | None,
    port_check_timeout_seconds: float,
) -> NodeClassification | None:
    """Classifies an IP that isn't in any talosconfig yet.

    The port probe here is purely a cheap pre-filter to skip spawning talosctl against
    addresses with nothing listening at all (most of a freshly scanned /24) — it never
    decides a node's identity or role by itself, real talosctl calls do.

    A completed TCP handshake doesn't mean the Talos protocol will actually answer —
    some addresses on a noisy network accept the connection and then never respond. So
    the identity check (which cluster owns this, or is it in maintenance) also runs on
    the short probe timeout: a real apid answers near-instantly, and a silent one would
    otherwise cost up to two full command timeouts per address.
    """
    if not is_port_open(ip, 50000, timeout=port_check_timeout_seconds):
        return None

    to_cluster_name, node_is_maintenance = node_cluster_name(
        real_cluster_names, ip, timeout_seconds=port_check_timeout_seconds
    )
    if to_cluster_name is None:
        print(
            f"refresh_talosconfigs:: ip={ip} no known cluster and not in maintenance, dropping from the tree",
            flush=True,
        )
        return None

    return build_cluster_node_result(
        ip, to_cluster_name, node_is_maintenance, command_timeout_seconds
    )


def classify_scanned_node(
    ip: str,
    real_cluster_names: list[str],
    previous_node_placement: dict[str, dict[str, str]],
    command_timeout_seconds: float | None,
    port_check_timeout_seconds: float,
) -> NodeClassification | None:
    """Classifies one scanned IP. Pure w.r.t. the caller's state — safe to run on a worker thread.

    Returns None if the node should be dropped entirely (not Talos, not yet confirmable,
    or a brand-new cluster member whose machinestatus couldn't be fetched).
    """
    previous_placement = previous_node_placement.get(ip, {})
    from_cluster_name = previous_placement.get("cluster_name")
    from_kube_node_type = previous_placement.get("kube_node_type")

    if from_cluster_name is not None and from_kube_node_type is not None:
        return classify_known_node(
            ip,
            from_cluster_name,
            from_kube_node_type,
            real_cluster_names,
            command_timeout_seconds,
            port_check_timeout_seconds,
        )

    return classify_candidate_node(
        ip, real_cluster_names, command_timeout_seconds, port_check_timeout_seconds
    )


def refresh_talosconfigs(
    command_timeout_seconds: float | None = None,
    port_check_timeout_seconds: float = 3.0,
) -> dict[str, dict[str, list[dict[str, Any]]]]:
    home_dir = os.getenv("HOME", "")
    maestro_config_dir = f"{home_dir}/.maestro"
    print(f"refresh_talosconfigs:: before maestro_config_dir={maestro_config_dir}", flush=True)

    talos_config = load_talos_configs()
    cluster_names = list(talos_config["contexts"].keys())
    real_cluster_names = sorted(
        cluster_name
        for cluster_name in cluster_names
        if cluster_name != ORPHANS_CLUSTER_NAME
    )

    previous_node_placement: dict[str, dict[str, str]] = {}
    for source_cluster_name, context in talos_config["contexts"].items():
        endpoints = context.get("endpoints") or []
        workers = context.get("nodes") or []
        for endpoint_ip in endpoints:
            previous_node_placement[endpoint_ip] = {
                "cluster_name": source_cluster_name,
                "kube_node_type": "controlplanes",
            }
        for worker_ip in workers:
            if worker_ip not in previous_node_placement:
                previous_node_placement[worker_ip] = {
                    "cluster_name": source_cluster_name,
                    "kube_node_type": "workers",
                }

    print(
        f"refresh_talosconfigs:: before talos_config={json.dumps(talos_config, indent=2)}",
        flush=True,
    )
    print(f"refresh_talosconfigs:: real_cluster_names={json.dumps(real_cluster_names)}", flush=True)

    # Every real cluster gets an entry up front, even with zero members right now — a
    # cluster that just lost its last node still needs its talosconfig's node list
    # cleared, and that only happens if it's present here for the reconciliation below.
    new_nodes: dict[str, dict[str, list[dict[str, Any]]]] = {
        ORPHANS_CLUSTER_NAME: {"controlplanes": [], "workers": [], "unassigned": []},
        **{name: {"controlplanes": [], "workers": []} for name in real_cluster_names},
    }
    changed = False

    node_file_name = f"{maestro_config_dir}/nodes.json"
    scanned_nodes: dict[str, Any] = {}
    if os.path.exists(node_file_name):
        with open(node_file_name, "r", encoding="utf-8") as file_pointer:
            scanned_nodes = json.load(file_pointer)

    # Only nodes with a persistable role (controlplanes/workers) are tracked here — "unassigned"
    # nodes are never written to a talosconfig, so they'd never match on a later poll otherwise.
    trackable_ips: set[str] = set()

    # Each node's classification is independent network I/O (sockets, talosctl)
    # with no shared state, so a scan of hundreds of IPs doesn't have to run one at a time.
    with ThreadPoolExecutor(max_workers=32) as executor:
        results = executor.map(
            lambda ip: classify_scanned_node(
                ip,
                real_cluster_names,
                previous_node_placement,
                command_timeout_seconds,
                port_check_timeout_seconds,
            ),
            scanned_nodes.keys(),
        )
        for result in results:
            if result is None:
                continue

            to_cluster_name = result["to_cluster_name"]
            kube_node_type = result["kube_node_type"]
            new_nodes.setdefault(to_cluster_name, {})
            new_nodes[to_cluster_name].setdefault("controlplanes", [])
            new_nodes[to_cluster_name].setdefault("workers", [])
            new_nodes[to_cluster_name][kube_node_type].append(result["node_info"])

            if result["trackable"]:
                trackable_ips.add(result["ip"])
                if result["changed"]:
                    changed = True

    if set(previous_node_placement.keys()) != trackable_ips:
        changed = True

    print(f"refresh_talosconfigs:: new_nodes={json.dumps(new_nodes, indent=2)}", flush=True)
    print(f"refresh_talosconfigs:: changed={changed}", flush=True)

    if changed:
        print("refresh_talosconfigs:: talosctl changed", flush=True)
        for cluster_name, cluster_nodes in new_nodes.items():
            # "_Orphans" is virtual — a grouping in the response, never a directory on
            # disk. There's no talosconfig here to reconcile, and running talosctl in a
            # missing cwd would raise outright.
            talosconfig_dir = f"{maestro_config_dir}/{cluster_name}"
            if cluster_name == ORPHANS_CLUSTER_NAME or not os.path.isdir(talosconfig_dir):
                continue

            for talos_node_type, kube_node_type in TALOS_NODE_TYPE_TO_KUBE.items():
                node_ips: list[str] = []
                if kube_node_type in cluster_nodes:
                    print(
                        "refresh_talosconfigs:: "
                        f"cluster_name={cluster_name} kube_node_type={kube_node_type} "
                        f"node={json.dumps(cluster_nodes[kube_node_type])}",
                        flush=True,
                    )
                    for node in cluster_nodes[kube_node_type]:
                        print(f"refresh_talosconfigs:: node={json.dumps(node)}", flush=True)
                        node_ips.append(node["ip"])

                # Run even with an empty node_ips: "talosctl config node" with no arguments
                # clears the list, which is exactly right when a cluster just lost its last
                # worker — a stale IP must not linger in its talosconfig just because this
                # round reported nothing for that role. "config endpoint" is the exception:
                # talosctl itself refuses zero endpoints ("requires at least 1 arg(s)"), since
                # a context needs at least one entry point to be usable at all — so a cluster
                # that just lost its last controlplane keeps its last-known (now dead) endpoint
                # rather than erroring out here every cycle for no effect.
                if node_ips or talos_node_type != "endpoints":
                    command = ["talosctl", "config", talos_node_type[:-1], *node_ips]
                    run_command(
                        command,
                        talosconfig_dir,
                        timeout_seconds=command_timeout_seconds,
                    )
                print(
                    "refresh_talosconfigs:: "
                    f"cluster_name={cluster_name} {talos_node_type}={json.dumps(node_ips)}",
                    flush=True,
                )

    return new_nodes
