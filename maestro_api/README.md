[![License: MPL 2.0](https://img.shields.io/badge/License-MPL_2.0-brightgreen.svg)](https://opensource.org/licenses/MPL-2.0)

## License

This project is licensed under the Mozilla Public License v2.0 - see the [LICENSE](LICENSE) file for details.

Third-party components and their licenses are listed in the [NOTICE](NOTICE) file.

# Maestro API

Backend API for the Maestro Headlamp plugin.

## Requirements

- Python 3.11+
- System binaries: `talosctl`, `nmap`

## Setup

```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -U pip
pip install -e .
```

Alternative (system + venv bootstrap):

```bash
./scripts/install.sh
```

## Run

```bash
maestro-api
```

or:

```bash
./scripts/start.sh
```

## Configuration

Environment variables:

- `MAESTRO_API_HOST` (default: `127.0.0.1`)
- `MAESTRO_API_PORT` (default: `5000`)
- `MAESTRO_API_DEBUG` (default: `false`)
- `MAESTRO_CORS_ORIGINS` (default: `127.0.0.1`)
- `MAESTRO_TALOS_COMMAND_TIMEOUT_SECONDS` (default: `30.0`)
- `MAESTRO_NMAP_COMMAND_TIMEOUT_SECONDS` (default: `120.0`)
- `MAESTRO_PORT_CHECK_TIMEOUT_SECONDS` (default: `3.0`)

Example file: `env.example`
