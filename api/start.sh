#!/bin/sh
export TALOSCONFIG=$HOME/.maestro/talosconfig
mkdir -p $HOME/.maestro
./flaskAPI.py
