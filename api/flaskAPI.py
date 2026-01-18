#!/bin/python3
from flask import Flask, request, jsonify
import subprocess
import shlex
import os
import json
from flask_cors import CORS

app = Flask(__name__)
# CORS(app, origins=["http://localhost:3000"])
CORS(app, origins=["*"])

@app.route('/talosctl')
def talosctl():
    # Получение всех GET параметров
    all_params = request.args

    # Преобразование в обычный словарь
    params_dict = request.args.to_dict()
    endpoint = params_dict['e']
    node = params_dict['n']
    cmd = params_dict['cmd']
    # print('CMD=', cmd)
    if cmd == 'get':
      commandSet = params_dict['commandSet']
      subCommand = params_dict['subCommand']
      runCmd = 'talosctl get ' + subCommand + ' -o json -e ' + endpoint + ' -n ' + node
      # print('runCmd=', runCmd)
      result = subprocess.run(runCmd,
        shell=True,
        stdout=subprocess.PIPE,
        cwd='/home/kaf/.talos/',
        encoding='utf-8'
      )
    Result = json.loads('[' + result.stdout.replace("}\n{","},{") + ']')
    reply = json.dumps(Result, indent=2)
    fp = open("/tmp/reply.json", 'w')
    fp.write(reply)
    fp.close()
    return reply

    return {
        'all_params': dict(all_params),
        'params_dict': params_dict
    }



# Запрос сканирует командой nmap сети, указанные параметром nets, определеяет список IP адресов узлов (с DNS именамиб если они имеются),
# которые слушают порты 50000 (сервис apid) и 6443 (kubeAPI).
#
# После определения списка узлов командой
# talosctl config contexts
# из файла /root/.talos/talosconfig загруэаются
# - список поддерживаемых кластеров contexts[<clusterName>]
# - имя текущего активного кластер contaxt
#
# Проаеряется наличие узлов, полученных командой nmap в списке кластеров
# Если узел не входит ни в один из кластеров, он добавляется в кластер NULL
# с IP-адресом или DNS именем в элемент nodes и если узел просушиавает порт 6443 в элемент endpoints
#
# Полученный  спсиок кластеров возвращается в ответ на запрос в формате
# [
#   {currentContext: boolean, clusterName: string, controlplanes: [...], workers: [...]},
#   ...
# ]
@app.route('/map')
def map():
  ret='''
[
  {
    "id": "Maestro",
    "currentContext": "*",
    "clusterName": "Maestro",
    "controlplanes": [
      "192.168.122.33"
    ],
    "workers": [
      "192.168.122.33",
      "192.168.122.87"
    ]
  },
  {
    "id": "Cluster1",
    "currentContext": "",
    "clusterName": "Cluster1",
    "controlplanes": [],
    "workers": []
  },
  {
    "id": "NULL",
    "currentContext": "",
    "clusterName": "NULL",
    "controlplanes": [],
    "workers": [
      "192.168.122.127"
    ]
  }
]
'''
  return ret

  nets = request.args['nets']
  # Запросить список узлов сети nets слушающих порт 50000 (сервис apid) и 6443 (kubeAPI)
  nmapOut = subprocess.run(['nmap', '-p 50000,6443',  nets], capture_output=True, text=True, check=True)
  # Проанализировать вывод команды nmap и сформировать список узлов
  nodes = nodesTree(nmapOut.stdout.strip())
  print('NODES=', json.dumps(nodes, indent=4))
  # Запросить список поддерживаемых кластеров
  talosctlOut = subprocess.run([
    'talosctl',
    'config',
    'contexts'
    ],
    capture_output=True,
    text=True,
    check=True
  )
  # Проанализировать вывод команды talosctl и сформировать дерево поддерживаемых кластеров
  configs = configTree(talosctlOut.stdout.strip())
  print('CONFIGS=', json.dumps(configs, indent=4))
  # Переформатировать дерево описания кластеров к требуемому виду
  fullConfigs = addLostNodesToConfigTree(configs, nodes)
  ret = getListClusters(fullConfigs)
  return ret

