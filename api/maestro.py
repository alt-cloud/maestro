import json
import os
import socket
import subprocess
from pathlib import Path
from typing import Any

import yaml

VIRTUAL_CLUSTERS = ["_Orphans", "_Unknown"]
TALOS_NODE_TYPE_TO_KUBE = {"endpoints": "controlplanes", "nodes": "workers"}


def _parse_json_stream(raw_output: str) -> list[dict[str, Any]]:
    normalized = f"[{raw_output.replace('}\n{', '},{')}]"
    return json.loads(normalized)


def run_shell_command(run_cmd: str, cluster_dir: str) -> subprocess.CompletedProcess[str]:
    command = f"clusterDir={cluster_dir} TALOSCONFIG=talosconfig {run_cmd}"
    print(f"run_shell_command={command}")
    return subprocess.run(
        command,
        shell=True,
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        cwd=cluster_dir,
        encoding="utf-8",
    )


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
            values[column_name] = row[start:].strip() if end < 0 else row[start:end].strip()
        rows.append(values)

    return json.dumps(rows, indent=2)


def get_disk_name(ip: str) -> str:
    home_dir = os.getenv("HOME", "")
    run_cmd = f"talosctl get discoveredvolume -o json -n {ip} -e {ip} -i"
    result = run_shell_command(run_cmd, home_dir)

    if result.returncode != 0:
        err = result.stderr.strip() or result.stdout.strip() or "talosctl discoveredvolume command failed"
        raise RuntimeError(f"Failed to detect install disk for node {ip}: {err}")

    raw_output = (result.stdout or "").strip()
    if not raw_output:
        raise RuntimeError(f"Failed to detect install disk for node {ip}: empty talosctl output")

    try:
        volumes = _parse_json_stream(raw_output)
    except json.JSONDecodeError as err:
        raise RuntimeError(f"Failed to parse discovered volumes for node {ip}: {err}") from err

    for volume_info in volumes:
        metadata = volume_info.get("metadata", {})
        spec = volume_info.get("spec", {})
        disk_id = metadata.get("id", "")
        if disk_id.startswith("loop") or disk_id.startswith("sr"):
            continue
        disk = spec.get("dev_path")
        if disk:
            return disk

    raise RuntimeError(f"Failed to detect install disk for node {ip}: no suitable disk found")


def nodes_list(nmap_output: str) -> dict[str, dict[str, str]]:
    lines = nmap_output.splitlines()
    prefix = "Nmap scan report for "
    kube_port_prefix = "6443/tcp"
    apid_port_prefix = "50000/tcp"

    nodes: dict[str, dict[str, str]] = {}
    node_state: dict[str, str] = {}

    for line in lines:
        if line.startswith(prefix):
            print(line)
            if node_state:
                nodes[node_state["ip"]] = node_state

            node_state = {}
            tail = line[len(prefix):].split()
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
        print(f"nodes_list:: node_state={node_state}")

    return nodes


def is_port_open(host: str, port: int, timeout: float = 3.0) -> bool:
    sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    sock.settimeout(timeout)
    result = sock.connect_ex((host, port))
    sock.close()
    return result == 0


def is_maintenance(ip: str) -> bool:
    home_dir = os.getenv("HOME", "")
    run_cmd = f"talosctl get discoveredvolume -o json -n {ip} -e {ip} -i"
    result = run_shell_command(run_cmd, home_dir)
    print(f"is_maintenance:: returncode={result.returncode}")
    if result.returncode != 0:
        return False

    raw_output = (result.stdout or "").strip()
    if not raw_output:
        return False

    try:
        volumes = _parse_json_stream(raw_output)
    except json.JSONDecodeError:
        return False

    for volume_info in volumes:
        if "partition_label" in volume_info.get("spec", {}):
            return False
    return True


