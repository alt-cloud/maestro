#!/usr/bin/env python3
"""
Universal Talos Cluster Deployment Script (Python 3)
Outputs SSE events to stdout AND duplicates them to queue_dir/sse_events.log.

At startup, the script writes its CONTROLPLANES/WORKERS to queue_dir/<PID>.json.
It then attempts to acquire an exclusive lock on sse_events.log:
- If another process already holds the lock, this script leaves its <PID>.json
  in place for the leader to pick up, then tails the sse_events.log file to
  stdout until the leader releases the lock, and exits.
- If the lock is acquired, this script becomes the leader: it deploys the cluster
  from its own <PID>.json, then processes any other <PID>.json files that appear
  in the queue, adding their nodes in "extend" mode.
- When the queue is empty, the script releases the lock and exits.
"""

import subprocess
import shlex
import sys
import time
import json
import os
import fcntl
import glob
from typing import Optional, List, Dict, Any, Callable, Set, TextIO

# ============================================================================
# Dependencies for run_command (from maestro.py)
# ============================================================================
class CommandTimeoutError(subprocess.TimeoutExpired):
    """Custom exception for command timeouts."""
    pass

def build_command_env(cluster_dir: str) -> dict:
    """Build environment variables for the command."""
    env = os.environ.copy()
    return env

def run_command(
    args: List[str],
    cluster_dir: str = ".",
    timeout_seconds: Optional[float] = None,
) -> subprocess.CompletedProcess[str]:
    """
    Wrapper for subprocess.run matching Maestro's implementation.
    https://github.com/alt-cloud/maestro/blob/main/maestro_api/src/maestro_api/maestro.py#L50
    """
    if not args:
        raise ValueError("Command arguments cannot be empty")
    if timeout_seconds is not None and timeout_seconds <= 0:
        raise ValueError("timeout_seconds must be greater than zero")

    timeout_info = f" timeout={timeout_seconds}s" if timeout_seconds is not None else ""

    # Log the command invocation to stderr to keep stdout (SSE) clean
    print(f"run_command cwd={cluster_dir} args={shlex.join(args)}{timeout_info}", flush=True, file=sys.stderr)

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

# ============================================================================
# SSE and Logging Helpers
# ============================================================================
_sse_id = 0
_log_file: Optional[TextIO] = None

def sse_event(event_type: str, data: Dict[str, Any]) -> None:
    """Emit a Server-Sent Event to stdout and duplicate to sse_events.log."""
    global _sse_id, _log_file
    _sse_id += 1
    event_text = f"id: {_sse_id}\nevent: {event_type}\ndata: {json.dumps(data)}\n\n"

    # Always write to stdout
    print(event_text, end="", flush=True)

    # Duplicate to the SSE log file if we hold the leader lock
    if _log_file is not None:
        try:
            _log_file.write(event_text)
            _log_file.flush()
        except Exception as e:
            print(f"Warning: failed to write to SSE log: {e}", file=sys.stderr)

def log(msg: str) -> None:
    """Print human-readable log to stderr."""
    timestamp = time.strftime("%Y-%m-%d %H:%M:%S")
    print(f"[{timestamp}] {msg}", flush=True, file=sys.stderr)

def die(msg: str) -> None:
    """Log error, emit SSE error event, and exit."""
    log(f"ERROR: {msg}")
    sse_event("error", {"message": msg})
    sys.exit(1)

# ============================================================================
# Leader lock management
# ============================================================================
def acquire_leader_lock(queue_dir: str) -> Optional[TextIO]:
    """
    Try to acquire an exclusive (non-blocking) lock on queue_dir/sse_events.log.
    Returns an open file handle on success, or None if another process holds the lock.
    The lock is automatically released when the file handle is closed (or the process dies).
    """
    log_path = os.path.join(queue_dir, "sse_events.log")
    try:
        fd = open(log_path, "a", encoding="utf-8")
        try:
            fcntl.flock(fd.fileno(), fcntl.LOCK_EX | fcntl.LOCK_NB)
            return fd
        except (IOError, OSError):
            # Another process holds the lock
            fd.close()
            return None
    except OSError as e:
        print(f"Failed to open SSE log: {e}", file=sys.stderr)
        return None

def release_leader_lock(fd: TextIO) -> None:
    """Explicitly release the leader lock and close the file."""
    try:
        fcntl.flock(fd.fileno(), fcntl.LOCK_UN)
    except Exception:
        pass
    try:
        fd.close()
    except Exception:
        pass

