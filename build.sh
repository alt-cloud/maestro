#!/bin/sh

cd ./plugin/maestro
npm install
npm run build

cd ../..
pwd
# docker build -t altlinux.space/alt-orchestra-dev/maestro-dev:latest .
docker build --no-cache -t altlinux.space/alt-orchestra-dev/maestro-dev:latest .

