#!/bin/python3
from flask import Flask, request, jsonify
from flask import send_file
import subprocess
import shlex
import os
import json
from flask_cors import CORS
import socket
import time
import yaml
from pathlib import Path

app = Flask(__name__)
# CORS(app, origins=["http://localhost:3000"])
CORS(app, origins=["*"])

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

@app.route('/talosctl')
def talosctl():
    homedir = os.getenv('HOME')
    # Получение всех GET параметров
    all_params = request.args

    # Преобразование в обычный словарь
    params_dict = request.args.to_dict()
    print(all_params)
    clusterName = params_dict['cluster']
    node = params_dict['n']
    cmd = params_dict['cmd']
    print('CMD="%s"'% cmd)
    if clusterName[0] != '_':
      insecure = ''
      endpoint = ''
      runCmd = 'talosctl config context %s' % clusterName
      print('setContext=', runCmd)
      result = runShellCommand(runCmd, homedir)
    else:
      insecure = '-i'
      endpoint = '-e %s' % node
    # Передача результатов подкоманд команды get в формате JSON
    if cmd == 'get':
      commandSet = params_dict['commandSet']
      subCommand = params_dict['subCommand']
      # runCmd = 'talosctl get ' + subCommand + ' -o json -n ' + node
      runCmd = 'talosctl get  %s -o json -n %s %s %s' % (subCommand, node, endpoint, insecure)
      result = runShellCommand(runCmd, homedir)
      result = json.loads('[' + result.stdout.replace("}\n{","},{") + ']')
      if len(result) > 0 and isinstance(result[0]['spec'], str):
        for index, row in enumerate(result):
          spec = {}
          spec['spec'] = row['spec']
          result[index]['spec'] = spec
      reply = json.dumps(result, indent=2)
      return reply

    if clusterName[0] == '_':
      return []
    # Передача результатов в формате текстовой таблицы
    if cmd == 'containers' or \
        cmd == 'netstat' or \
        cmd == 'memory' or \
        cmd == 'mounts' or \
        cmd == 'service' or \
        cmd == 'stats' or \
        cmd == 'time' or \
        cmd == 'usage' or \
        cmd == 'processes' or \
        cmd[0:5] == 'etcd/' or \
        cmd[0:6] == 'image/' \
        :
      cmd = cmd.replace('/', ' ')
      # runCmd = 'talosctl ' + cmd + ' -n ' + node
      runCmd = 'talosctl %s -n %s %s %s' % (cmd, node, endpoint, '')
      result = runShellCommand(runCmd, homedir)
      reply = tableToJson(result.stdout)
      return reply
    # Передача результата команды support - zip-архив
    elif cmd == 'support':
      tmpDir = '/tmp/talossupport_%d' % os.getpid()
      if not os.path.isdir(tmpDir):
        os.mkdir(tmpDir)
      supportFile = 'support_' + node.replace('.', '_') + '.zip'
      SupportFile = tmpDir + '/' + supportFile
      if os.path.exists(SupportFile):
        os.remove(SupportFile)
      runCmd = 'talosctl support -O %s -n %s %s %s' % (SupportFile,  node, endpoint, '')
      result = runShellCommand(runCmd, homedir)
      return send_file(
          SupportFile,
          mimetype='application/zip',
          as_attachment=True,
          download_name=supportFile
          )
    # Передача результатов в свободном текстовом формате
    elif cmd == 'dmesg' or \
        cmd[0:5] == 'logs/' or \
        cmd[0:8] ==  'inspect/' or \
        cmd == 'version' \
          :
      cmd = cmd.replace('/', ' ')
      runCmd = 'talosctl %s -n %s %s %s' % (cmd, node, endpoint, '')
      result = runShellCommand(runCmd, homedir)
      reply = { 'content': result.stdout }
      return reply
    # Добавление узда в кластер, изменение состояний узла

    # Неподдкживаемые команды
    return {
        'all_params': dict(all_params),
        'params_dict': params_dict
    }

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

