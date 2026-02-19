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
  runCmd = f'clusterDir={clusterDir} TALOSCONFIG=talosconfig {runCmd}'
  print(f'runShellCommand={runCmd}')
  result = subprocess.run(runCmd,
    shell=True,
    stdout=subprocess.PIPE,
    stderr=subprocess.PIPE,
    cwd=clusterDir,
    encoding='utf-8'
  )
  return result

# Converts talosctl table output to JSON.
# Field names and column offsets are inferred from the first header line.
# Field names are normalized: first letter uppercase, remaining letters lowercase.
# Headers with one inner space (for example, LOCAL ADDRESS) are supported.
# In that case, one merged header named LocalAddress is created.
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
    shift = start
  shifts[columnName]['end'] = -1
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
  runCmd = f'talosctl get  discoveredvolume -o json -n {ip} -e {ip} -i'
  result = runShellCommand(runCmd, homedir)

  if result.returncode != 0:
    err = result.stderr.strip() or result.stdout.strip() or 'talosctl discoveredvolume command failed'
    raise RuntimeError(f'Failed to detect install disk for node {ip}: {err}')

  raw_output = (result.stdout or '').strip()
  if not raw_output:
    raise RuntimeError(f'Failed to detect install disk for node {ip}: empty talosctl output')

  try:
    volumes = json.loads('[' + raw_output.replace("}\n{", "},{") + ']')
  except json.JSONDecodeError as err:
    raise RuntimeError(f'Failed to parse discovered volumes for node {ip}: {err}') from err

  for volInfo in volumes:
    metadata = volInfo.get('metadata', {})
    spec = volInfo.get('spec', {})
    disk_id = metadata.get('id', '')
    if disk_id.startswith('loop') or disk_id.startswith('sr'):
      continue
    disk = spec.get('dev_path')
    if disk:
      return disk

  raise RuntimeError(f'Failed to detect install disk for node {ip}: no suitable disk found')

# Parses nmap output and builds a list of node IP addresses
# (with DNS names when available) that expose ports 50000 (apid) and 6443 (kubeAPI).
# Returns nodes in the following format:
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
    print(f'nodesList:: nodeState = {nodeState}')
  return ret

def is_port_open(host: str, port: int, timeout: float = 3.0) -> bool:
    sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    sock.settimeout(timeout)
    result = sock.connect_ex((host, port))  # returns 0 on success, otherwise errno
    sock.close()
    return result == 0

def isMaintenance(ip):
  homedir = os.getenv('HOME')
  runCmd = f'talosctl get  discoveredvolume -o json -n {ip} -e {ip} -i'
  result = runShellCommand(runCmd, homedir)
  print(f'isMaintenance:: returncode={json.dumps(result.returncode)}')
  if result.returncode != 0:
    return False
  result = json.loads('[' + result.stdout.replace("}\n{","},{") + ']')
  for volInfo in result:
    if 'partition_label' in volInfo['spec']:
      return False
  return True

def talosgetspec(clusterName, subcmd, node):
  homedir = os.getenv('HOME')
  maestroConfigDir =  f'{homedir}/.maestro'
  clusterConfigDir = f'{maestroConfigDir}/{clusterName}'
  if clusterName == '_Unknown':
    return [ '-', -1, '']
  else:
    ret = '-'
    insecure = '-i' if clusterName == '_Orphans' else ''
    runCmd = f'talosctl get {subcmd} -e {node} -n {node} -o json {insecure}'
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
  maestroConfigDir =  f'{homedir}/.maestro'
  for virtualCluster in VIRTUALCLUSTERS:
    virtualClusterDir = f'{maestroConfigDir}/{virtualCluster}'
    virtualClusterDirPath = Path(virtualClusterDir)
    if not virtualClusterDirPath.exists():
      os.mkdir(virtualClusterDir)
      talosconfigFile = f'{virtualClusterDir}/talosconfig'
      fp = open(talosconfigFile, 'w')
      emptyContent = f'''context: {virtualCluster}
contexts:
  {virtualCluster}:
    endpoints: []
    nodes: []
'''
      fp.write(emptyContent)
      fp.close()
  maestroConfigDirPath = Path(maestroConfigDir)

