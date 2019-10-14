import R from 'ramda'
import path from 'path'

import { generateTypeFromSchema } from './utils/generate-type-from-schema'
import { hydrateConfig } from './utils/hydrate-config'
import { validateConfig } from './utils/validate-config'
import { readConfigFile, readSchemaFile } from './utils/read-file'
import * as sops from './utils/sops'

import { HydratedConfig } from './types'

export const load = (configDir = './config'): HydratedConfig => {
  const normalizedConfigDir = path.normalize(configDir)

  if (R.isNil(process.env.RUNTIME_ENVIRONMENT)) {
    throw new Error('process.env.RUNTIME_ENVIRONMENT must be defined.')
  }

  const configFile = readConfigFile(
    normalizedConfigDir,
    process.env.RUNTIME_ENVIRONMENT
  )

  const decrypted = sops.decryptToObject(
    configFile.filePath,
    configFile.contents
  )

  const config = hydrateConfig(process.env.RUNTIME_ENVIRONMENT)(decrypted)

  const schemaFile = readSchemaFile('schema')

  if (schemaFile !== undefined) {
    validateConfig(config, schemaFile.contents)

    generateTypeFromSchema(`${normalizedConfigDir}/schema.json`)
  }

  return config
}
