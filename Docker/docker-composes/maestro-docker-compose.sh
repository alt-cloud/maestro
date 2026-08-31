#!/bin/sh

function getProjectName() {
  ifs=$IFS;   IFS=/;set -- $(pwd);IFS=$ifs
  while [ $# -gt 0 -a "$1" != 'docker-composes' ]; do shift; done; shift
  ret=$1
  while [ $# -gt 1 ];  do shift; ret+="-$1";  done
  echo $ret
}

if [ $UID -eq 0 ]
then
  echo "Скрипт не может вызываться в пользователем с UID=0" >&2
  exit 1
fi
action=$1
case "$action" in
'up') action='up -d';break;;
'down') break;;
*) echo "Формат $0 up|down" >&2; exit 1
esac

export MAESTRO_API_USER=$USER
export MAESTRO_API_UID=$(id -u $MAESTRO_API_USER)
export MAESTRO_API_GID=$(id -g $MAESTRO_API_USER)
projectName=$(getProjectName)
docker compose -p $projectName $action
