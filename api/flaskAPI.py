#!/bin/python3
from flask import Flask, request, jsonify
from flask import send_file
import os
import json
from flask_cors import CORS
import yaml
# import time
import maestro

app = Flask(__name__)
# CORS(app, origins=["http://localhost:3000"])
CORS(app, origins=["*"])

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
      result = maestro.runShellCommand(runCmd, homedir)
    else:
      insecure = '-i'
      endpoint = '-e %s' % node
    # Передача результатов подкоманд команды get в формате JSON
    if cmd == 'get':
      commandSet = params_dict['commandSet']
      subCommand = params_dict['subCommand']
      # runCmd = 'talosctl get ' + subCommand + ' -o json -n ' + node
      runCmd = 'talosctl get  %s -o json -n %s %s %s' % (subCommand, node, endpoint, insecure)
      result = maestro.runShellCommand(runCmd, homedir)
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
      result = maestro.runShellCommand(runCmd, homedir)
      reply = maestro.tableToJson(result.stdout)
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
      result = maestro.runShellCommand(runCmd, homedir)
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
      result = maestro.runShellCommand(runCmd, homedir)
      reply = { 'content': result.stdout }
      return reply

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
      action0 = list(request_json[clusterName].keys())[0]
      ip0 = request_json[clusterName][action0][0]
      installDisk = maestro.getDiskName(ip0)
      os.mkdir(clusterConfigDir)
      print('MKDIR: %s' % clusterConfigDir)
      controlplane =  request_json[clusterName]['controlplane'][0]
      kubeEndpoint = 'https://%s:6443' % controlplane
      patch = '{"machine":{"kernel":{"modules":[{"name":"bridge"}]},"registries":{"config":{"registry.altlinux.org":{"tls":{"insecureSkipVerify":true}}}}}}'
      runCmd = "talosctl gen config %s %s --install-image altlinux.space/alt-orchestra/installer:v1.10.6 --config-patch '%s' --install-disk %s --output %s" % \
        (clusterName, kubeEndpoint, patch, installDisk, clusterName)
      result = maestro.runShellCommand(runCmd, homedir)
      runCmd = 'talosctl config merge %s/talosconfig' % clusterName
      result = maestro.runShellCommand(runCmd, homedir)
    runCmd = 'talosctl config context %s' % clusterName
    result = maestro.runShellCommand(runCmd, homedir)
    runCmd = 'talosctl config  info -o json'
    result = maestro.runShellCommand(runCmd, homedir)
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
        result = maestro.runShellCommand(runCmd, homedir)
      for ip in ips:
        # print("clusterName=%s action=%s ip=%s" % (clusterName, action, ip))
        if action == 'controlplane' or action == 'worker':
          installDisk = maestro.getDiskName(ip)
          patch = '{"machine":{"install":{"disk":"%s"}}}' % installDisk
          runCmd = "talosctl apply-config --config-patch '%s' --insecure -n %s --file %s/%s.yaml" % \
            (patch, ip, clusterName, action)
          result = maestro.runShellCommand(runCmd, homedir)
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
            result = maestro.runShellCommand(runCmd, homedir)
            emptyCluster = False
  return {}

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
  result = maestro.runShellCommand(runCmd, homedir)
  nmapOut = result.stdout
  nodes = maestro.nodesList(nmapOut.strip())
  print('NODES=', json.dumps(nodes, indent=4))
  maestro.initTalosconfig()
  nodesTree = {}
  for virtualCluster in ['_Orphans', '_Unknown']:
    nodesTree[virtualCluster] = {}
    for nodeType in [ 'endpoint', 'node']:
      nodesTree[virtualCluster][nodeType] = []

  for ip in nodes:
    maintenance = maestro.isMaintenance(ip)
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
      maestro.runShellCommand("yq -yi '.contexts.%s.%ss=%s' talosconfig" % (virtualCluster, nodeType, json.dumps(nodes)), homedir),

  return jsonify({
        "status": "success",
        "message": f"Successfully scanned"
    }), 200

@app.route('/nodesTree')
def nodesTree():
  homedir = os.getenv('HOME')
  configDir = homedir + '/.maestro'
  print('maestro.refreshTalosconfig:: Call')
  maestro.refreshTalosconfig()
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
        nodeTypesAlias = nodeTypesAliases[nodeType]
        if clusterName != '_Unknown' and clusterName != '_Orphans':
          [spec, returncode] = maestro.talosgetspec('machinestatus', node, insecure)
          if  len(spec) == 0:
            continue;
          nodeInfo['stage'] = spec['stage']
          nodeInfo['status'] = spec['status']
          [spec, returncode] = maestro.talosgetspec('nodestatus', node, insecure)
          if returncode == 0 :
            nodeInfo['nodeReady'] = spec['nodeReady'] if 'nodeReady' in spec else '-'
            [spec, returncode] = maestro.talosgetspec('manifeststatus', node, insecure)
            nodeInfo['manifestsApplied'] = spec['manifestsApplied'] if 'manifestsApplied' in spec else []
            [spec, returncode] = maestro.talosgetspec('etcdmember', node, insecure)
            nodeInfo['memberID'] = spec['memberID'] if 'memberID' in spec else '-'
        elif clusterName == '_Orphans':
          nodeInfo['stage'] = 'maintenance'
          nodeTypesAlias = 'controlplanes'
        nodesTree[clusterName][nodeTypesAlias].append(nodeInfo)
  print('nodesTree:: nodesTree=%s' % json.dumps(nodesTree, indent=2))
  return nodesTree

if __name__ == '__main__':
    app.run(host='127.0.0.1', port=5000, debug=False)
