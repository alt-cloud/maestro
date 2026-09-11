#!/bin/sh

cd ../plugin/maestro
npm install
npm run build

cd ../../Docker-dev
pwd
docker build -f ./Dockerfile -t altlinux.space/alt-orchestra-dev/maestro-dev:latest ..
# docker build -f ./Dockerfile --no-cache -t altlinux.space/alt-orchestra-dev/maestro-dev:latest ..

