#!/bin/sh

iface=$1
if ! ip a show  dev $iface >/dev/null 2>&1
then
    echo "The interface $iface does not exist"
    exit 1
fi

set -- $(nft -a list chain ip libvirt_network guest_input | grep reject)

if [ $# -gt 0 ]
then
  while [ $# -gt 1 ]; do shift; done
  rejectRule=$1
  echo "Allow traffic from virbr0 to $iface"
  nft insert rule ip libvirt_network guest_input position $rejectRule iif virbr0 oif docker0 accept
  echo "Allow traffic from $iface to virbr0"
  nft insert rule ip libvirt_network guest_input position $rejectRule oif virbr0 iif docker0 accept
fi