# ============================================================================
# Tail SSE log (for non-leader processes)
# ============================================================================
def tail_sse_log(queue_dir: str) -> None:
    """
    Tail the sse_events.log file while the leader holds the lock.
    Outputs the current contents and any new data to stdout.
    Exits when the leader releases the lock.
    """
    log_path = os.path.join(queue_dir, "sse_events.log")

    if not os.path.exists(log_path):
        log("sse_events.log does not exist yet, nothing to tail")
        return

    # Open file for reading
    try:
        fd = open(log_path, "r", encoding="utf-8")
    except OSError as e:
        log(f"Failed to open sse_events.log for reading: {e}")
        return

    log("Tailing sse_events.log to stdout...")

    # Read and output current contents
    current_content = fd.read()
    if current_content:
        print(current_content, end="", flush=True)

    # Enter tail loop
    while True:
        # Try to acquire shared lock (non-blocking)
        # If leader holds exclusive lock, this will fail
        try:
            fcntl.flock(fd.fileno(), fcntl.LOCK_SH | fcntl.LOCK_NB)
            # If we got here, the leader released the exclusive lock
            # Read any remaining data
            remaining = fd.read()
            if remaining:
                print(remaining, end="", flush=True)
            fd.close()
            log("Leader released the lock, tailing complete")
            return
        except (IOError, OSError):
            # Leader still holds the lock
            pass

        # Read any new data
        new_data = fd.read()
        if new_data:
            print(new_data, end="", flush=True)

        time.sleep(1)

# ============================================================================
# Queue file operations
# ============================================================================
def find_queue_files(queue_dir: str) -> List[str]:
    """
    Find all <PID>.json files in queue_dir, sorted numerically by PID.
    Excludes sse_events.log and any non-PID-named files.
    """
    files = []
    for name in os.listdir(queue_dir):
        if not name.endswith(".json"):
            continue
        base = name[:-5]  # strip ".json"
        if base.isdigit():
            files.append((int(base), os.path.join(queue_dir, name)))
    files.sort(key=lambda x: x[0])
    return [path for _, path in files]

def write_queue_file(filepath: str, controlplanes: List[str], workers: List[str]) -> None:
    """Write a queue file with the given node lists."""
    with open(filepath, "w", encoding="utf-8") as f:
        json.dump({"controlplanes": controlplanes, "workers": workers}, f)
    log(f"Wrote queue file: {filepath}")

def read_queue_file(filepath: str) -> Dict[str, List[str]]:
    """Read and validate a queue file. Raises on invalid content."""
    with open(filepath, "r", encoding="utf-8") as f:
        data = json.load(f)

    controlplanes = data.get("controlplanes", []) or []
    workers = data.get("workers", []) or []

    if not isinstance(controlplanes, list) or not isinstance(workers, list):
        raise ValueError("JSON must contain 'controlplanes' and 'workers' as lists")

    log(f"Read queue file: {filepath}")
    log(f"  controlplanes: {controlplanes}")
    log(f"  workers:       {workers}")

    return {"controlplanes": controlplanes, "workers": workers}

def remove_queue_file(filepath: str) -> None:
    """Remove a queue file, ignoring FileNotFoundError."""
    try:
        os.remove(filepath)
        log(f"Removed queue file: {filepath}")
    except FileNotFoundError:
        pass

# ============================================================================
# Node Operations
# ============================================================================
def apply_config(node: str, role: str, config_dir: str) -> None:
    cfg = os.path.join(config_dir, f"{role}.yaml")
    if not os.path.isfile(cfg):
        die(f"Config file not found: {cfg}")

    sse_event("config_applying", {"node": node, "role": role})
    log(f"Applying {role}.yaml config to node {node}...")

    try:
        run_command([
            "talosctl", "-n", node, "apply-config",
            "--file", cfg, "--insecure", "--on-reboot"
        ])
        sse_event("config_applied", {"node": node, "role": role})
    except subprocess.CalledProcessError as e:
        die(f"Failed to apply config to {node}: {e.stderr}")

def is_node_reachable(node: str) -> bool:
    try:
        result = run_command([
            "talosctl", "-n", node, "version", "--insecure", "--timeout", "3s"
        ], timeout_seconds=5.0)
        return result.returncode == 0
    except (subprocess.CalledProcessError, CommandTimeoutError):
        return False

def is_node_running(node: str) -> bool:
    try:
        result = run_command([
            "talosctl", "-n", node, "get", "machineStatus", "--insecure", "-o", "json"
        ], timeout_seconds=5.0)
        if result.returncode == 0:
            data = json.loads(result.stdout)
            # talosctl may return a single object or an array in the "items" field
            items = data.get("items", [data]) if "items" in data else [data]
            for item in items:
                if item.get("spec", {}).get("stage") == "running":
                    return True
        return False
    except (subprocess.CalledProcessError, CommandTimeoutError, json.JSONDecodeError):
        return False

