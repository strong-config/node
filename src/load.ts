import { normalize } from 'path'
import { generateTypesFromSchemaCallback } from './utils/generate-types-from-schema'
import { hydrateConfig } from './utils/hydrate-config'
import { readConfigFile, readSchemaFile } from './utils/read-file'
import * as sops from './utils/sops'
import { validate } from './validate'
import { Options } from './options'

import type { HydratedConfig } from './types'
/*
 * NOTE: We have made a conscious decision to keep the load() function synchronous (e.g. no 'async' keyword)
 *
 * Why? Because making load() async would be very invasive for consumers of this package.
 * It would mean that wherever they use strong-config, they'd have to make the context from which
 * they call it asynchronous.
 *
 * Also, the type generation is a dev-only feature that can safely fail without impacting the core
 * functionality of strong-config.
 */
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
    // TODO: replace with proper logger and only log if in debug-mode
    console.debug(`[💪 strong-config] ✅ ${runtimeEnv} config is valid`)

    if (options.types !== false) {
      // NOTE: It's ok that this function is asynchronous despite the surrounding load() function being sync, see function comment above
      generateTypeFromSchema(normalizedConfigRoot, options.types, (error) => {
        console.error('Failed to generate types from schema:', error)
      })
    }
  } else {
    // TODO: replace with proper logger and only log if in debug-mode
    console.debug(
      `[💪 strong-config] ⚠️ No schema file found under '${normalizedConfigRoot}/schema.json'. We recommend creating a schema so Strong Config can ensure your config is valid.`
    )
  }

  return config
}
