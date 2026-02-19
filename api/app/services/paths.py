import os


def get_home_dir() -> str:
    return os.path.expanduser("~")


def get_maestro_config_dir() -> str:
    return os.path.join(get_home_dir(), ".maestro")


def get_cluster_config_dir(cluster_name: str) -> str:
    return os.path.join(get_maestro_config_dir(), cluster_name)
