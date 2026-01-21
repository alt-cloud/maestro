#!/bin/python3
#  Script copy

import yaml
import io
import os
import json
import subprocess
# import shutil
from pathlib import Path


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

pwd = os.environ['PWD']
for commandSetName in data:
  # print(json.dumps(data, indent=2))
  commandSet = data[commandSetName]
  CommandSetName = commandSet["name"].replace('-','_')
  # print(CommandSetName)
  for commandInfo in commandSet['commands']:
    commandName = commandInfo['name']
    command = commandInfo['command']
    path= pwd + '/plugin/maestro/src/node/get/' + CommandSetName + '/' + command
    print(path)
    # os.makedirs(path, exist_ok=True)
    os.chdir(path)
    fromPage = '../../Page.tsx'
    toPage = './Page.tsx'
    Path(toPage).unlink(missing_ok=True)
    # shutil.copyfile(fromPage, toPage)
    Path(toPage).symlink_to(fromPage)

