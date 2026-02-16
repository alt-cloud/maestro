import json
import subprocess
import shlex
import os
import yaml
from pathlib import Path
import socket

VIRTUALCLUSTERS = ['_Orphans', '_Unknown']
TALOSNODETYPETOKUBE = {'endpoints': 'controlplanes', 'nodes': 'workers'}
KUBENODETYPETOTALOS = {'controlplanes': 'endpoints', 'workers': 'nodes'}

def runShellCommand(runCmd, clusterDir):
  runCmd = 'clusterDir=%s TALOSCONFIG=talosconfig %s' % (clusterDir, runCmd)
  print('runShellCommand=%s' % runCmd)
  result = subprocess.run(runCmd,
    shell=True,
    stdout=subprocess.PIPE,
    stderr=subprocess.PIPE,
    cwd=clusterDir,
    encoding='utf-8'
  )
  return result

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

def getDiskName(ip):
  homedir = os.getenv('HOME')
  runCmd = 'talosctl get  discoveredvolume -o json -n %s -e %s -i' % (ip, ip)
  result = runShellCommand(runCmd, homedir)
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
  if len(nodeState) > 0 and 'apidState' in nodeState and nodeState['apidState'] == 'open':
    ret[nodeState['ip']] = nodeState
    print('nodesList:: nodeState = %s' % nodeState)
  return ret

def is_port_open(host: str, port: int, timeout: float = 3.0) -> bool:
    sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    sock.settimeout(timeout)
    result = sock.connect_ex((host, port))  # возвращает 0 при успехе, иначе errno
    sock.close()
    return result == 0

def isMaintenance(ip):
  homedir = os.getenv('HOME')
  runCmd = 'talosctl get  discoveredvolume -o json -n %s -e %s -i' % (ip, ip)
  result = runShellCommand(runCmd, homedir)
  print('isMaintenance:: returncode=%s' % json.dumps(result.returncode))
  # print('isMaintenance:: stdout=%s' % json.dumps(result.stdout))
  if result.returncode != 0:
    return False
  result = json.loads('[' + result.stdout.replace("}\n{","},{") + ']')
  for volInfo in result:
    if 'partition_label' in volInfo['spec']:
      return False
  return True

def talosgetspec(clusterName, subcmd, node):
  homedir = os.getenv('HOME')
  maestroConfigDir =  '%s/.maestro' % homedir
  clusterConfigDir = '%s/%s' % (maestroConfigDir, clusterName)
  if clusterName == '_Unknown':
    return [ '-', -1, '']
  else:
    ret = '-'
    insecure = '-i' if clusterName == '_Orphans' else ''
    runCmd = 'talosctl get %s -e %s -n %s -o json %s' % (subcmd, node, node, insecure)
    result = runShellCommand(runCmd, clusterConfigDir)
    returncode = result.returncode
    if returncode == 0:
      jsonStr = result.stdout.strip()
      if len(jsonStr) != 0:
        jsonDict = json.loads(jsonStr)
        ret = jsonDict['spec']
    return [ret, returncode, result.stderr]

def initTalosconfig():
  homedir = os.getenv('HOME')
  maestroConfigDir =  '%s/.maestro' % homedir
  for virtualCluster in VIRTUALCLUSTERS:
    virtualClusterDir = '%s/%s' % (maestroConfigDir, virtualCluster)
    virtualClusterDirPath = Path(virtualClusterDir)
    if not virtualClusterDirPath.exists():
      os.mkdir(virtualClusterDir)
      talosconfigFile = '%s/talosconfig' % (virtualClusterDir)
      fp = open(talosconfigFile, 'w')
      emptyContent = '''context: %s
contexts:
  %s:
    endpoints: []
    nodes: []
''' % (virtualCluster, virtualCluster)
      fp.write(emptyContent)
      fp.close()
  maestroConfigDirPath = Path(maestroConfigDir)

# Загружает все talosconfig из подкаталогов .maestro
def loadTalosConfigs():
  homedir = os.getenv('HOME')
  maestroConfigDir =  '%s/.maestro' % homedir
  pathMaestroConfigDir = Path(maestroConfigDir)
  talosConfigs = {'context': '', 'contexts': {}}
  realClusterNames = []
  for maestroDir in pathMaestroConfigDir.iterdir():
    if maestroDir.is_dir():
      talosconfigFile = '%s/talosconfig' % maestroDir
      talosconfigFilePath = Path(talosconfigFile)
      if talosconfigFilePath.is_file():
        clusterName = maestroDir.name
        if clusterName not in VIRTUALCLUSTERS:
          realClusterNames.append(clusterName)
        fp = open(talosconfigFile, 'r')
        clusterTalosconfig = yaml.safe_load(fp)
        fp.close()
        talosConfigs['contexts'][clusterName] = clusterTalosconfig['contexts'][clusterName]
  return talosConfigs

def nodeClusterName(clusterNames, node):
  homedir = os.getenv('HOME')
  maestroConfigDir =  '%s/.maestro' % homedir
  for clusterName in clusterNames:
    clusterConfigDir = '%s/%s' % (maestroConfigDir, clusterName)
    runCmd = 'talosctl get info -e %s -n %s -o json' % (node, node)
    result = runShellCommand(runCmd, clusterConfigDir)
    returncode = result.returncode
    if returncode == 0:
      return clusterName
  if isMaintenance(node):
    return '_Orphans'
  return '_Unknown'