# Функция анализирует вывод команды nmap и определеяет список IP адресов узлов (с DNS именамиб если они имеются),
# которые слушают порты 50000 (сервис apid) и 6443 (kubeAPI).
# Функция возвращает список узорв в формате
# {
#   <IP>: {'dns': '' or dnsName', 'ip: <IP>, 'kubeState': <open, closed, ...>, 'apidState': <open, closed, ...>},
#   ...
# }
def nodesTree(nmapStr):
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

# Функция аналихирует вывод команды
# talosctl config contexts
# и возвращает результат формата
# {
# "context": <имя_текущего_кластера0>,
# "contexts": {
#   <Имя_кластера>:{"endpoints": [...], "nodes": [...]},
#   ...
#  }
def configTree(talosctStr):
  configTreeStrs = talosctStr.split('\n')
  ret = {'context': '', 'contexts': {}}
  for line in configTreeStrs[1:]:
    clusterCols = line.split()
    print(clusterCols)
    if clusterCols[0] == '*':
      ret['context'] = clusterCols[1]
      clusterCols = clusterCols[1:]
    clusterName = clusterCols[0]
    clusterState = {}
    if len(clusterCols) == 3:
      clusterState['endpoints'] = clusterCols[1].split(',')
      clusterState['nodes'] = clusterCols[2].split(',')
    ret['contexts'][clusterName] = clusterState
  return ret

# Функции передается результат функции configTree и описание node в формате
# {'dns': '' or dnsName', 'ip: <IP>, 'kubeState': <open, closed, ...>, 'apidState': <open, closed, ...>}
# Если dns или ip присутствуют в одном из кластеров возвращается его имя
# Если отсутствует - возвращается пустая строка
def nodeClusterName(configs, node):
  dns = node['dns']
  ip = node['ip']
  for clusterName in configs['contexts']:
    clusterInfo = configs['contexts'][clusterName]
    if 'endpoints' in clusterInfo:
      for endpoint in clusterInfo['endpoints']:
        if endpoint == dns or endpoint == ip:
          return clusterName
    if 'nodes' in clusterInfo:
      for nodepoint in clusterInfo['nodes']:
        if nodepoint == dns or nodepoint == ip:
          return clusterName
  return ''

# Функции передается результат функции configTree (configs) и результат функции nodesTree (nodes)
# Узлы (nodes), отсутствующие в configTree добавляются в виртуальный кластер NULL
def addLostNodesToConfigTree(configs, nodes):
  ret = configs
  unknownClusterName= 'NULL'
  for ip in nodes:
    node = nodes[ip]
    nameName = node['dns'] if len(node['dns']) > 0  else node['ip']
    clusterName = nodeClusterName(configs, node)
    if clusterName == '':
      ret['contexts'][unknownClusterName] = {'endpoints': [], 'nodes': []}
      if node['kubeState'] == 'open':
        ret['contexts'][unknownClusterName]['endpoints'].append(nameName)
      if node['apidState'] == 'open':
      # if node['apidState'] == 'open' or True:
        ret['contexts'][unknownClusterName]['nodes'].append(nameName)
  return ret

#  Функции передается результат функции addLostNodesToConfigTree
#  Функция фозвращает результат в формате
# [
#   {currentContext: boolean, clusterName: string, controlplanes: [...], workers: [...]},
#   ...
# ]
def getListClusters(configs):
  ret = []
  context = configs['context']
  for clusterName in configs['contexts']:
    retRow = {}
    clusterInfo = configs['contexts'][clusterName]
    retRow['currentContext'] = ( clusterName == context)
    retRow['clusterName'] = clusterName
    retRow['id'] = clusterName
    endpoints = clusterInfo['endpoints'] if 'endpoints' in clusterInfo else []
    retRow['controlplanes'] = endpoints
    nodes = clusterInfo['nodes'] if 'nodes' in clusterInfo else []
    workers = []
    for node in nodes:
      if node not in endpoints:
        workers.append(node)
    retRow['workers'] = workers
    ret.append(retRow)
  return ret

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=False)
