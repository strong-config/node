import R from 'ramda'
import path from 'path'

import { generateTypeFromSchema } from './utils/generate-type-from-schema'
import { hydrateConfig } from './utils/hydrate-config'
import { validateJson } from './utils/validate-json'
import { readConfigFile, readSchemaFile } from './utils/read-file'
import * as sops from './utils/sops'

import { HydratedConfig } from './types'
import { Parameters } from './params'

export const load = (parameters: Parameters): HydratedConfig => {
  const normalizedConfigPath = path.normalize(parameters.configPath)
  const normalizedSchemaPath = path.normalize(parameters.schemaPath)
  const runtimeEnv = process.env[parameters.runtimeEnvName]

  if (R.isNil(runtimeEnv)) {
    throw new Error('runtimeEnv must be defined.')
  }

  const configFile = readConfigFile(normalizedConfigPath, runtimeEnv)

  const decrypted = sops.decryptToObject(
    configFile.filePath,
    configFile.contents
  )

  const config = hydrateConfig(runtimeEnv, parameters)(decrypted)

  const schemaFile = readSchemaFile(normalizedSchemaPath)

  if (schemaFile !== undefined) {
    validateJson(config, schemaFile.contents)

    generateTypeFromSchema(parameters)
  }

  return config
}
