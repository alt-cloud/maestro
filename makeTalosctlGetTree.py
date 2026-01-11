#!/bin/python3
import yaml
import io
import os
import json
import subprocess
import shutil

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
      path= 'plugin/maestro/src/get/' + commandSet + '/' + command
      title = json.dumps({'title': 'talosctl get %s (command group %s)' % (command, commandSet)})
      print(path)
      columns = {'meta': [], 'spec': []}
      metaCols = []
      specCols = []
      for ip in ['192.168.122.33', '192.168.122.87']:
        result = subprocess.run(["talosctl", "get", command, "--talosconfig", "/home/kaf/.talos/talosconfig", "-e", "192.168.122.33",  "-n", ip, "-o", "json"], capture_output=True, text=True)
        # print(result.stdout)
        Result = '[' + result.stdout.replace("}\n{","},{") + ']'
        # print(Result)
        print('IP=', ip)
        # exit(0)
        output = json.loads(Result)
        for row in output:
          meta = row['metadata']
          spec = row['spec']
          if not isinstance(spec, dict):
            spec = {'spec': spec}
          metaCols = list(dict.fromkeys(metaCols + list(meta.keys())))
          specCols = list(dict.fromkeys(specCols + list(spec.keys())))
        outputs[ip] = output
      Columns = {'meta': metaCols, 'spec': specCols}
      Columns = json.dumps(Columns, indent=2)
      Data = json.dumps(outputs, indent=2)
      # print(Data)
      os.makedirs(path, exist_ok=True)
      fromPage = path + '/../../Page.tsx'
      toPage = path + '/Page.tsx'
      shutil.copyfile(fromPage, toPage)

      file = path + '/Head.json'
      fp = open(file, 'w')
      fp.write(title)
      fp.close()

      file = path + '/Data.json'
      fp = open(file, 'w')
      fp.write(Data)
      fp.close()

      file = path + '/Columns.json'
      fp = open(file, 'w')
      fp.write(Columns)
      fp.close()

      # exit(0)

