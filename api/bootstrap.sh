#!/bin/sh
set -x;
ip=$1
sleep 5;
until nmap $ip/32 -p 50000 | grep open; do sleep 5; done;
until talosctl bootstrap -e $ip -n $ip 2>&1 | grep AlreadyExists;
do
  sleep 5;
done;
until talosctl health -e $ip -n $ip; do sleep 5; done;
talosctl -e $ip -n $ip kubeconfig -f;
