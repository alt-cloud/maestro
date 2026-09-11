function getProjectName() {
  ifs=$IFS;   IFS=/;set -- $(pwd);IFS=$ifs
  while [ $# -gt 2 ]; do shift; done;
  ret=$1
  while [ $# -gt 1 ];  do shift; ret+="-$1";  done
  echo $ret
}