def refreshTalosconfigs():
  homedir = os.getenv('HOME')
  maestroConfigDir =  '%s/.maestro' % homedir
  print('refreshTalosconfig:: Before: maestroConfigDir=%s' % maestroConfigDir)
  # Загрузить все talosconfigs в один
  talosconfig = loadTalosConfigs()
  clustersNames=list(talosconfig['contexts'].keys())
  realClusterNames = []
  for clusterName in clustersNames:
    if clusterName not in VIRTUALCLUSTERS:
      realClusterNames.append(clusterName)
  realClusterNames.sort()
  print('refreshTalosconfig:: Before: talosconfig=%s' % json.dumps(talosconfig, indent=2))
  print('refreshTalosconfig:: realClusterNames=%s' % json.dumps(realClusterNames))
  newNodes = {'_Orphans': {'controlplanes': [], 'workers': []} , '_Unknown': {'controlplanes': [], 'workers': []} }
  changed = True
  nodeFileName = '%s/nodes.json' % maestroConfigDir
  nodes = {}
  if os.path.exists(nodeFileName):
    fp = open(nodeFileName, 'r')
    nodes = json.load(fp)
    fp.close()

  for ip in list(nodes.keys()):
    nodeStage = '';
    nodeInfo = {}
    nodeInfo['ip'] = ip
    if is_port_open(ip, 50000):
      toClusterName = nodeClusterName(realClusterNames, ip)
      if toClusterName not in newNodes:
        newNodes[toClusterName] = {}
      if 'controlplanes'not in newNodes[toClusterName]:
        newNodes[toClusterName]['controlplanes'] = []
      if 'workers'not in newNodes[toClusterName]:
        newNodes[toClusterName]['workers'] = []
      if clusterName != toClusterName:
        changed = True
      print('refreshTalosconfig:: ip=%s port 50000 open toClusterName=%s ' % (ip, toClusterName))
      if is_port_open(ip, 6443): # endpoint остается в endpoint
        kubeNodeType = 'controlplanes'
        # newNodes[toClusterName][].append(ip)
        print('refreshTalosconfig:: ip=%s port 6443 opened controlplane place in cluster toClusterName=%s ' % (ip, toClusterName))
      else: # node состояние
        kubeNodeType = 'workers'
        changed = True
        print('refreshTalosconfig:: ip=%s port 6443 closed controlplane place as WORKER in cluster toClusterName=%s ' % (ip, toClusterName))
    else: # endpoint в init режиме
      kubeNodeType = 'controlplanes'
      toClusterName = '_Orphans'
      nodeStage = 'unavialable or installing'
      print('refreshTalosconfig:: ip=%s ports  CLOSED (INIT?) controlplane remain in old cluster clusterName=%s ' % (ip, clusterName))
    if toClusterName in VIRTUALCLUSTERS:
      if isMaintenance(ip):
        nodeStage = 'maintenance'
      nodeInfo['stage'] = nodeStage if len(nodeStage) > 0 else '-'
    else:
      [spec, returncode, err] = talosgetspec(toClusterName, 'machinestatus', ip)
      if  len(spec) == 0:
        continue;
      nodeInfo['stage'] = spec['stage'] if 'stage' in spec else 'unavialable or installing'
      nodeInfo['status'] = spec['status'] if 'status' in spec else '-'
      [spec, returncode, err] = talosgetspec(toClusterName, 'nodestatus', ip)
      if returncode == 0 :
        nodeInfo['nodeReady'] = spec['nodeReady'] if 'nodeReady' in spec else '-'
        [spec, returncode, err] =talosgetspec(toClusterName, 'manifeststatus', ip)
        nodeInfo['manifestsApplied'] = spec['manifestsApplied'] if 'manifestsApplied' in spec else []
        [spec, returncode, err] =talosgetspec(toClusterName, 'etcdmember', ip)
        nodeInfo['memberID'] = spec['memberID'] if 'memberID' in spec else '-'
    newNodes[toClusterName][kubeNodeType].append(nodeInfo)

  print('refreshTalosconfig:: newNodes=%s' + json.dumps(newNodes, indent=2))

  # print('refreshTalosconfig:: newNodes=%s' % json.dumps(newNodes, indent=2))
  print('refreshTalosconfig:: changed=', changed)
  if changed:
    # Rewrite endpoints and nodes list in talosconfig
    print('refreshTalosconfig:: talosctl changed')
    for clusterName in newNodes:
      # runShellCommand('talosctl config context %s' % clusterName, homedir)
      for talosNodeType in list(TALOSNODETYPETOKUBE.keys()):
        kubeNodeType = TALOSNODETYPETOKUBE[talosNodeType]
        nodes = []
        if kubeNodeType in newNodes[clusterName]:
          print('refreshTalosconfig:: clusterName=%s kubeNodeType=%s node=%s' % (clusterName, kubeNodeType, json.dumps(newNodes[clusterName][kubeNodeType])))
          # nodes.append(newNodes[clusterName][kubeNodeType]['ip'])
          for node in newNodes[clusterName][kubeNodeType]:
            print('refreshTalosconfig:: node=%s' % json.dumps(node))
            nodes.append(node['ip'])
        taloscoconfigDir = '%s/%s' % (maestroConfigDir, clusterName)
        # runShellCommand("yq -yi '.contexts.%s.%s=%s' talosconfig" % (clusterName, talosNodeType,json.dumps(nodes)), taloscoconfigDir)
        if len(nodes) > 0:
          runShellCommand('talosctl config %s %s'  % \
            (talosNodeType[0:-1], ' '.join(nodes)), taloscoconfigDir)
        print('refreshTalosconfig:: clusterName=%s %s=%s:' % (clusterName, talosNodeType, json.dumps(nodes)))
  if len(newNodes['_Orphans']['workers']) > 0:
    newNodes['_Orphans']['controlplanes'] += newNodes['_Orphans']['workers']
    newNodes['_Orphans']['workers'] = []
  return newNodes
