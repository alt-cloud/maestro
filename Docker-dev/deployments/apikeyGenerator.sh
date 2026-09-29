#!/bin/sh

# SPDX-FileCopyrightText: 2026 BaseALT LLC
#
# SPDX-License-Identifier: MPL-2.0

format() {
  echo -ne "Format:\n\t$1 <catalog>\n" >&2
  exit 1
}

maestroApiKeysFile="../../maestroApiKeysFile.json"
if [ -f $maestroApiKeysFile ]
then
  if jq . $maestroApiKeysFile >/dev/null 2>&1
  then
    echo "Maestro API KEYS FILE exist and correct" >&2
    exit 0
  else
    echo "Maestro API KEYS FILE exist but not correct. Recreated." >&2
  fi
fi

keyReadWrite=$(pwgen 64 1)
keyOnlyRead=$(pwgen 64 1)
keyOnlyReadExpired=$(pwgen 64 1)
keyAdmin=$(pwgen 64 1)
nextMonth=$(date -d '1 Month' +%FT%TZ)

echo '[
  {
    "key": "'$keyReadWrite'",
    "scopes": ["read", "write"],
    "rate_limit_per_minute": 60
  },
  {
    "key": "'$keyOnlyRead'",
    "scopes": ["read"],
    "rate_limit_per_minute": 10
  },
  {
    "key": "'$keyOnlyReadExpired'",
    "scopes": ["read"],
    "rate_limit_per_minute": 10,
    "expires_at": "'$nextMonth'"
  },
  {
    "key": "'$keyAdmin'",
    "scopes": ["admin"],
    "rate_limit_per_minute": 1000
  }
]
'  | jq . > $maestroApiKeysFile
echo "Maestro API KEYS FILE created" >&2

