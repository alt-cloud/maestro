#!/bin/sh

set -- $(nft -a list chain ip libvirt_network guest_input | grep reject)

if [ $# -gt 0 ]
then
  while [ $# -gt 1 ]; do shift; done
  nft delete rule ip libvirt_network guest_input handle $1
fi
