import Debug from 'debug'
import type { HydratedConfig } from './types'
import { generateTypesFromSchemaCallback } from './generate-types-from-schema'
import { hydrateConfig } from './utils/hydrate-config'
import { readConfigForEnv, readSchemaFromConfigRoot } from './utils/read-file'
import * as sops from './utils/sops'
import { validate } from './validate'
import type { Options } from './options'

const debugNamespace = 'strong-config:load'
const debug = Debug(debugNamespace)

export const load = (runtimeEnv: string, options: Options): HydratedConfig => {
  const configFile = readConfigForEnv(runtimeEnv, options.configRoot)

  debug('Read config file: %O', configFile)

  const decryptedConfigFile = sops.decryptToObject(
    configFile.filePath,
    configFile.contents
  )
  debug('Decrypted config file: %O', decryptedConfigFile)

  const config = hydrateConfig(runtimeEnv, options)(decryptedConfigFile)
  debug('Hydrated config: %O', config)

  const schemaFile = readSchemaFromConfigRoot(options.configRoot)
  debug('Schema file: %O', schemaFile)

  if (schemaFile) {
    validate(runtimeEnv, normalizedConfigRoot)
    debug(`${runtimeEnv} config is valid`)

    if (options.types !== false && process.env.NODE_ENV === 'development') {
      if (process?.env?.npm_config_argv?.includes('watch')) {
        return config
      }
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
        options.configRoot,
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
