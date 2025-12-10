#!/bin/sh

dir="/tmp/getSubcommands_$$"
# dir="/tmp/getSubcommands"
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
#   echo $LEVEL1 $ALIASES
  echo $LEVEL2 $ALIASES >> $dir/$LEVEL1
done
# exit
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
#   sed -e 's/^/    - /' $NS
done
rm -rf $dir