# Loads all talosconfig files from subdirectories in .maestro.
def loadTalosConfigs():
  homedir = os.getenv('HOME')
  maestroConfigDir =  f'{homedir}/.maestro'
  pathMaestroConfigDir = Path(maestroConfigDir)
  talosConfigs = {'context': '', 'contexts': {}}
  realClusterNames = []
  for maestroDir in pathMaestroConfigDir.iterdir():
    if maestroDir.is_dir():
      talosconfigFile = f'{maestroDir}/talosconfig'
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
  maestroConfigDir =  f'{homedir}/.maestro'
  for clusterName in clusterNames:
    clusterConfigDir = f'{maestroConfigDir}/{clusterName}'
    runCmd = f'talosctl get info -e {node} -n {node} -o json'
    result = runShellCommand(runCmd, clusterConfigDir)
    returncode = result.returncode
    if returncode == 0:
      return clusterName
  if isMaintenance(node):
    return '_Orphans'
  return '_Unknown'

def refreshTalosconfigs():
  homedir = os.getenv('HOME')
  maestroConfigDir =  f'{homedir}/.maestro'
  print(f'refreshTalosconfig:: Before: maestroConfigDir={maestroConfigDir}')
  # Load all talosconfigs into one structure.
  talosconfig = loadTalosConfigs()
  clustersNames=list(talosconfig['contexts'].keys())
  realClusterNames = []
  for clusterName in clustersNames:
    if clusterName not in VIRTUALCLUSTERS:
      realClusterNames.append(clusterName)
  realClusterNames.sort()
  print(f'refreshTalosconfig:: Before: talosconfig={json.dumps(talosconfig, indent=2)}')
  print(f'refreshTalosconfig:: realClusterNames={json.dumps(realClusterNames)}')
  newNodes = {'_Orphans': {'controlplanes': [], 'workers': []} , '_Unknown': {'controlplanes': [], 'workers': []} }
  changed = True
  nodeFileName = f'{maestroConfigDir}/nodes.json'
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
      print(f'refreshTalosconfig:: ip={ip} port 50000 open toClusterName={toClusterName} ')
      if is_port_open(ip, 6443): # endpoint remains a controlplane endpoint
        kubeNodeType = 'controlplanes'
        print(f'refreshTalosconfig:: ip={ip} port 6443 opened controlplane place in cluster toClusterName={toClusterName} ')
      else: # node state
        kubeNodeType = 'workers'
        changed = True
        print(f'refreshTalosconfig:: ip={ip} port 6443 closed controlplane place as WORKER in cluster toClusterName={toClusterName} ')
    else: # endpoint in initialization state
      kubeNodeType = 'controlplanes'
      toClusterName = '_Orphans'
      nodeStage = 'unavialable or installing'
      print(f'refreshTalosconfig:: ip={ip} ports  CLOSED (INIT?) controlplane remain in old cluster clusterName={clusterName} ')
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

  print(f'refreshTalosconfig:: newNodes={json.dumps(newNodes, indent=2)}')

  print('refreshTalosconfig:: changed=', changed)
  if changed:
    # Rewrite endpoints and nodes list in talosconfig
    print('refreshTalosconfig:: talosctl changed')
    for clusterName in newNodes:
      for talosNodeType in list(TALOSNODETYPETOKUBE.keys()):
        kubeNodeType = TALOSNODETYPETOKUBE[talosNodeType]
        nodes = []
        if kubeNodeType in newNodes[clusterName]:
          print(f'refreshTalosconfig:: clusterName={clusterName} kubeNodeType={kubeNodeType} node={json.dumps(newNodes[clusterName][kubeNodeType])}')
          for node in newNodes[clusterName][kubeNodeType]:
            print(f'refreshTalosconfig:: node={json.dumps(node)}')
            nodes.append(node['ip'])
        taloscoconfigDir = f'{maestroConfigDir}/{clusterName}'
        if len(nodes) > 0:
          runShellCommand(
            f"talosctl config {talosNodeType[0:-1]} {' '.join(nodes)}",
            taloscoconfigDir
          )
        print(f'refreshTalosconfig:: clusterName={clusterName} {talosNodeType}={json.dumps(nodes)}:')
  if len(newNodes['_Orphans']['workers']) > 0:
    newNodes['_Orphans']['controlplanes'] += newNodes['_Orphans']['workers']
    newNodes['_Orphans']['workers'] = []
  return newNodes
