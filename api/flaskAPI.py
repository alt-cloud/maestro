#!/bin/python3
from flask import Flask, request, jsonify
from flask import send_file
import subprocess
import shlex
import os
import json
from flask_cors import CORS

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
      result = subprocess.run(runCmd,
        shell=True,
        stdout=subprocess.PIPE,
        cwd='%s/.maestro/' % homedir,
        encoding='utf-8'
      )
    else:
      insecure = '-i'
      endpoint = '-e %s' % node
    # Передача результатов подкоманд команды get в формате JSON
    if cmd == 'get':
      commandSet = params_dict['commandSet']
      subCommand = params_dict['subCommand']
      # runCmd = 'talosctl get ' + subCommand + ' -o json -n ' + node
      runCmd = 'talosctl get  %s -o json -n %s %s %s' % (subCommand, node, endpoint, insecure)
      print('runCmd=', runCmd)
      result = subprocess.run(runCmd,
        shell=True,
        stdout=subprocess.PIPE,
        cwd='%s/.maestro/' % homedir,
        encoding='utf-8'
      )
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
      print('runCmd=', runCmd)
      result = subprocess.run(runCmd,
        shell=True,
        stdout=subprocess.PIPE,
        cwd='%s/.maestro/' % homedir,
        encoding='utf-8'
      )
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
      # runCmd = 'talosctl support -O ' + SupportFile + ' -e ' + endpoint + ' -n ' + node
      runCmd = 'talosctl support -O %s -n %s %s %s' % (SupportFile,  node, endpoint, '')
      print('runCmd=', runCmd)
      result = subprocess.run(runCmd,
        shell=True,
        stdout=subprocess.PIPE,
        cwd='%s/.maestro/' % homedir,
        encoding='utf-8'
      )
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
      # runCmd = 'talosctl ' + cmd + ' -e ' + endpoint + ' -n ' + node
      runCmd = 'talosctl %s -n %s %s %s' % (cmd, node, endpoint, '')
      print('runCmd=', runCmd)
      result = subprocess.run(runCmd,
        shell=True,
        stdout=subprocess.PIPE,
        cwd='%s/.maestro/' % homedir,
        encoding='utf-8'
      )
      reply = { 'content': result.stdout }
      return reply
    # Добавление узда в кластер, изменение состояний узла

    # Неподдкживаемые команды
    return {
        'all_params': dict(all_params),
        'params_dict': params_dict
    }

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
      os.mkdir(clusterConfigDir)
      print('MKDIR: %s' % clusterConfigDir)
      controlplane =  request_json[clusterName]['controlplane'][0]
      kubeEndpoint = 'https://%s:6443' % controlplane
      runCmd = 'talosctl gen config %s %s --output %s' % (clusterName, kubeEndpoint, clusterName)
      print('runCmd=', runCmd)
      result = subprocess.run(runCmd,
        shell=True,
        stdout=subprocess.PIPE,
        cwd='%s/.maestro/' % homedir,
        encoding='utf-8'
      )
      runCmd = 'talosctl config merge %s/talosconfig' % clusterName
      print('runCmd=', runCmd)
      result = subprocess.run(runCmd,
        shell=True,
        stdout=subprocess.PIPE,
        cwd='%s/.maestro/' % homedir,
        encoding='utf-8'
      )
    runCmd = 'talosctl config context %s' % clusterName
    print('runCmd=', runCmd)
    result = subprocess.run(runCmd,
      shell=True,
      stdout=subprocess.PIPE,
      cwd='%s/.maestro/' % homedir,
      encoding='utf-8'
    )
    runCmd = 'talosctl config  info -o json'
    print('runCmd=', runCmd)
    result = subprocess.run(runCmd,
      shell=True,
      stdout=subprocess.PIPE,
      cwd='%s/.maestro/' % homedir,
      encoding='utf-8'
    )
    config = json.loads(result.stdout)
    for action in request_json[clusterName]:
      ips = request_json[clusterName][action]
      endpoints = list(set(config['endpoints']+ips))
      for nodeType in ['endpoint', 'node']:
        runCmd = 'talosctl config %s %s' % (nodeType, ' '.join(endpoints))
        print('runCmd=', runCmd)
        result = subprocess.run(runCmd,
          shell=True,
          stdout=subprocess.PIPE,
          cwd='%s/.maestro/' % homedir,
          encoding='utf-8'
        )
      for ip in ips:
        # print("clusterName=%s action=%s ip=%s" % (clusterName, action, ip))
        if action == 'controlplane' or action == 'worker':
          runCmd = 'talosctl apply-config --insecure -n %s --file %s/%s.yaml' % (ip, clusterName, action)
          print('runCmd=', runCmd)
          result = subprocess.run(runCmd,
            shell=True,
            stdout=subprocess.PIPE,
            cwd='%s/.maestro/' % homedir,
            encoding='utf-8'
          )
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
  print('runCmd=', runCmd)
  result = subprocess.run(runCmd,
    shell=True,
    stdout=subprocess.PIPE,
    cwd='%s/.maestro/' % homedir,
    encoding='utf-8'
  )
  nmapOut = result.stdout
  nodes = nodesList(nmapOut.strip())
  print('NODES=', json.dumps(nodes, indent=4))

  nodeTypes = {'controlplanes': [], 'workers': []}
  for ip in nodes:
    node = nodes[ip]
    if node['apidState'] == 'open':
      if node['kubeState'] == 'open':
        nodeTypes['controlplanes'].append(ip)
      else:
        nodeTypes['workers'].append(ip)
  print('nodeTypes=', nodeTypes)
  nodeTypesFile = maestroConfigDir + '/nodeTypes.json'
  fp = open(nodeTypesFile, 'w')
  json.dump(nodeTypes, fp, indent=2)
  fp.close()

  return jsonify({
        "status": "success",
        "message": f"Successfully scanned"
    }), 200

