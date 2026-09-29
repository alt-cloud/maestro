#!/bin/sh

# SPDX-FileCopyrightText: 2026 BaseALT LLC
#
# SPDX-License-Identifier: MPL-2.0

dir="/tmp/getSubcommands_$$"
mkdir $dir
rm -f $dir/*

ifs=$IFS
while read NODE NAMESPACE TYPE ID VERSION ALIASES
do
  IFS=.
  set -- $ID
  LEVEL1=$2
  LEVEL2=$1
  IFS=$ifs
  echo $LEVEL2 $ALIASES >> $dir/$LEVEL1
done
cd $dir
for NS in *
do
  echo "${NS}:"
  echo "  name: $NS"
  echo "  commands:"
  while read id name aliases
  do
    echo "  - id: $id"
    echo "    aliases: $name $aliases"
    echo "    command: $name"
    echo "    name: $name"
  done < $NS
done
rm -rf $dir
