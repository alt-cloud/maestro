#!/bin/sh
set -x
# export HOME="/home/maestro"
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
if [ -z "$MAESTRO_FRONTEBD_HOST" ]
then
  MAESTRO_FRONTEBD_HOST=127.0.0.1
fi
if [ -z "$MAESTRO_API_URL" ]
then
  MAESTRO_API_URL='http://127.0.0.1:5000'
fi

echo 'root ALL=(ALL) ALL' >/etc/sudoers.d/root
echo "{\"MAESTRO_API_URL\": \"$MAESTRO_API_URL\"}" | jq . > /usr/share/headlamp/plugins/maestro/config.json

cmd="/usr/bin/headlamp-server \
    -listen-addr $MAESTRO_FRONTEBD_HOST\
    -port 4466\
    -html-static-dir /usr/share/headlamp/frontend\
    -plugins-dir /usr/share/headlamp/plugins"
while true
do
  if [ "$container" = 'podman' ]
  then
    $cmd >&2
  else
    sudo -u $MAESTRO_API_USER  $cmd >&2
  fi
  echo 'Restart headlamp plugin'
  sleep 1
done &
# Backend
VARS=$(env | grep '^MAESTRO_' | cut -d= -f1 | paste -sd, -)
source /home/maestro/maestro_api/.venv/bin/activate
cmd="/home/maestro/maestro_api/.venv/bin/maestro-api"
while true
do
  if [ "$container" = 'podman' ]
  then
    $cmd >&2
  else
    sudo -u $MAESTRO_API_USER --preserve-env=$VARS,HOME,PATH,UID $cmd >&2
  fi
  echo 'Restart maestro API'
  sleep 1
done &

sleep infinity
