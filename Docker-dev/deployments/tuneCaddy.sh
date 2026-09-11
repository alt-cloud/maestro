#!/bin/sh

set -x
caddyTemplateFile=$1
shift
ifs=$IFS;IFS+=,;set -- $@;IFS=$ifs
sed "/@blocked not remote_ip*/ s|$| $*|" $caddyTemplateFile > /etc/caddy/Caddyfile
systemctl reload-or-restart caddy