def wait_for_nodes(
    nodes: List[str],
    label: str,
    check_func: Callable[[str], bool],
    timeout: int,
    transition_event: str,
) -> List[str]:
    """
    Wait until all nodes in the list satisfy the check_func condition.
    Emits a transition event exactly once per node when the state changes.
    Returns the list of nodes ordered by the time they successfully transitioned.
    """
    event_suffix = check_func.__name__.replace("is_node_", "")
    sse_event(f"waiting_{event_suffix}", {"nodes": " ".join(nodes), "group": label})
    log(f"Waiting for {label} nodes to {event_suffix}: {' '.join(nodes)}")

    start_time = time.time()
    deadline = start_time + timeout

    # List to preserve the chronological order of transitions
    transitioned_order: List[str] = []
    # Set for fast O(1) lookup to skip already-checked nodes
    transitioned_set: Set[str] = set()

    while True:
        all_ready = True
        missing = []

        # Iterate over the provided list. If this is the result of a previous
        # call, the iteration order will be strictly chronological.
        for node in nodes:
            if node in transitioned_set:
                continue  # Already transitioned, skip the API call

            if not check_func(node):
                all_ready = False
                missing.append(node)
            else:
                # Transition confirmed: append to the order list
                transitioned_set.add(node)
                transitioned_order.append(node)
                sse_event(transition_event, {"node": node, "group": label})
                log(f"Node {node} ({label}) has transitioned to {event_suffix}.")

        if all_ready:
            sse_event(f"nodes_{event_suffix}", {"nodes": " ".join(transitioned_order), "group": label})
            log(f"All {label} nodes are {event_suffix}.")
            return transitioned_order

        if time.time() > deadline:
            die(f"Timeout: {label} nodes not ready within {timeout}s. Missing: {' '.join(missing)}")

        log(f"Still waiting for: {' '.join(missing)}")
        time.sleep(5)

