export MAESTRO_API_KEYS='[
  {
    "key": "scope-read-write",
    "scopes": ["read", "write"],
    "rate_limit_per_minute": 60
  },
  {
    "key": "scope-read-expired",
    "scopes": ["read"],
    "rate_limit_per_minute": 10,
    "expires_at": "2026-07-01T00:00:00Z"
  },
  {
    "key": "scope-superadmin-key",
    "scopes": ["admin"],
    "rate_limit_per_minute": 1000
  }
]'

export DOCKER_NETS=',172.16.0.0/12'

export PODMAN_NETS=',10.88.0.0/8'

export HTTPS_CORS_ORIGIN=',https://www.maestro.local'

export MAESTRO_API_URL=https://api.maestro.local:5443

export INET_API_WHITELIST=',10.150.7.0/24,192.168.100.0/24'
