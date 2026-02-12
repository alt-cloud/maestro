import json
import subprocess
import shlex
import os
import yaml
from pathlib import Path
import socket

# Функция преобразует табличный формат вывода команд talosctl в формат JSON
# Список полей и смещение каждого столбца определяется по первой строке заголовка
# Имена полей приводятся к виду -  Первый символ заглавный, остабные строчные
# Поддерживаются заголовки с одним пробелом внутри (типа LOCAL ADDRESS).
# В этом слцчае формируется один заголовок с именем LocalAddress
def tableToJson(str):
  nHead = str.find("\n")
  head = str[0:nHead]
  columns = head.split()
  if len(columns) == 1:
    head = 'Id'
    body = str.split("\n")
  else:
    body = str[nHead+1:].split("\n")
  columns = head.split()
  shifts = {}
  prevColumn = None
  shift = 0
  for column in columns:
    columnName = column.title()
    shifts[columnName] = {}
    start = head[shift:].find(column) + shift
    # print ('SHIFT=%d TAIL=%s  ' % (shift, head[shift:, columnName, ]))
    # print("columnName=%s prevColumn=%s" % (columnName, prevColumn))
    # print(shifts)
    if prevColumn:
      if start - shifts[prevColumn]['start'] - len(prevColumn) == 1:
        mergedColumnName = prevColumn + columnName
        shifts[mergedColumnName] = {}
        shifts[mergedColumnName]['start'] = shifts[prevColumn]['start']
        del shifts[columnName]
        del shifts[prevColumn]
        columnName = mergedColumnName
        prevColumn = columnName
      else:
        shifts[prevColumn]['end'] = start
        shifts[columnName]['start'] = start
        prevColumn = columnName
    else:
      prevColumn = columnName
      shifts[columnName]['start'] = start
    # print('prevColumn=', prevColumn)
    shift = start
  shifts[columnName]['end'] = -1
  # print(shifts)
  rows = []
  for row in body:
    if len(row) == 0:
      break
    vals = {}
    for columnName in shifts:
      start = shifts[columnName]['start']
      end   = shifts[columnName]['end']
      if end < 0:
        vals[columnName] = row[start:].strip()
      else:
        vals[columnName] = row[start:end].strip()
    rows.append(vals)
  return json.dumps(rows, indent=2)

def runShellCommand(runCmd, homedir):
  print('runShellCommand=', runCmd)
  result = subprocess.run(runCmd,
    shell=True,
    stdout=subprocess.PIPE,
    cwd='%s/.maestro/' % homedir,
    encoding='utf-8'
  )
  return result

def getDiskName(ip):
  homedir = os.getenv('HOME')
  runCmd = 'talosctl get  discoveredvolume -o json -n %s -e %s -i' % (ip, ip)
  result = maestro.runShellCommand(runCmd, homedir)
  result = json.loads('[' + result.stdout.replace("}\n{","},{") + ']')
  for volInfo in result:
    id = volInfo['metadata']['id']
    if id[0:4] == 'loop' or id[0:2] == 'sr':
      continue
    disk = volInfo['spec']['dev_path']
    return disk

# Функция анализирует вывод команды nmap и определеяет список IP адресов узлов (с DNS именамиб если они имеются),
# которые слушают порты 50000 (сервис apid) и 6443 (kubeAPI).
# Функция возвращает список узлов в формате
# {
#   <IP>: {'dns': '' or dnsName', 'ip: <IP>, 'kubeState': <open, closed, ...>, 'apidState': <open, closed, ...>},
#   ...
# }
def nodesList(nmapStr):
  nmapStrs = nmapStr.split('\n')
  prefix = 'Nmap scan report for '
  prefixLen = len(prefix)
  kubePortStr = '6443/tcp'
  apidPortStr = '50000/tcp'
  ret = {}
  nodeState = {}
  for line in nmapStrs:
    if line[0:prefixLen] == prefix:
      print(line)
      # if len(nodeState) > 0 and nodeState['apidState'] == 'open':
      if len(nodeState) > 0:
        ret[nodeState['ip']] = nodeState
      nodeState = {}
      tail = line[prefixLen:].split()
      if len(tail) > 1:
        nodeState['dns'] = tail[0]
        nodeState['ip'] = tail[1][1:-1]
      else:
        nodeState['dns'] =''
        nodeState['ip'] = tail[0]
    elif line[0:len(kubePortStr)] == kubePortStr:
      nodeState['kubeState'] = line.split()[1]
    elif line[0:len(apidPortStr)] == apidPortStr:
      nodeState['apidState'] = line.split()[1]
  # if len(nodeState) > 0 and nodeState['apidState'] == 'open':
  if len(nodeState) > 0:
    ret[nodeState['ip']] = nodeState
  return ret

