#!/bin/sh

dir=getSubcommands
mkdir $dir
rm -f $dir/*

ifs=$IFS
while read NODE NAMESPACE TYPE ID VERSION ALIASES
do
  IFS=.
  set -- $ID
  LEVEL1=$2
  IFS=$ifs
#   echo $LEVEL1 $ALIASES
  echo $ALIASES >> $dir/$LEVEL1
done

cd $dir
for NS in *
do
  echo "${NS}:"
  sed -e 's/^/  - /' $NS
done
