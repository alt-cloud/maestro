#!/bin/sh
set -x


if [ -z "$MAESTRO_DEPLOYMENT_MODE" ]
then
  MAESTRO_DEPLOYMENT_MODE="frontend backend"
fi

caddy run --config /etc/caddy/Caddyfile &

for mode in $MAESTRO_DEPLOYMENT_MODE
do
  case $mode in
  'frontend')
    if [ -z "$MAESTRO_FRONTEBD_HOST" ]
    then
      MAESTRO_FRONTEBD_HOST=127.0.0.1
    fi
    if [ -z "$MAESTRO_API_URL" ]
    then
      MAESTRO_API_URL='http://127.0.0.1:5000'
    fi
    echo "{\"MAESTRO_API_URL\": \"$MAESTRO_API_URL\"}" | jq . > /usr/share/headlamp/plugins/maestro/config.json
    KUBECONFIG=~/.kube/config
    su - -c "/usr/bin/headlamp-server \
      -listen-addr $MAESTRO_FRONTEBD_HOST\
      -port 4466\
      -html-static-dir /usr/share/headlamp/frontend\
      -plugins-dir /usr/share/headlamp/plugins" maestro  >&2  &
    ;;
  'backend')
    echo 'root ALL=(ALL) ALL' >/etc/sudoers.d/root
    VARS=$(env | grep '^MAESTRO_' | cut -d= -f1 | paste -sd, -)
    if [ $(id -u maestro) -eq "$MAESTRO_API_UID" ]
    then
      MAESTRO_API_USER='maestro'
    elif [ $MAESTRO_API_UID -eq 0 ]
    then
      MAESTRO_API_USER='root'
    else
      MAESTRO_API_USER='maestro-api'
      useradd -u $MAESTRO_API_UID -d /home/maestro $MAESTRO_API_USER
      chown $MAESTRO_API_UID /home/maestro/.maestro /home/maestro/.kube
    fi
    source /home/maestro/maestro_api_venv/bin/activate
    sudo -u $MAESTRO_API_USER --preserve-env=$VARS /home/maestro/maestro_api_venv/bin/maestro-api >&2  &
    ;;
  esac
done

sleep infinity
