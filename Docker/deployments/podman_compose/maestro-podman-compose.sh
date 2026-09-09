#!/bin/sh

if [ $UID -eq 0 ]
then
  echo "Скрипт не может вызываться в пользователем с UID=0" >&2
  exit 1
fi
action=$1
source ./.env
case "$action" in
'up')
  sudo ../../tuneCaddy.sh ../../Caddyfile.template $MAESTRO_API_WHITELIST
  action='up -d';
  break;;
'down') break;;
*) echo "Формат $0 up|down" >&2; exit 1
esac

source ../../getProjectName.sh
projectName=$(getProjectName)
export MAESTRO_API_USER=$USER
export MAESTRO_API_UID=$(id -u $MAESTRO_API_USER)
export MAESTRO_API_GID=$(id -g $MAESTRO_API_USER)
export MAESTRO_API_KEYS
set

podman-compose -p $projectName $action

# action=$1
# case "$action" in
# 'up') action='up -d';break;;
# 'down') break;;
# *) echo "Формат $0 up|down" >&2; exit 1
# esac
# source ../../getProjectName.sh
# projectName=$(getProjectName)
#
# export MAESTRO_API_USER=$USER
# export MAESTRO_API_UID=$(id -u $MAESTRO_API_USER)
# export MAESTRO_API_GID=$(id -g $MAESTRO_API_USER)
# projectName=$(getProjectName)
# podman-compose -p $projectName $action