# ============================================================================
# Cluster deployment logic
# ============================================================================
def deploy_cluster(
    controlplanes: List[str],
    workers: List[str],
    mode: str,
    config_dir: str,
    wait_node_timeout: int,
    wait_health_timeout: int,
) -> None:
    """
    Deploy or extend a Talos cluster with the given nodes.
    """
    if not controlplanes and not workers:
        log("No nodes to deploy, skipping")
        return

    if mode == "new" and not controlplanes:
        die("Initial deployment (mode=new) requires at least one controlplane node")

    first_cp = controlplanes[0] if controlplanes else None

    sse_event("deploy_started", {
        "mode": mode,
        "controlplanes": " ".join(controlplanes),
        "workers": " ".join(workers)
    })

    log("=" * 46)
    log(f"Mode: {mode}")
    log(f"ControlPlane nodes: {' '.join(controlplanes) or '<none>'}")
    log(f"Worker nodes:       {' '.join(workers) or '<none>'}")
    log(f"First CP:           {first_cp or '<none>'}")
    log("=" * 46)

    # Step 1: Apply configs to ALL nodes (fast, no waiting)
    sse_event("stage", {"step": 1, "name": "apply_configs", "status": "started"})
    log("Step 1: Applying configurations to all nodes...")

    for cp in controlplanes:
        apply_config(cp, "controlplane", config_dir)
    for w in workers:
        apply_config(w, "worker", config_dir)

    sse_event("stage", {"step": 1, "name": "apply_configs", "status": "completed"})
    log("Configuration applied. Reboot initiated on all nodes.")
    time.sleep(15)  # Small head start before polling

    # Step 2: Wait ONLY for ControlPlane nodes to be reachable + running
    if controlplanes:
        sse_event("stage", {"step": 2, "name": "controlplane_ready", "status": "started"})
        log("Step 2: Waiting for ControlPlane nodes...")

        ready_cps = wait_for_nodes(
            controlplanes, "controlplane", is_node_reachable, wait_node_timeout, "node_reachable"
        )
        wait_for_nodes(
            ready_cps, "controlplane", is_node_running, wait_node_timeout, "node_running"
        )

        sse_event("stage", {"step": 2, "name": "controlplane_ready", "status": "completed"})

    # Step 3: Bootstrap (immediately after CPs are running, only for new clusters)
    if mode == "new":
        sse_event("stage", {"step": 3, "name": "bootstrap", "status": "started", "node": first_cp})
        log(f"Step 3: Performing bootstrap on {first_cp}...")
        log("(etcd initializes in background while workers boot)")
        try:
            run_command(["talosctl", "-n", first_cp, "bootstrap"])
            sse_event("stage", {"step": 3, "name": "bootstrap", "status": "completed", "node": first_cp})
            log("Bootstrap command completed.")
        except subprocess.CalledProcessError as e:
            die(f"Bootstrap failed: {e.stderr}")
    else:
        sse_event("stage", {"step": 3, "name": "bootstrap", "status": "skipped", "reason": "extend_mode"})
        log("Step 3: Mode 'extend' — bootstrap skipped.")

    # Step 4: Wait for Worker nodes to be reachable + running
    if workers:
        sse_event("stage", {"step": 4, "name": "workers_ready", "status": "started"})
        log("Step 4: Waiting for Worker nodes...")

        ready_workers = wait_for_nodes(
            workers, "worker", is_node_reachable, wait_node_timeout, "node_reachable"
        )
        wait_for_nodes(
            ready_workers, "worker", is_node_running, wait_node_timeout, "node_running"
        )

        sse_event("stage", {"step": 4, "name": "workers_ready", "status": "completed"})
    else:
        sse_event("stage", {"step": 4, "name": "workers_ready", "status": "skipped", "reason": "no_workers"})
        log("Step 4: No worker nodes to wait for.")

    # Step 5: Cluster health check (after ALL nodes are running)
    if mode == "new":
        sse_event("stage", {"step": 5, "name": "health_check", "status": "started"})
        log("Step 5: Waiting for cluster to become fully healthy...")

        start_time = time.time()
        deadline = start_time + wait_health_timeout

        while True:
            try:
                result = run_command(["talosctl", "-n", first_cp, "health"], timeout_seconds=10.0)
                if result.returncode == 0:
                    break
            except (subprocess.CalledProcessError, CommandTimeoutError):
                pass

            if time.time() > deadline:
                die(f"Cluster did not become healthy within {wait_health_timeout} seconds")

            log("... still waiting for cluster health")
            time.sleep(10)

        sse_event("stage", {"step": 5, "name": "health_check", "status": "completed"})
        log("Cluster is healthy.")
    else:
        sse_event("stage", {"step": 5, "name": "health_check", "status": "skipped", "reason": "extend_mode"})
        log("Step 5: Mode 'extend' — waiting for new nodes to register in Kubernetes...")
        time.sleep(30)

    # Step 6: Fetch kubeconfig (new clusters only)
    if mode == "new":
        sse_event("stage", {"step": 6, "name": "kubeconfig", "status": "started"})
        log("Step 6: Fetching kubeconfig...")
        try:
            run_command(["talosctl", "-n", first_cp, "kubeconfig", "--force", "--nodes", first_cp])
            sse_event("stage", {"step": 6, "name": "kubeconfig", "status": "completed"})
            log("Kubeconfig saved.")
        except subprocess.CalledProcessError as e:
            die(f"Failed to fetch kubeconfig: {e.stderr}")
    else:
        sse_event("stage", {"step": 6, "name": "kubeconfig", "status": "skipped", "reason": "extend_mode"})
        log("Step 6: Mode 'extend' — kubeconfig already exists, skipping.")

    # Step 7: Final verification
    sse_event("stage", {"step": 7, "name": "verification", "status": "started"})
    log("Step 7: Final verification")
    log("Kubernetes nodes:")
    try:
        result = run_command(["kubectl", "get", "nodes", "-o", "wide"])
        if result.stdout:
            for line in result.stdout.strip().split('\n'):
                log(line)
    except subprocess.CalledProcessError as e:
        log(f"Warning: kubectl get nodes failed: {e.stderr}")

    sse_event("stage", {"step": 7, "name": "verification", "status": "completed"})

    # Done
    sse_event("deploy_completed", {"mode": mode, "status": "success"})
    log("=" * 46)
    log(f"Done! Cluster mode: {mode}")
    log("=" * 46)

