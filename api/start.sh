#!/bin/sh
mkdir -p $HOME/.maestro
cp bootstrap.sh $HOME/.maestro
./flaskAPI.py
