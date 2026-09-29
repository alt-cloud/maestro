#!/bin/sh

# SPDX-FileCopyrightText: 2026 BaseALT LLC
#
# SPDX-License-Identifier: MPL-2.0

cd ../plugin/maestro
npm install
npm run build

cd ../../Docker-dev
pwd
docker build -f ./Dockerfile -t altlinux.space/alt-orchestra-dev/maestro-dev:latest ..
# docker build -f ./Dockerfile --no-cache -t altlinux.space/alt-orchestra-dev/maestro-dev:latest ..

