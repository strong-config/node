import fs from 'fs'
import path from 'path'
import glob from 'glob'
import yaml from 'js-yaml'
import {
  EncryptedConfigFile,
  Schema,
  ConfigFileExtensions,
  JSONObject,
} from '../types'

export const loadConfigForEnv = (
  runtimeEnv: string,
  configRootRaw: string
): EncryptedConfigFile => {
  const configRoot = path.normalize(configRootRaw)
  const allFiles = glob.sync(
    `${runtimeEnv}.{${ConfigFileExtensions.join(',')}}`,
    {
      cwd: path.resolve(configRoot),
      absolute: true,
    }
  )

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

  return loadConfigFromPath(configFiles[0])
}

// Return type can NOT be undefined because config files are NOT optional (contrary to schema files)
export const loadConfigFromPath = (
  configPathRaw: string
): EncryptedConfigFile => {
  const configPath = path.normalize(configPathRaw)

  if (!fs.existsSync(configPath)) {
    throw new Error(`Couldn't find config file ${configPath}`)
  }

  const fileExtension = configPath.split('.').pop()

  let fileAsString: string
  let parsedFile: JSONObject

  if (fileExtension === 'json') {
    fileAsString = fs.readFileSync(configPath).toString()
    parsedFile = JSON.parse(fileAsString) as JSONObject
  } else if (fileExtension === 'yml' || fileExtension === 'yaml') {
    fileAsString = fs.readFileSync(configPath).toString()
    parsedFile = yaml.load(fileAsString) as JSONObject
  } else {
    throw new Error(
      `Unsupported file: ${configPath}. Only JSON and YAML config files are supported.`
    )
  }

  return { contents: parsedFile, filePath: configPath }
}

// Return type can be undefined because use of schemas is optional (contrary to config files)
export const loadSchema = (configRootRaw: string): Schema | undefined => {
  const configRoot = path.normalize(configRootRaw)
  const schemaPath = `${configRoot}/schema.json`

  if (!fs.existsSync(schemaPath)) return

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