def talos_get_spec(cluster_name: str, sub_cmd: str, node: str) -> tuple[Any, int, str]:
    home_dir = os.getenv("HOME", "")
    maestro_config_dir = f"{home_dir}/.maestro"
    cluster_config_dir = f"{maestro_config_dir}/{cluster_name}"
    if cluster_name == "_Unknown":
        return "-", -1, ""

    result_spec: Any = "-"
    insecure = "-i" if cluster_name == "_Orphans" else ""
    run_cmd = f"talosctl get {sub_cmd} -e {node} -n {node} -o json {insecure}"
    result = run_shell_command(run_cmd, cluster_config_dir)

    if result.returncode == 0:
        json_str = result.stdout.strip()
        if json_str:
            json_dict = json.loads(json_str)
            result_spec = json_dict["spec"]

    return result_spec, result.returncode, result.stderr


def init_talosconfig() -> None:
    home_dir = os.getenv("HOME", "")
    maestro_config_dir = Path(f"{home_dir}/.maestro")
    for virtual_cluster in VIRTUAL_CLUSTERS:
        cluster_dir = maestro_config_dir / virtual_cluster
        if cluster_dir.exists():
            continue

        cluster_dir.mkdir(parents=True, exist_ok=True)
        talosconfig_file = cluster_dir / "talosconfig"
        talosconfig_file.write_text(
            f"""context: {virtual_cluster}
contexts:
  {virtual_cluster}:
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


def node_cluster_name(cluster_names: list[str], node: str) -> str:
    home_dir = os.getenv("HOME", "")
    maestro_config_dir = f"{home_dir}/.maestro"
    for cluster_name in cluster_names:
        cluster_config_dir = f"{maestro_config_dir}/{cluster_name}"
        run_cmd = f"talosctl get info -e {node} -n {node} -o json"
        result = run_shell_command(run_cmd, cluster_config_dir)
        if result.returncode == 0:
            return cluster_name
    if is_maintenance(node):
        return "_Orphans"
    return "_Unknown"


def refresh_talosconfigs() -> dict[str, dict[str, list[dict[str, Any]]]]:
    home_dir = os.getenv("HOME", "")
    maestro_config_dir = f"{home_dir}/.maestro"
    print(f"refresh_talosconfigs:: before maestro_config_dir={maestro_config_dir}")

    talos_config = load_talos_configs()
    cluster_names = list(talos_config["contexts"].keys())
    real_cluster_names = sorted(
        cluster_name for cluster_name in cluster_names if cluster_name not in VIRTUAL_CLUSTERS
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

    print(f"refresh_talosconfigs:: before talos_config={json.dumps(talos_config, indent=2)}")
    print(f"refresh_talosconfigs:: real_cluster_names={json.dumps(real_cluster_names)}")

    new_nodes: dict[str, dict[str, list[dict[str, Any]]]] = {
        "_Orphans": {"controlplanes": [], "workers": []},
        "_Unknown": {"controlplanes": [], "workers": []},
    }
    changed = False

    node_file_name = f"{maestro_config_dir}/nodes.json"
    scanned_nodes: dict[str, Any] = {}
    if os.path.exists(node_file_name):
        with open(node_file_name, "r", encoding="utf-8") as file_pointer:
            scanned_nodes = json.load(file_pointer)

    processed_ips: set[str] = set()
    for ip in scanned_nodes.keys():
        processed_ips.add(ip)
        node_stage = ""
        node_info: dict[str, Any] = {"ip": ip}
        previous_placement = previous_node_placement.get(ip, {})
        from_cluster_name = previous_placement.get("cluster_name")
        from_kube_node_type = previous_placement.get("kube_node_type")

        if is_port_open(ip, 50000):
            to_cluster_name = node_cluster_name(real_cluster_names, ip)
            new_nodes.setdefault(to_cluster_name, {})
            new_nodes[to_cluster_name].setdefault("controlplanes", [])
            new_nodes[to_cluster_name].setdefault("workers", [])

            print(f"refresh_talosconfigs:: ip={ip} port 50000 open to_cluster_name={to_cluster_name}")
            if is_port_open(ip, 6443):
                kube_node_type = "controlplanes"
                print(
                    f"refresh_talosconfigs:: ip={ip} port 6443 opened controlplane in cluster {to_cluster_name}"
                )
            else:
                kube_node_type = "workers"
                changed = True
                print(
                    f"refresh_talosconfigs:: ip={ip} port 6443 closed, move to worker in cluster {to_cluster_name}"
                )
        else:
            kube_node_type = "controlplanes"
            to_cluster_name = "_Orphans"
            node_stage = "unavailable or installing"
            print(
                f"refresh_talosconfigs:: ip={ip} ports closed, keep controlplane in old cluster "
                f"{from_cluster_name if from_cluster_name else '-'}"
            )

        if from_cluster_name != to_cluster_name or from_kube_node_type != kube_node_type:
            changed = True

        if to_cluster_name in VIRTUAL_CLUSTERS:
            if is_maintenance(ip):
                node_stage = "maintenance"
            node_info["stage"] = node_stage if node_stage else "-"
        else:
            machine_spec, return_code, _ = talos_get_spec(to_cluster_name, "machinestatus", ip)
            if len(machine_spec) == 0:
                continue

            node_info["stage"] = machine_spec["stage"] if "stage" in machine_spec else "unavailable or installing"
            node_info["status"] = machine_spec["status"] if "status" in machine_spec else "-"

            node_status_spec, return_code, _ = talos_get_spec(to_cluster_name, "nodestatus", ip)
            if return_code == 0:
                node_info["nodeReady"] = node_status_spec["nodeReady"] if "nodeReady" in node_status_spec else "-"
                manifest_spec, _, _ = talos_get_spec(to_cluster_name, "manifeststatus", ip)
                node_info["manifestsApplied"] = (
                    manifest_spec["manifestsApplied"] if "manifestsApplied" in manifest_spec else []
                )
                etcd_member_spec, _, _ = talos_get_spec(to_cluster_name, "etcdmember", ip)
                node_info["memberID"] = etcd_member_spec["memberID"] if "memberID" in etcd_member_spec else "-"

        new_nodes[to_cluster_name][kube_node_type].append(node_info)

    if set(previous_node_placement.keys()) != processed_ips:
        changed = True

    print(f"refresh_talosconfigs:: new_nodes={json.dumps(new_nodes, indent=2)}")
    print(f"refresh_talosconfigs:: changed={changed}")

    if changed:
        print("refresh_talosconfigs:: talosctl changed")
        for cluster_name, cluster_nodes in new_nodes.items():
            for talos_node_type, kube_node_type in TALOS_NODE_TYPE_TO_KUBE.items():
                node_ips: list[str] = []
                if kube_node_type in cluster_nodes:
                    print(
                        "refresh_talosconfigs:: "
                        f"cluster_name={cluster_name} kube_node_type={kube_node_type} "
                        f"node={json.dumps(cluster_nodes[kube_node_type])}"
                    )
                    for node in cluster_nodes[kube_node_type]:
                        print(f"refresh_talosconfigs:: node={json.dumps(node)}")
                        node_ips.append(node["ip"])

                talosconfig_dir = f"{maestro_config_dir}/{cluster_name}"
                if node_ips:
                    run_shell_command(
                        f"talosctl config {talos_node_type[:-1]} {' '.join(node_ips)}",
                        talosconfig_dir,
                    )
                print(
                    "refresh_talosconfigs:: "
                    f"cluster_name={cluster_name} {talos_node_type}={json.dumps(node_ips)}"
                )

    if new_nodes["_Orphans"]["workers"]:
        new_nodes["_Orphans"]["controlplanes"] += new_nodes["_Orphans"]["workers"]
        new_nodes["_Orphans"]["workers"] = []

    return new_nodes
