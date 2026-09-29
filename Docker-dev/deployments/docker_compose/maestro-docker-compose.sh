#!/bin/sh

# SPDX-FileCopyrightText: 2026 BaseALT LLC
#
# SPDX-License-Identifier: MPL-2.0

if [ $UID -eq 0 ]
then
  echo "Скрипт не может вызываться в пользователем с UID=0" >&2
  exit 1
fi
action=$1
case "$action" in
'up')
  source ../../envVars.sh
  maestroApiKeysFile="../../maestroApiKeysFile.json"
  ../../apikeyGenerator.sh
  export MAESTRO_API_KEYS=$(cat $maestroApiKeysFile)
  if [ -f ./.env ]
  then
    source ./.env
  fi
  if [ $(basename $PWD ) = 'inet' ]
  then
    sudo ../../tuneCaddy.sh ../../Caddyfile.template $MAESTRO_API_WHITELIST
  fi
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
docker compose -p $projectName $action
