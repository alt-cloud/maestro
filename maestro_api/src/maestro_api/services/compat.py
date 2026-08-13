"""Talos ↔ Kubernetes compatibility.

The only thing meant to be edited here per Talos release shipped in ALT
Orchestra is ``TALOS_MINOR_TO_K8S_MINORS`` below: map the Talos minor version to
the Kubernetes minor versions it supports, taken from the official Talos support
matrix (https://docs.siderolabs.com/talos/vX.Y/getting-started/support-matrix).
"""

import re
import subprocess

# ── EDIT THIS PER TALOS RELEASE ──────────────────────────────────────────────
# Talos minor version (the Y in 1.Y) -> supported Kubernetes minor versions
# (the Z in 1.Z), copied from the official Talos support matrix.
TALOS_MINOR_TO_K8S_MINORS: dict[int, list[int]] = {
    12: [30, 31, 32, 33, 34, 35],
    13: [31, 32, 33, 34, 35, 36],
}
# ─────────────────────────────────────────────────────────────────────────────

_TALOS_TAG_RE = re.compile(r"Tag:\s*v?(\d+)\.(\d+)")
_K8S_VERSION_RE = re.compile(r"^v?(\d+)\.(\d+)(?:\.(\d+))?$")


def get_talos_minor(timeout_seconds: float = 10.0) -> int | None:
    """Return the Talos minor version of the server's talosctl, or None."""
    try:
        result = subprocess.run(
            ["talosctl", "version", "--client"],
            capture_output=True,
            text=True,
            timeout=timeout_seconds,
        )
    except (OSError, subprocess.SubprocessError):
        return None

    if result.returncode != 0:
        return None

    match = _TALOS_TAG_RE.search(result.stdout or "")
    if not match:
        return None
    return int(match.group(2))


def get_supported_k8s_minors(talos_minor: int | None) -> set[int] | None:
    """Supported Kubernetes minors for a Talos minor.

    Returns None when the Talos version is unknown (talosctl unavailable or the
    minor is missing from the table) — callers should then impose no filtering.
    """
    if talos_minor is None:
        return None
    minors = TALOS_MINOR_TO_K8S_MINORS.get(talos_minor)
    return set(minors) if minors is not None else None


def filter_supported_versions(
    versions: list[str], supported_minors: set[int] | None
) -> list[str]:
    """Keep only Kubernetes 1.x versions whose minor is supported.

    When ``supported_minors`` is None (unknown Talos version) the list is
    returned unfiltered.
    """
    if supported_minors is None:
        return list(versions)

    result: list[str] = []
    for version in versions:
        match = _K8S_VERSION_RE.match(version)
        if match and int(match.group(1)) == 1 and int(match.group(2)) in supported_minors:
            result.append(version)
    return result


def newest_version(versions: list[str]) -> str | None:
    """Return the newest version tag by (major, minor, patch), or None."""
    parsed: list[tuple[tuple[int, int, int], str]] = []
    for version in versions:
        match = _K8S_VERSION_RE.match(version)
        if not match:
            continue
        key = (int(match.group(1)), int(match.group(2)), int(match.group(3) or 0))
        parsed.append((key, version))

    if not parsed:
        return None
    return max(parsed, key=lambda item: item[0])[1]
