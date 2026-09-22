#!/bin/sh
if [ $(id -u maestro) -eq "$MAESTRO_API_UID" ]
then
  MAESTRO_API_USER='maestro'
else
  MAESTRO_API_USER='maestro'
  userdel $MAESTRO_API_USER
  useradd -M -u $MAESTRO_API_UID -d /home/maestro $MAESTRO_API_USER
  chown $MAESTRO_API_UID /home/maestro/.maestro /home/maestro/.kube
fi

# Frontend
if [ -z "$MAESTRO_FRONTEND_HOST" ]
then
  MAESTRO_FRONTEND_HOST=127.0.0.1
fi
if [ -z "$MAESTRO_API_URL" ]
then
  MAESTRO_API_URL='http://127.0.0.1:5000'
fi

echo 'root ALL=(ALL) ALL' >/etc/sudoers.d/root
echo "{\"MAESTRO_API_URL\": \"$MAESTRO_API_URL\"}" | jq . > /usr/share/headlamp/plugins/maestro/config.json

VARS=$(env | grep '^MAESTRO_' | cut -d= -f1 | paste -sd, -)
EXPORTVARS="UID=$MAESTRO_API_UID USER=maestro HOME=/home/maestro LOGNAME=maestro"

cmd="/usr/bin/headlamp-server \
    -listen-addr $MAESTRO_FRONTEND_HOST\
    -port 4466\
    -html-static-dir /usr/share/headlamp/frontend\
    -plugins-dir /usr/share/headlamp/plugins"
while true
do
  if [ "$container" = 'podman' ]
  then
    sudo $EXPORTVARS --preserve-env=$VARS $cmd >&2
  else
    sudo -u $MAESTRO_API_USER $EXPORTVARS --preserve-env=$VARS $cmd >&2
  fi
  echo 'Restart headlamp plugin'
  sleep 1
done &
# Backend
source /home/maestro/maestro_api/.venv/bin/activate
cmd="/home/maestro/maestro_api/.venv/bin/maestro-api"
while true
do
  if [ "$container" = 'podman' ]
  then
    sudo $EXPORTVARS --preserve-env=$VARS $cmd >&2
  else
    sudo -u $MAESTRO_API_USER $EXPORTVARS --preserve-env=$VARS $cmd >&2
  fi
  echo 'Restart maestro API'
  sleep 1
done &

sleep infinity