@app.route('/apply', methods=['GET', 'POST'])
def apply():
  homedir = os.getenv('HOME')
  print('REQUEST=%s' % request.method);
  request_json = request.get_json()
  print('JSON=', request_json);
  maestroConfigDir =  os.getenv('HOME') + '/.maestro'
  talosconfigFile = maestroConfigDir + '/talosconfig'
  if not os.path.isfile(talosconfigFile):
    fp = open(talosconfigFile, 'w')
    fp.write("context:\ncontexts:\n")
    fp.close()
  for clusterName in request_json:
    # print("clusterName=%s" % clusterName)
    clusterConfigDir = '%s/%s' %( maestroConfigDir, clusterName)
    if not os.path.isdir(clusterConfigDir):
      action0 = list(request_json[clusterName].keys())[0]
      ip0 = request_json[clusterName][action0][0]
      installDisk = getDiskName(ip0)
      os.mkdir(clusterConfigDir)
      print('MKDIR: %s' % clusterConfigDir)
      controlplane =  request_json[clusterName]['controlplane'][0]
      kubeEndpoint = 'https://%s:6443' % controlplane
      patch = '{"machine":{"kernel":{"modules":[{"name":"bridge"}]},"registries":{"config":{"registry.altlinux.org":{"tls":{"insecureSkipVerify":true}}}}}}'
      runCmd = "talosctl gen config %s %s --install-image altlinux.space/alt-orchestra/installer:v1.10.6 --config-patch '%s' --install-disk %s --output %s" % \
        (clusterName, kubeEndpoint, patch, installDisk, clusterName)
      result = runShellCommand(runCmd, homedir)
      runCmd = 'talosctl config merge %s/talosconfig' % clusterName
      result = runShellCommand(runCmd, homedir)
    runCmd = 'talosctl config context %s' % clusterName
    result = runShellCommand(runCmd, homedir)
    runCmd = 'talosctl config  info -o json'
    result = runShellCommand(runCmd, homedir)
    config = json.loads(result.stdout)
    emptyCluster = 'endpoints' not in config or len(config['endpoints']) == 0
    # print('request_json=%s' % json.dumps(request_json) )
    for action in request_json[clusterName]:
      ips = request_json[clusterName][action]
      # endpoints = list(set(config['endpoints']+ips))
      if action == 'controlplane' or action == 'worker':
        addPoints = {}
        addPoints['controlplane'] = request_json[clusterName]['controlplane'] if 'controlplane' in request_json[clusterName] else []
        addPoints['worker'] = request_json[clusterName]['worker'] if 'worker' in request_json[clusterName] else []
        addPoints['worker'] = addPoints['worker'] + addPoints['controlplane']
        nodeType = 'endpoint' if action == 'controlplane' else 'node'
        fieldName = '%ss' % nodeType
        # print('fieldName=', fieldName)
        # print('config=', json.dumps(config, indent=2))
        points = config[fieldName] if fieldName in config and config[fieldName] else []
        addPoints = addPoints[action]
        # print('Before: points=%s' % json.dumps(points))
        # print('Before: addPoints=%s' % json.dumps(addPoints))
        points = list(set(points + addPoints))
        # print('After: points=%s' % json.dumps(points))
        runCmd = 'talosctl config %s %s' % (nodeType, ' '.join(points))
        result = runShellCommand(runCmd, homedir)
      for ip in ips:
        # print("clusterName=%s action=%s ip=%s" % (clusterName, action, ip))
        if action == 'controlplane' or action == 'worker':
          installDisk = getDiskName(ip)
          patch = '{"machine":{"install":{"disk":"%s"}}}' % installDisk
          runCmd = "talosctl apply-config --config-patch '%s' --insecure -n %s --file %s/%s.yaml" % \
            (patch, ip, clusterName, action)
          result = runShellCommand(runCmd, homedir)
          if emptyCluster and action == 'controlplane':
            runCmd = '''
            ( \
            set -x; \
            sleep 5;\
            until nmap %s/32 -p 50000 | grep open; do sleep 5; done;\
            while talosctl bootstrap -e %s -n %s; do sleep 5; done;\
            until talosctl health -e %s -n %s; do sleep 5; done;\
            talosctl -e %s -n %s kubeconfig -f;
            ) > %s/.maestro/%s/bootstrap_%s.log 2>&1  &
            ''' % (ip, ip, ip, ip, ip, ip, ip, homedir, clusterName, ip)
            result = runShellCommand(runCmd, homedir)
            emptyCluster = False
  return {}


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

