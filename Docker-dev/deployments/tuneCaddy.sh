#!/bin/sh

caddyTemplateFile=$1
caddyFile='/etc/caddy/Caddyfile'
caddyRpmsaveFile="${caddyFile}.rpmsave"
if [ -f $caddyFile ]
then
  if [ ! -f $caddyRpmsaveFile ]
  then
    mv $caddyFile $caddyRpmsaveFile
  fi
fi
shift
ifs=$IFS;IFS+=,;set -- $@;IFS=$ifs
sed "/@blocked not remote_ip*/ s|$| $*|" $caddyTemplateFile > $caddyFile
systemctl reload-or-restart caddy
