#!/bin/sh
cd maestro_api
./scripts/install.sh
# python3 -m venv .venv
cd ..
. .venv/bin/activate
python3 -m pip freeze > Docker/requrements.txt
deactivate
sed -i -e "s|ssh://forgejo@altlinux.space/kaf/maestro.git|https://altlinux.space/kaf/maestro.git|" Docker/requrements.txt

cd plugin/maestro
npm install
npm run build

cd ../..
(
cd plugin/maestro/
npm run build
)
docker build -t altlinux.space/alt-orchestra-dev/maestro-dev:latest .
# docker build --no-cache -t altlinux.space/alt-orchestra-dev/maestro-dev:latest .

