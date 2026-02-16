#!/bin/python3
from flask import Flask, request, jsonify
from flask import send_file
import os
import json
from flask_cors import CORS
import yaml
import maestro
from pathlib import Path

app = Flask(__name__)
# CORS(app, origins=["http://localhost:3000"])
CORS(app, origins=["*"])

@app.route('/talosctl')
def talosctl():
    homedir = os.getenv('HOME')
    maestroConfigDir =  '%s/.maestro' % homedir
    # Получение всех GET параметров
    all_params = request.args

    # Преобразование в обычный словарь
    params_dict = request.args.to_dict()
    print(all_params)
    clusterName = params_dict['cluster']
    taloscoconfigDir = '%s/%s' % (maestroConfigDir, clusterName)
    node = params_dict['n']
    cmd = params_dict['cmd']
    print('CMD="%s"'% cmd)
    endpoint = '-e %s' % node
    if clusterName[0] != '_':
      insecure = ''
      # runCmd = 'talosctl config context %s' % clusterName
      # print('setContext=', runCmd)
      # result = maestro.runShellCommand(runCmd, taloscoconfigDir)
    else:
      insecure = '-i'
    # Передача результатов подкоманд команды get в формате JSON
    if cmd == 'get':
      commandSet = params_dict['commandSet']
      subCommand = params_dict['subCommand']
      # runCmd = 'talosctl get ' + subCommand + ' -o json -n ' + node
      runCmd = 'talosctl get  %s -o json -n %s %s %s' % (subCommand, node, endpoint, insecure)
      result = maestro.runShellCommand(runCmd, taloscoconfigDir)
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
      result = maestro.runShellCommand(runCmd, taloscoconfigDir)
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
      result = maestro.runShellCommand(runCmd, taloscoconfigDir)
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
      result = maestro.runShellCommand(runCmd, taloscoconfigDir)
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
  # talosconfigFile = maestroConfigDir + '/talosconfig'
  # if not os.path.isfile(talosconfigFile):
  #   fp = open(talosconfigFile, 'w')
  #   fp.write("context:\ncontexts:\n")
  #   fp.close()
  for clusterName in request_json:
    taloscoconfigDir = '%s/%s' % (maestroConfigDir, clusterName)
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
      runCmd = "talosctl gen config %s %s --install-image altlinux.space/alt-orchestra/installer:v1.10.6 --config-patch '%s' --install-disk %s" % \
        (clusterName, kubeEndpoint, patch, installDisk)
      result = maestro.runShellCommand(runCmd, taloscoconfigDir)
      # runCmd = 'talosctl config merge %s/talosconfig' % clusterName
      # result = maestro.runShellCommand(runCmd, taloscoconfigDir)
    # runCmd = 'talosctl config context %s' % clusterName
    # result = maestro.runShellCommand(runCmd, taloscoconfigDir)
    runCmd = 'talosctl config  info -o json'
    result = maestro.runShellCommand(runCmd, taloscoconfigDir)
    config = json.loads(result.stdout)
    # emptyCluster = 'endpoints' not in config or len(config['endpoints']) == 0
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
        result = maestro.runShellCommand(runCmd, taloscoconfigDir)
      for ip in ips:
        # print("clusterName=%s action=%s ip=%s" % (clusterName, action, ip))
        if action == 'controlplane' or action == 'worker':
          installDisk = maestro.getDiskName(ip)
          patch = '{"machine":{"install":{"disk":"%s"}}}' % installDisk
          runCmd = "talosctl apply-config --config-patch '%s' --insecure -n %s --file %s.yaml" % \
            (patch, ip, action)
          result = maestro.runShellCommand(runCmd, taloscoconfigDir)
          bootstrapFile = '%s/bootstrap.log' % taloscoconfigDir
          if action == 'controlplane':
            if not Path(bootstrapFile).exists():
              runCmd = '%s/bootstrap.sh %s > %s  2>&1  &' % (maestroConfigDir, ip, bootstrapFile)
              result = maestro.runShellCommand(runCmd, taloscoconfigDir)
            # emptyCluster = False
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
  print('NODES1=', json.dumps(nodes, indent=2))
  nodes = {
    ip: info for ip, info in nodes.items()
    if info.get("apidState") == "open"
  }
  print('NODES2=', json.dumps(nodes, indent=2))
  nodeFileName = '%s/nodes.json' % maestroConfigDir
  fp = open(nodeFileName, 'w')
  fp.write(json.dumps(nodes, indent=2))
  fp.close()
  maestro.initTalosconfig()
  # maestro.setNodesInVirtualTaloscontrol(nodes, realClusterNames)
  return jsonify({
        "status": "success",
        "message": f"Successfully scanned"
    }), 200

@app.route('/nodesTree')
def nodesTree():
  homedir = os.getenv('HOME')
  configDir = homedir + '/.maestro'
  print('\n\n------------------------------------------')
  print('maestro.refreshTalosconfigs:: Call')
  for virtualCluster in maestro.VIRTUALCLUSTERS:
    virtualClusterDir = '%s/%s' % (configDir, virtualCluster)
    if not Path(virtualClusterDir).is_dir():
      maestro.initTalosconfig()
      break
  nodesTree = maestro.refreshTalosconfigs()
  print('nodesTree:: RESULT=%s' % json.dumps(nodesTree, indent=2))
  return nodesTree

if __name__ == '__main__':
    app.run(host='127.0.0.1', port=5000, debug=False)
