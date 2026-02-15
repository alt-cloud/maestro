#!/bin/sh
export TALOSCONFIG=$HOME/.maestro/talosconfig
echo TALOSCONFIG=$TALOSCONFIG
mkdir -p $HOME/.maestro
./flaskAPI.py
