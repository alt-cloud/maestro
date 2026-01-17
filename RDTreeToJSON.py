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

jsonFile = './plugin/maestro/src/get/RDTree.json'
fp = open(jsonFile, 'w')
json.dump(data, fp,  indent=2)