@app.route('/scanNets',methods=['GET', 'POST'])
def scanNets():
  homedir = os.getenv('HOME')
  print('REQUEST=', request.method);
  maestroConfigDir =  os.getenv('HOME') + '/.maestro'
  scanNetsFile = maestroConfigDir + '/scanNets.json'
  if not os.path.isfile(scanNetsFile):
    fp = open(scanNetsFile, 'w')
    json.dump({'scanNets': []}, fp, indent=2)
    fp.close()
  if request.method == 'GET':
    fp = open(scanNetsFile, 'r')
    scanNets = json.load(fp)
    reply = json.dumps(scanNets, indent=2)
    print ('scanNets=%s' % reply)
    fp.close()
    return reply
  # POST
  print('JSON=', request.get_json());
  scanNets = request.get_json()
  fp = open(scanNetsFile, 'w')
  json.dump(scanNets, fp, indent=2)
  fp.close()
  runCmd = 'nmap  -p 50000,6443 ' + ' '.join(scanNets['scanNets'])
  result = runShellCommand(runCmd, homedir)
  nmapOut = result.stdout
  nodes = nodesList(nmapOut.strip())
  print('NODES=', json.dumps(nodes, indent=4))

  initTalosconfig()

  nodesTree = {}
  for virtualCluster in ['_Orphans', '_Unknown']:
    nodesTree[virtualCluster] = {}
    for nodeType in [ 'endpoint', 'node']:
      nodesTree[virtualCluster][nodeType] = []

  for ip in nodes:
    maintenance = isMaintenance(ip)
    node = nodes[ip]
    if node['apidState'] == 'open':
      if node['kubeState'] == 'open':
        # nodeTypes['controlplanes'].append(ip)
        nodesTree['_Unknown']['endpoint'].append(ip)
      else:
        if maintenance:
          nodesTree['_Orphans']['node'].append(ip)
        else:
          nodesTree['_Unknown']['node'].append(ip)
        # nodeTypes['workers'].append(ip)
  print('nodesTree=', json.dumps(nodesTree, indent=4))
  for virtualCluster in ['_Orphans', '_Unknown']:
    for nodeType in [ 'endpoint', 'node']:
      nodes = nodesTree[virtualCluster][nodeType]
      runShellCommand("yq -yi '.contexts.%s.%ss=%s' talosconfig" % (virtualCluster, nodeType, json.dumps(nodes)), homedir),
  # refreshTalosconfig()

  return jsonify({
        "status": "success",
        "message": f"Successfully scanned"
    }), 200

@app.route('/nodesTree')
def nodesTree():
  homedir = os.getenv('HOME')
  configDir = homedir + '/.maestro'
  print('refreshTalosconfig:: Call')
  refreshTalosconfig()
  nodesTree = {}
  print('nodesTree:: configDir=%s' % configDir)
  talosconfigFile = '%s/talosconfig' % configDir
  fp = open(talosconfigFile, 'r')
  talosconfig = yaml.safe_load(fp)
  fp.close()
  print('nodesTree:: talosconfig=%s' % json.dumps(talosconfig, indent=2))
  nodeTypesAliases = {'endpoints': 'controlplanes', 'nodes': 'workers'}
  for clusterName in talosconfig['contexts']:
    nodesTree[clusterName] = { 'controlplanes': [], 'workers': [] }
    print('nodesTree:: clusterName=%s' % clusterName)
    for nodeType in ['endpoints', 'nodes']:
      nodes = talosconfig['contexts'][clusterName][nodeType] if nodeType in talosconfig['contexts'][clusterName] else []
      print('nodesTree:: nodeType=%s nodes=%s' % (clusterName, json.dumps(nodes)))
      for node in nodes:
        nodeInfo = {}
        nodeInfo['ip'] = node
        insecure = '-i' if clusterName == '_Orphans' else ''
        # [spec, returncode] = talosgetspec('info', node, '')
        # print('clusterName=%s returncode=%d spec=%s' % (clusterName, returncode, json.dumps(spec)))
        # if returncode != 0:
        #   clusterName = '_Orphans'
        #   insecure = '-i'
        #   if not isMaintenance(node):
        #     clusterName = '_Unknown'
        # else:
        #   clusterName = spec['clusterName']
        #   insecure = ''
        nodeTypesAlias = nodeTypesAliases[nodeType]
        if clusterName != '_Unknown' and clusterName != '_Orphans':
          [spec, returncode] = talosgetspec('machinestatus', node, insecure)
          if  len(spec) == 0:
            continue;
          nodeInfo['stage'] = spec['stage']
          nodeInfo['status'] = spec['status']
          [spec, returncode] = talosgetspec('nodestatus', node, insecure)
          if returncode == 0 :
            nodeInfo['nodeReady'] = spec['nodeReady'] if 'nodeReady' in spec else '-'
            [spec, returncode] = talosgetspec('manifeststatus', node, insecure)
            nodeInfo['manifestsApplied'] = spec['manifestsApplied'] if 'manifestsApplied' in spec else []
            [spec, returncode] = talosgetspec('etcdmember', node, insecure)
            nodeInfo['memberID'] = spec['memberID'] if 'memberID' in spec else '-'
        elif clusterName == '_Orphans':
          nodeInfo['stage'] = 'maintenance'
          nodeTypesAlias = 'controlplanes'
        nodesTree[clusterName][nodeTypesAlias].append(nodeInfo)
  print('nodesTree:: nodesTree=%s' % json.dumps(nodesTree, indent=2))
  return nodesTree

if __name__ == '__main__':
    app.run(host='127.0.0.1', port=5000, debug=False)
