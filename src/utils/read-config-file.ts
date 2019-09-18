// @flow
import fs from 'fs-extra'
import yaml from 'js-yaml'

import {
  configFileMissingError,
  configFileDuplicatesError,
} from './errors'

interface File {|
  contents: {
    properties: {
      runtimeEnvironment: mixed,
    },
    // eslint-disable-next-line flowtype/no-mutable-array
    required: Array<string>,
    sops: mixed,
  },
  fileType: 'json' | 'yaml' | 'yml',
  path: string,
|}

export const readConfigFile = (filename: string): File => {
  const pathToTry = `${process.cwd()}/config/${filename}`
  const possibleConfigFiles: {|
    json: mixed,
    yaml: mixed,
    yml: mixed,
  |} = {
    // $FlowIgnore because fs-extra doesn't have the synchronous methods typed
    json: fs.existsSync(`${pathToTry}.json`),
    // $FlowIgnore because fs-extra doesn't have the synchronous methods typed
    yaml: fs.existsSync(`${pathToTry}.yaml`),
    // $FlowIgnore because fs-extra doesn't have the synchronous methods typed
    yml: fs.existsSync(`${pathToTry}.yml`),
  }

  const configCount: number = Object.keys(possibleConfigFiles).reduce(
    (acc: number, type: string) => (possibleConfigFiles[type] ? acc + 1 : acc),
    0
  )

  if (configCount === 0) {
    throw new Error(configFileMissingError(filename))
  } else if (configCount > 1) {
    throw new Error(configFileDuplicatesError(filename))
  }

  let fileType

  if (possibleConfigFiles.json) {
    fileType = 'json'
  } else {
    fileType = possibleConfigFiles.yaml ? 'yaml' : 'yml'
  }

  const filePath = `${pathToTry}.${fileType}`

  // $FlowIgnore because there's a conflict between string and Buffer here that looks like a bug in the external types
  const fileContents: string = fs.readFileSync(filePath)

  return {
    fileType,
    contents:
      // $FlowIgnore because yaml.load() returns a 'mixed' type which is incompatible with the actual object we're returning
      fileType === 'json' ? JSON.parse(fileContents) : yaml.load(fileContents),
    path: filePath,
  }
}
