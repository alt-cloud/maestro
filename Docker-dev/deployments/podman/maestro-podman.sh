#!/bin/sh

source ../../getProjectName.sh
projectName=$(getProjectName)
source ./.env
export MAESTRO_API_USER=$USER
export MAESTRO_API_UID=$(id -u $MAESTRO_API_USER)
export MAESTRO_API_GID=$(id -g $MAESTRO_API_USER)
action=$1
case "$action" in
'up')
  source ../../envVars.sh
  source ./.env

  sudo ../../tuneCaddy.sh ../../Caddyfile.template $MAESTRO_API_WHITELIST
  podman run -d --name $projectName \
    -p 127.0.0.1:4466:4466 \
    -p 127.0.0.1:5000:5000 \
    --cap-add CAP_NET_RAW \
    --cap-add CAP_NET_ADMIN \
    -e MAESTRO_API_USER="$MAESTRO_API_USER" \
    -e MAESTRO_API_UID="$MAESTRO_API_UID" \
    -e MAESTRO_FRONTEND_HOST=0.0.0.0 \
    -e MAESTRO_API_HOST=0.0.0.0 \
    -e MAESTRO_API_KEYS="$MAESTRO_API_KEYS" \
    -e MAESTRO_CORS_ORIGINS="$MAESTRO_CORS_ORIGINS" \
    -e MAESTRO_API_WHITELIST="$MAESTRO_API_WHITELIST" \
    -v /home/$MAESTRO_API_USER/.maestro:/home/maestro/.maestro \
    -v /home/$MAESTRO_API_USER/.kube:/home/maestro/.kube \
    altlinux.space/alt-orchestra-dev/maestro-dev:latest
  break;;
'down')
  podman rm -f $projectName
  break;;
*) echo "Формат $0 up|down" >&2; exit 1
esac
