import { normalize } from 'path'
import fs from 'fs'
import yaml from 'js-yaml'
import { isEmpty } from 'ramda'
import { ConfigFile, Schema, ConfigFileExtensions, JSONObject } from '../types'
import { findConfigFilesAtPath } from './find-files'

export const readConfigForEnv = (
  runtimeEnv: string,
  configRootRaw: string
): ConfigFile => {
  const configRoot = normalize(configRootRaw)
  const filePaths = findConfigFilesAtPath(configRoot, runtimeEnv)

  if (isEmpty(filePaths)) {
    throw new Error(
      `Couldn't find config file ${configRoot}/${runtimeEnv}.{${ConfigFileExtensions.join(
        ','
      )}}`
    )
  } else if (filePaths.length > 1) {
    throw new Error(
      `Duplicate config files detected: ${filePaths.join(
        ','
      )}. There can be only one config file per environment.`
    )
  }

  return readConfigFromPath(filePaths[0])
}

// Return type can NOT be undefined because config files are NOT optional (contrary to schema files)
export const readConfigFromPath = (configPathRaw: string): ConfigFile => {
  const configPath = normalize(configPathRaw)

  if (!fs.existsSync(configPath)) {
    throw new Error(`Couldn't find config file ${configPath}`)
  }

  const fileAsString = fs.readFileSync(configPath).toString()
  const fileExtension = configPath.split('.').pop()

  let parsedFile

  if (fileExtension === 'json') {
    parsedFile = JSON.parse(fileAsString) as JSONObject
  } else if (fileExtension === 'yml' || fileExtension === 'yaml') {
    parsedFile = yaml.load(fileAsString) as JSONObject
  } else {
    throw new Error(
      `Unsupported file: ${configPath}. Only JSON and YAML config files are supported.`
    )
  }

  return { contents: parsedFile, filePath: configPath }
}

// Return type can be undefined because use of schemas is optional (contrary to config files)
export const readSchemaFromConfigRoot = (
  configRootRaw: string
): Schema | undefined => {
  const configRoot = normalize(configRootRaw)
  const schemaPath = `${configRoot}/schema.json`

  if (!fs.existsSync(schemaPath)) return

  const schemaAsString = fs.readFileSync(schemaPath).toString()
  const schema = JSON.parse(schemaAsString) as Schema

  return schema
}
