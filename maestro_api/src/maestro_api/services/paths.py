import os

from maestro_api.services.validators import validate_cluster_name


def get_home_dir() -> str:
    return os.path.expanduser("~")


def get_maestro_config_dir() -> str:
    return os.path.join(get_home_dir(), ".maestro")


def get_cluster_config_dir(cluster_name: str) -> str:
    validate_cluster_name(cluster_name)
    base_dir = os.path.abspath(get_maestro_config_dir())
    cluster_dir = os.path.abspath(os.path.join(base_dir, cluster_name))
    if os.path.commonpath([base_dir, cluster_dir]) != base_dir:
        raise ValueError("Cluster path escapes maestro config directory")
    return cluster_dir
