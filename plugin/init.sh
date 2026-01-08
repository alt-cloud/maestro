#!/bin/sh
apt-get install -y npm
npx --yes @kinvolk/headlamp-plugin create maestro
cd maestro
npm install
