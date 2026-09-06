#!/bin/sh

source ./.env
export MAESTRO_API_USER=$USER
export MAESTRO_API_UID=$(id -u $MAESTRO_API_USER)
export MAESTRO_API_GID=$(id -g $MAESTRO_API_USER)
docker run -d --name docker-localhost-maestro \
  -p 127.0.0.1:4466:4466 \
  -p 127.0.0.1:5000:5000 \
  -e MAESTRO_API_USER="$MAESTRO_API_USER" \
  -e MAESTRO_API_UID="$MAESTRO_API_UID" \
  -e MAESTRO_FRONTEBD_HOST=0.0.0.0 \
  -e MAESTRO_API_HOST=0.0.0.0 \
  -e MAESTRO_API_KEYS="$MAESTRO_API_KEYS" \
  -e MAESTRO_CORS_ORIGINS="$MAESTRO_CORS_ORIGINS" \
  -e MAESTRO_API_WHITELIST="$MAESTRO_API_WHITELIST" \
  -v /home/$MAESTRO_API_USER/.maestro:/home/maestro/.maestro \
  -v /home/$MAESTRO_API_USER/.kube:/home/maestro/.kube \
  altlinux.space/alt-orchestra-dev/maestro-dev:latest

  # -v /home/kaf/2026/Maestro/maestro/maestro_api/src:/home/maestro/maestro_api/src
