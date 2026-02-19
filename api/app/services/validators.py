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


def is_table_command(cmd: str) -> bool:
    return (
        cmd in TABLE_COMMANDS
        or cmd.startswith("etcd/")
        or cmd.startswith("image/")
    )


def is_text_command(cmd: str) -> bool:
    return (
        cmd in TEXT_COMMANDS
        or cmd.startswith("logs/")
        or cmd.startswith("inspect/")
    )
