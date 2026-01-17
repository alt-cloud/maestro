#!/bin/python3
#  Script copy

import yaml
import io
import os
import json
import subprocess
import shutil

with open("RDTree.yaml", 'r') as stream:
    data = yaml.safe_load(stream)
# print(json.dumps(data, indent=2))

# for commandSet in data:
#   for commandName in data[commandSet]:
#     # print('data=', json.dumps(data[commandSet]['commands']))
#     commandInfos = data[commandSet]['commands']
#     for commandInfo in commandInfos:
#       outputs = {}
#       command = commandInfo['command']
#       path= 'plugin/maestro/src/get/' + commandSet + '/' + command

for commandSetName in data:
  # print(json.dumps(data, indent=2))
  commandSet = data[commandSetName]
  CommandSetName = commandSet["name"].replace('-','_')
  # print(CommandSetName)
  for commandInfo in commandSet['commands']:
    commandName = commandInfo['name']
    command = commandInfo['command']
    path= 'plugin/maestro/src/get/' + CommandSetName + '/' + command
    print(path)
    os.makedirs(path, exist_ok=True)
    fromPage = path + '/../../Page.tsx'
    toPage = path + '/Page.tsx'
    shutil.copyfile(fromPage, toPage)
