import { normalize } from 'path'
import Debug from 'debug'
import { generateTypesFromSchemaCallback } from './generate-types-from-schema'
import { hydrateConfig } from './utils/hydrate-config'
import { readConfigFile, readSchemaFile } from './utils/read-file'
import * as sops from './utils/sops'
import { validate } from './validate'
import { Options } from './options'

import type { HydratedConfig } from './types'

const debug = Debug('strong-config:load')

export const load = (runtimeEnv: string, options: Options): HydratedConfig => {
  const normalizedConfigRoot = normalize(options.configRoot)

  const configFile = readConfigFile(normalizedConfigRoot, runtimeEnv)

  const decrypted = sops.decryptToObject(
    configFile.filePath,
    configFile.contents
  )

  const config = hydrateConfig(runtimeEnv, options)(decrypted)
  const schemaFile = readSchemaFile(normalizedConfigRoot)

  if (schemaFile) {
    validate(runtimeEnv, normalizedConfigRoot)
    debug(`${runtimeEnv} config is valid`)

    if (options.types !== false) {
      /*
       * Why a callback?
       * Because making load() return a promise would be cumbersome for consumers of this package.
       * It would mean that wherever they use strong-config, they'd have to make the context from which
       * they call it asynchronous.
       *
       * Additionally, the type generation is a dev-only feature that can safely fail without impacting
       * the core functionality of strong-config.
       */
      generateTypesFromSchemaCallback(
        normalizedConfigRoot,
        options.types,
        (error) => {
          if (error) {
            console.error('Failed to generate types from schema:', error)
          }
        }
      )
    }
  } else {
    console.info(
      `⚠️ No schema file found under '${normalizedConfigRoot}/schema.json'. We recommend creating a schema so Strong Config can ensure your config is valid.`
    )
  }

  return config
}
