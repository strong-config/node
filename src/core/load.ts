import Debug from 'debug'
import type { HydratedConfig } from '../types'
import { hydrateConfig } from '../utils/hydrate-config'
import { readConfigForEnv, readSchemaFromConfigRoot } from '../utils/read-file'
import * as sops from '../utils/sops'
import type { Options } from '../options'
import { validate } from './validate'

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
    validate(runtimeEnv, options.configRoot)
    debug(`${runtimeEnv} config is valid`)
  } else {
    /*
     * Deliberately NOT making this a debug() output because we want
     * to encourage all users to define a schema for their configs
     */
    console.info(
      `⚠️ No schema file found under '${options.configRoot}/schema.json'. We recommend creating a schema so Strong Config can ensure your config is valid.`
    )
  }

  return config
}