def isMaintenance(ip):
  homedir = os.getenv('HOME')
  runCmd = 'talosctl get  discoveredvolume -o json -n %s -e %s -i' % (ip, ip)
  result = runShellCommand(runCmd, homedir)
  result = json.loads('[' + result.stdout.replace("}\n{","},{") + ']')
  for volInfo in result:
    if 'partition_label' in volInfo['spec']:
      return False
  return True


def talosgetspec(subcmd, node, insecure):
  homedir = os.getenv('HOME')
  runCmd = 'talosctl get %s -e %s -n %s -o json %s' % (subcmd, node, node, insecure)
  result = runShellCommand(runCmd, homedir)
  returncode = result.returncode
  ret = ''
  if returncode == 0:
    jsonStr = result.stdout.strip()
    if len(jsonStr) != 0:
      jsonDict = json.loads(jsonStr)
      ret = jsonDict['spec']
  return [ret, returncode]

def nodeClusterName(node):
  [spec, returncode] = talosgetspec('info', node, '')
  # print('clusterName=%s returncode=%d ' % (clusterName, returncode))
  print('spec=', spec)
  print('returncode=', returncode)
  if returncode != 0:
    clusterName = '_Orphans'
    insecure = '-i'
    if not isMaintenance(node):
      clusterName = '_Unknown'
  else:
    clusterName = spec['clusterName']
    insecure = ''
  return [insecure, clusterName]

def is_port_open(host: str, port: int, timeout: float = 3.0) -> bool:
    sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    sock.settimeout(timeout)
    result = sock.connect_ex((host, port))  # возвращает 0 при успехе, иначе errno
    sock.close()
    return result == 0

