#!/bin/python3
import yaml
import io
import os
import json
import subprocess

with open("RDTree.yaml", 'r') as stream:
    data = yaml.safe_load(stream)
# print(json.dumps(data, indent=2))

for commandSet in data:
  for commandName in data[commandSet]:
    # print('data=', json.dumps(data[commandSet]['commands']))
    commandInfos = data[commandSet]['commands']
    for commandInfo in commandInfos:
      outputs = {}
      command = commandInfo['command']
      path= 'plugin/maestro/src/' + commandSet + '/' + command
      print(path)
      for ip in ['192.168.122.33', '192.168.122.87']:
        result = subprocess.run(["talosctl", "get", "blockdevice", "--talosconfig", "/home/kaf/.talos/talosconfig", "-e", "192.168.122.33",  "-n", ip, "-o", "json"], capture_output=True, text=True)
        # print(result.stdout)
        Result = '[' + result.stdout.replace("}\n{","},{") + ']'
        # print(Result)
        print('IP=', ip)
        # exit(0)
        outputs[ip] = json.loads(Result)
      data = json.dumps(outputs, indent=2)
      # print(data)
      os.makedirs(path, exist_ok=True)
      file = path + '/data.json'
      fp = open(file, 'w')
      fp.write(data)
      fp.close()

      exit(0)
    # command = data[commandSet][commandName]['command']
    # print(commandSet+'/'+command)
