import fs from 'fs'
import path from 'path'
import fastGlob from 'fast-glob'
import yaml from 'js-yaml'
import { mergeDeepRight } from 'ramda'
import {
  EncryptedConfigFile,
  Schema,
  ConfigFileExtensions,
  JSONObject,
} from '../types'
import { defaultOptions } from '../options'
import { hasSecrets } from './has-secrets'

export const loadConfigForEnv = (
  runtimeEnv: string,
  configRootRaw: string,
  baseConfig: string = defaultOptions.baseConfig
): EncryptedConfigFile => {
  const configRoot = path.normalize(configRootRaw)

  const globPattern = `${configRoot}/${runtimeEnv}.{${ConfigFileExtensions.join(
    ','
  )}}`
  const allFiles = fastGlob.sync(globPattern)

  const configFiles = allFiles.filter((filePath) => {
    const fileName = filePath.split('/').pop() as string

    return fileName !== 'schema.json'
  })

  if (configFiles.length === 0) {
    throw new Error(
      `Couldn't find config file ${configRoot}/${runtimeEnv}.{${ConfigFileExtensions.join(
        ','
      )}}`
    )
  } else if (configFiles.length > 1) {
    throw new Error(
      `Duplicate config files detected: ${configFiles.join(
        ','
      )}. There can be only one config file per environment.`
    )
  }

  if (configFiles[0] === `${configRoot}/${baseConfig}`) {
    throw new Error(
      `Base config name '${baseConfig}' must be different from the environment-name '${runtimeEnv}'. Base config and env-specific config can't be the same file.`
    )
  }

  return loadConfigFromPath(configFiles[0], configRoot, baseConfig)
}

// Return type can NOT be undefined because config files are NOT optional (contrary to schema files)
export const loadConfigFromPath = (
  configPathRaw: string,
  configRootRaw: string = defaultOptions.configRoot,
  baseConfigFileName: string = defaultOptions.baseConfig
): EncryptedConfigFile => {
  const configPath = path.normalize(configPathRaw)
  const configRoot = path.normalize(configRootRaw)
  const baseConfig = loadBaseConfig(configRoot, baseConfigFileName)

  if (!fs.existsSync(configPath)) {
    throw new Error(`Couldn't find config file ${configPath}`)
  }

  const fileExtension = configPath.split('.').pop()

  let fileAsString: string
  let parsedConfigFile: JSONObject

  if (fileExtension === 'json') {
    fileAsString = fs.readFileSync(configPath).toString()
    parsedConfigFile = JSON.parse(fileAsString) as JSONObject
  } else if (fileExtension === 'yml' || fileExtension === 'yaml') {
    fileAsString = fs.readFileSync(configPath).toString()
    parsedConfigFile = yaml.load(fileAsString) as JSONObject
  } else {
    throw new Error(
      `Unsupported file: ${configPath}. Only JSON and YAML config files are supported.`
    )
  }

  /*
   * 1. Merge the environment-specific config (e.g. development.yaml) into the base config.
   * 2. If both baseConfig and env-specific config define the same key, the env-specific config should have precedence
   * 3. If baseConfig doesn't exist, it will be an empty object {} which is safe to overwrite anyways
   */
  return {
    contents: mergeDeepRight(baseConfig, parsedConfigFile),
    filePath: configPath,
  }
}

export const loadBaseConfig = (
  configRoot: string,
  baseConfigFileName: string
): JSONObject => {
  const baseConfigPath = `${configRoot}/${baseConfigFileName}`

  if (fs.existsSync(baseConfigPath)) {
    const baseConfigAsString = fs.readFileSync(baseConfigPath).toString()
    const baseConfig = yaml.load(baseConfigAsString) as JSONObject

    if (hasSecrets(baseConfig)) {
      throw new Error(
        `Secret detected in ${configRoot}/${baseConfigFileName} config. Base config files can not contain secrets because when using different encryption keys per environment, it's unclear which key should be used to encrypt the base config.`
      )
    }

    return baseConfig
  }

  return {}
}

// Return type can be undefined because use of schemas is optional (contrary to config files)
export const loadSchema = (configRootRaw: string): Schema | undefined => {
  const configRoot = path.normalize(configRootRaw)
  const schemaPath = `${configRoot}/schema.json`

  if (!fs.existsSync(schemaPath)) {
    return
  }

  const schemaAsString = fs.readFileSync(schemaPath).toString()
  const schema = JSON.parse(schemaAsString) as Schema

  /*
   * We auto-add the 'runtimeEnv' prop to the user's schema because we
   * hydrate every config object with a 'runtimeEnv' prop.
   *
   * If the user were to strictly define their schema via the json-schema
   * attribute 'additionalProperties: false', * then 'ajv.validate()' would
   * find an unexpected property 'runtimeEnv' in the config object and would
   * (rightfully) fail the schema validation.
   */
  schema.properties
    ? (schema.properties['runtimeEnv'] = { type: 'string' })
    : /* istanbul ignore next: an edge case for when the loaded schema is empty, not worth testing IMHO */
      (schema['properties'] = { runtimeEnv: { type: 'string' } })

  return schema
}
