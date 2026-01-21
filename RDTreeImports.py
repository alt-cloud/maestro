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

registerRouteTemplate = '''registerRoute({
  path: '/maestro/node/get/%s/%s',
  useClusterURL: false,
  noAuthRequired: true,
  name: 'maestro_get_%s_%s',
  exact: true,
  component: () => (<GetPage/>)
});
'''
  # sidebar: {item: 'maestro', sidebar: 'myplugin'},

for commandSetName in data:
  # print(json.dumps(data, indent=2))
  commandSet = data[commandSetName]
  CommandSetName = commandSet["name"].replace('-','_')
  # print(CommandSetName)
  for commandInfo in commandSet['commands']:
    commandName = commandInfo['name']
    commandName_ = commandName.replace('-','_')
    # print("\t%s" % commandName)
    # importName = "Get" + CommandSetName.title() + commandName_.title()
    # print("import %s from './node/get/%s/%s/Page';" % (importName, CommandSetName, commandName))
    print(registerRouteTemplate % (CommandSetName, commandName, CommandSetName, commandName))