def refreshTalosconfig():
  homedir = os.getenv('HOME')
  maestroConfigDir =  '%s/.maestro' % homedir
  print('refreshTalosconfig:: Before: maestroConfigDir=%s' % maestroConfigDir)
  talosconfigFile = '%s/talosconfig' % maestroConfigDir
  if not os.path.exists(talosconfigFile):
    initTalosconfig()
  fp = open(talosconfigFile, 'r')
  talosconfig = yaml.safe_load(fp)
  fp.close()
  print('refreshTalosconfig:: Before: talosconfig=%s' % json.dumps(talosconfig, indent=2))
  newNodes = {'_Orphans': {'endpoints': [], 'nodes': []} , '_Unknown': {'endpoints': [], 'nodes': []} }
  changed = False
  for contextName in talosconfig['contexts']:
    endpoints = talosconfig['contexts'][contextName]['endpoints']\
      if 'endpoints' in talosconfig['contexts'][contextName] else []
    print('refreshTalosconfig:: contextName=%s endpoints=%s' % (contextName, json.dumps(endpoints)))
    for ip in endpoints:
      if is_port_open(ip, 50000):
        [insecure, toClusterName] = nodeClusterName(ip)
        print('refreshTalosconfig:: ip=%s port 50000 open toClusterName=%s insecure=' % (ip, toClusterName), insecure)
        if toClusterName not in newNodes:
          newNodes[toClusterName] = {'endpoints': [], 'nodes': []}
        if is_port_open(ip, 6443): # endpoint остается в endpoint
          newNodes[toClusterName]['endpoints'].append(ip)
          print('refreshTalosconfig:: ip=%s port 6443 opened controlplane place in cluster toClusterName=%s ' % (ip, toClusterName))
          if contextName != toClusterName:
            changed = True
        else: # endpoint перешел в node состояние
          newNodes[toClusterName]['nodes'].append(ip)
          changed = True
          print('refreshTalosconfig:: ip=%s port 6443 closed controlplane place as WORKER in cluster toClusterName=%s ' % (ip, toClusterName))
      else: # endpoint в init режиме
        if contextName not in newNodes:
          newNodes[contextName] = {'endpoints': [], 'nodes': []}
        newNodes[contextName]['endpoints'].append(ip)
        print('refreshTalosconfig:: ip=%s ports  CLOSED (INIT?) controlplane remain in old cluster contextName=%s ' % (ip, contextName))

    nodes = talosconfig['contexts'][contextName]['nodes']\
      if 'nodes' in talosconfig['contexts'][contextName] else []
    print('refreshTalosconfig:: contextName=%s nodes=%s' % (contextName, json.dumps(nodes)))
    for ip in nodes:
      if is_port_open(ip, 50000):
        [insecure, toClusterName] = nodeClusterName(ip)
        print('refreshTalosconfig:: ip=%s port 50000 open toClusterName=%s insecure=' % (ip, toClusterName), insecure)
        if toClusterName not in newNodes:
          newNodes[toClusterName] = {'endpoints': [], 'nodes': []}
        if is_port_open(ip, 6443): # node перешел в endpoint
          newNodes[toClusterName]['endpoints'].append(ip)
          changed = True
          print('refreshTalosconfig:: ip=%s port 6443 opened worker place AS CONTROLPLANE in cluster toClusterName=%s ' % (ip, toClusterName))
        else: # node остался node
          newNodes[toClusterName]['nodes'].append(ip)
          if contextName != toClusterName:
            changed = True
          print('refreshTalosconfig:: ip=%s port 6443 closed worker place in cluster toClusterName=%s ' % (ip, toClusterName))
      else:  # worker in init mode
        if contextName not in newNodes:
          newNodes[contextName] = {'endpoints': [], 'nodes': []}
        newNodes[contextName]['nodes'].append(ip)
        print('refreshTalosconfig:: ip=%s ports  CLOSED (INIT?) worker remain in old cluster contextName=%s ' % (ip, contextName))

  # print('refreshTalosconfig:: After:  talosconfig=%s' % json.dumps(talosconfig, indent=2))
  for clusterName in newNodes:
    endpoints = list(set(newNodes[clusterName]['endpoints'])) # uniq values
    if endpoints != newNodes[clusterName]['endpoints']:
      newNodes[clusterName]['endpoints'] = endpoints
      changed = True
    nodes = list(set(newNodes[clusterName]['nodes'])) # uniq values
    if nodes != newNodes[clusterName]['nodes']:
      newNodes[clusterName]['nodes'] = nodes
      changed = True
  print('refreshTalosconfig:: newNodes=%s' % json.dumps(newNodes, indent=2))
  print('refreshTalosconfig:: changed=', changed)
  if changed:
    print('refreshTalosconfig:: talosctl changed')
    for clusterName in newNodes:
      # runShellCommand('talosctl config context %s' % clusterName, homedir)
      endpoints = newNodes[clusterName]['endpoints']
      nodes = newNodes[clusterName]['nodes']
      # print('refreshTalosconfig:: clusterName=%s endpoints:' % (clusterName, endpoints)
      # print('refreshTalosconfig:: clusterName=%s nodes:' % clusterName, nodes)
      runShellCommand("yq -yi '.contexts.%s.endpoints=%s' talosconfig" % (clusterName, json.dumps(endpoints)), homedir)
      runShellCommand("yq -yi '.contexts.%s.nodes=%s' talosconfig" % (clusterName, json.dumps(nodes)), homedir)

def initTalosconfig():
  homedir = os.getenv('HOME')
  maestroConfigDir =  '%s/.maestro' % homedir
  talosconfigFile = '%s/talosconfig' % maestroConfigDir
  fp = open(talosconfigFile, 'w')
  emptyContent = '''context: _Orphans
contexts:
  _Orphans:
    endpoints: []
    nodes: []
  _Unknown:
    endpoints: []
    nodes: []
'''
  fp.write(emptyContent)
  fp.close()
  start_dir = Path(maestroConfigDir)
  for item in start_dir.iterdir():
    print('initTalosconfig:: itemName=%s' % item.name)
    if item.is_dir():
      talosconfigFile = '%s/%s/talosconfig' % (maestroConfigDir, item.name)
      print('initTalosconfig:: DIR=%s talosconfigFile=%s' % (item.name, talosconfigFile))
      if os.path.exists(talosconfigFile):
        print('initTalosconfig:: merge subTalosconfig=%s' % talosconfigFile)
        runCmd = 'talosctl config merge %s' % talosconfigFile
        runShellCommand(runCmd, homedir)
