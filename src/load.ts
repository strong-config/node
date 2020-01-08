import R from 'ramda'
import path from 'path'

import { generateTypeFromSchema } from './utils/generate-type-from-schema'
import { hydrateConfig } from './utils/hydrate-config'
import { validateJson } from './utils/validate-json'
import { readConfigFile, readSchemaFile } from './utils/read-file'
import * as sops from './utils/sops'

import { HydratedConfig } from './types'
import { Options } from './options'

export const load = (options: Options): HydratedConfig => {
  const normalizedConfigPath = path.normalize(options.configPath)
  const runtimeEnv = process.env[options.runtimeEnvName]

  if (R.isNil(runtimeEnv)) {
    throw new Error('runtimeEnv must be defined.')
  }

  const configFile = readConfigFile(normalizedConfigPath, runtimeEnv)

  const decrypted = sops.decryptToObject(
    configFile.filePath,
    configFile.contents
  )

  const config = hydrateConfig(runtimeEnv, options)(decrypted)

  if (options.schemaPath) {
    const normalizedSchemaPath = path.normalize(options.schemaPath)
    const schemaFile = readSchemaFile(normalizedSchemaPath)

    if (schemaFile === null) {
      throw new Error(
        `Specified schema at '${options.schemaPath}' is not valid JSON or cannot be read`
      )
    }

    validateJson(config, schemaFile.contents)

    if (options.types !== false) {
      generateTypeFromSchema(options.schemaPath, options.types)
    }
  }

  return config
}