# ============================================================================
# Main Execution
# ============================================================================
def main() -> None:
    global _log_file
    home_dir = os.getenv("HOME", "")
    maestro_config_dir = f"{home_dir}/.maestro"
    # Configuration from environment variables
    queue_dir = maestro_config_dir+ '.queue'
    config_dir = os.environ.get("CONFIGS_DIR", "./_out")
    wait_node_timeout = int(os.environ.get("WAIT_NODE_TIMEOUT", "300"))
    wait_health_timeout = int(os.environ.get("WAIT_HEALTH_TIMEOUT", "600"))

    controlplanes_str = os.environ.get("CONTROLPLANES", "")
    workers_str = os.environ.get("WORKERS", "")
    controlplanes = controlplanes_str.split() if controlplanes_str else []
    workers = workers_str.split() if workers_str else []

    # Ensure queue and config directories exist
    os.makedirs(queue_dir, exist_ok=True)
    if not os.path.isdir(config_dir):
        die(f"Config directory not found: {config_dir}")

    pid = os.getpid()
    my_queue_file = os.path.join(queue_dir, f"{pid}.json")

    log("=" * 46)
    log(f"Talos Cluster Deployment Script (PID={pid})")
    log(f"Queue directory:   {queue_dir}")
    log(f"Config directory:  {config_dir}")
    log(f"ControlPlanes:     {controlplanes or '<none>'}")
    log(f"Workers:           {workers or '<none>'}")
    log("=" * 46)

    sse_event("script_started", {
        "pid": pid,
        "queue_dir": queue_dir,
        "controlplanes": controlplanes,
        "workers": workers
    })

    # Step 1: Write our own queue file
    write_queue_file(my_queue_file, controlplanes, workers)

    # Step 2: Try to acquire the leader lock on sse_events.log
    log_fd = acquire_leader_lock(queue_dir)
    if log_fd is None:
        # Another process is already the leader.
        # Leave our queue file in place — the leader will pick it up
        # during its queue-processing phase.
        log(f"Another process already holds the leader lock.")
        log(f"Queue file {my_queue_file} left for the leader to process.")
        sse_event("leader_denied", {
            "pid": pid,
            "reason": "another_process_running",
            "queue_file_left": my_queue_file
        })

        # Tail the SSE log until the leader releases the lock
        tail_sse_log(queue_dir)

        log("Exiting after tailing SSE log")
        sys.exit(0)

    # We are the leader
    _log_file = log_fd
    log(f"Leader lock acquired on sse_events.log")
    sse_event("leader_acquired", {"pid": pid})

    try:
        # ------------------------------------------------------------------
        # Phase 1: Initial deployment from our own queue file (mode=new)
        # ------------------------------------------------------------------
        sse_event("phase_started", {"phase": "initial_deployment"})
        log("Phase 1: Initial deployment from own queue file")

        try:
            data = read_queue_file(my_queue_file)
        except (json.JSONDecodeError, ValueError) as e:
            die(f"Invalid own queue file {my_queue_file}: {e}")

        remove_queue_file(my_queue_file)

        deploy_cluster(
            controlplanes=data["controlplanes"],
            workers=data["workers"],
            mode="new",
            config_dir=config_dir,
            wait_node_timeout=wait_node_timeout,
            wait_health_timeout=wait_health_timeout,
        )

        sse_event("phase_completed", {"phase": "initial_deployment"})

        # ------------------------------------------------------------------
        # Phase 2: Process remaining queue files (mode=extend)
        # ------------------------------------------------------------------
        iteration = 0
        while True:
            queue_files = find_queue_files(queue_dir)
            if not queue_files:
                log("Queue is empty. Finishing.")
                break

            iteration += 1
            log(f"Phase 2, iteration {iteration}: found {len(queue_files)} queue file(s)")
            sse_event("queue_files_found", {"count": len(queue_files), "files": queue_files})

            for qf in queue_files:
                sse_event("processing_queue_file", {"file": qf})
                log(f"Processing queue file: {qf}")

                try:
                    data = read_queue_file(qf)
                except (json.JSONDecodeError, ValueError) as e:
                    log(f"ERROR: Invalid queue file {qf}: {e}, removing and skipping")
                    sse_event("queue_file_error", {"file": qf, "error": str(e)})
                    remove_queue_file(qf)
                    continue

                remove_queue_file(qf)

                # Skip empty entries
                if not data["controlplanes"] and not data["workers"]:
                    log(f"Queue file {qf} is empty, skipping deployment")
                    continue

                try:
                    deploy_cluster(
                        controlplanes=data["controlplanes"],
                        workers=data["workers"],
                        mode="extend",
                        config_dir=config_dir,
                        wait_node_timeout=wait_node_timeout,
                        wait_health_timeout=wait_health_timeout,
                    )
                except SystemExit:
                    # deploy_cluster called die() — propagate
                    raise

                sse_event("queue_file_processed", {"file": qf})

        # ------------------------------------------------------------------
        # Done
        # ------------------------------------------------------------------
        sse_event("script_completed", {"pid": pid, "status": "success"})
        log("=" * 46)
        log(f"Script completed successfully (PID={pid})")
        log("=" * 46)

    finally:
        # Always release the leader lock when exiting
        release_leader_lock(log_fd)
        _log_file = None

if __name__ == "__main__":
    main()