def talosgetspec(subcmd, node, insecure):
  homedir = os.getenv('HOME')
  runCmd = 'talosctl get %s -e %s -n %s -o json %s' % (subcmd, node, node, insecure)
  print('RUNCmd=', runCmd)
  result = subprocess.run(runCmd,
    shell=True,
    stdout=subprocess.PIPE,
    cwd='%s/.maestro/' % homedir,
    encoding='utf-8'
  )
  returncode = result.returncode
  ret = ''
  if returncode == 0:
    jsonStr = result.stdout.strip()
    if len(jsonStr) != 0:
      jsonDict = json.loads(jsonStr)
      ret = jsonDict['spec']
  return [ret, returncode]

@app.route('/nodesTree')
def nodesTree():
  homedir = os.getenv('HOME')
  configDir = homedir + '/.maestro'
  nodeTypesFile = configDir + '/nodeTypes.json'
  if not os.path.isfile(nodeTypesFile):
    return {}
  fp = open(nodeTypesFile, 'r')
  nodeTypes = json.load(fp)
  fp.close()
  # print('nodeTypes=', nodeTypes)

  nodesTree = {}
  for nodeType in ['controlplanes', 'workers']:
    for node in nodeTypes[nodeType]:
      print(nodeType, node)
      [spec, returncode] = talosgetspec('info', node, '')
      # print('clusterName=%s returncode=%d ' % (clusterName, returncode))
      print('spec=', spec)
      print('returncode=', returncode)
      if returncode != 0:
        clusterName = '_Orphans'
        insecure = '-i'
        [spec, returncode] = talosgetspec('info', node, insecure)
        print('returncode=', returncode)
        if returncode != 0:
          clusterName = '_Unknown'
      else:
        clusterName = spec['clusterName']
        insecure = ''
      if clusterName not in nodesTree:
        nodesTree[clusterName] = { 'controlplanes': [], 'workers': [] }
      nodeInfo = {}
      nodeInfo['ip'] = node
      # print('clusterName=%s' % clusterName)
      # print('SPEC=%s' % json.dumps(spec))
      # print('len(SPEC)=%d' % len(spec))
      # print("COND=",  clusterName != '_Unknown' and len(spec) > 2)
      if clusterName != '_Unknown' and len(spec) > 0:
        [spec, returncode] = talosgetspec('machinestatus', node, insecure)
        nodeInfo['stage'] = spec['stage']
        nodeInfo['status'] = spec['status']
        [spec, returncode] = talosgetspec('nodestatus', node, insecure)
        if returncode == 0 :
          nodeInfo['nodeReady'] = spec['nodeReady']
        if nodeType == 'controlplanes':
          [spec, returncode] = talosgetspec('manifeststatus', node, insecure)
          nodeInfo['manifestsApplied'] = spec['manifestsApplied']
          [spec, returncode] = talosgetspec('etcdmember', node, insecure)
          nodeInfo['memberID'] = spec['memberID']
        else:
          nodeInfo['manifestsApplied'] = []
          nodeInfo['memberID'] = '-'
      elif clusterName == '_Orphans':
        nodeInfo['stage'] = 'maintenance'
      nodesTree[clusterName][nodeType].append(nodeInfo)
  if '_Orphans' in nodesTree:
    nodesTree['_Orphans']['controlplanes'] = nodesTree['_Orphans']['workers']
    nodesTree['_Orphans']['workers'] = []
  return nodesTree

if __name__ == '__main__':
    app.run(host='127.0.0.1', port=5000, debug=False)
