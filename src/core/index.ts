import Debug from 'debug'
import Ajv from 'ajv'
import type { Options } from '../options'
import { optionsSchema, defaultOptions } from '../options'
import type { MemoizedConfig, Schema } from '../types'
import { loadSchema, readConfig } from '../utils/read-files'
import { hydrateConfig } from '../utils/hydrate-config'
import * as sops from '../utils/sops'
import { generateTypesFromSchemaCallback } from '../utils/generate-types-from-schema'
import { DecryptedConfig, HydratedConfig } from './../types'

const debug = Debug('strong-config:main')

class StrongConfig {
  public readonly options: Options
  private readonly runtimeEnv: string
  private config: MemoizedConfig
  private schema: Schema | null | undefined

  constructor(options?: Partial<Options>) {
    const mergedOptions = options
      ? { ...defaultOptions, ...options }
      : defaultOptions

    this.validate(mergedOptions, optionsSchema)
    this.options = mergedOptions
    this.runtimeEnv = process.env[mergedOptions.runtimeEnvName] as string

    // eslint-disable-next-line unicorn/no-null
    this.schema = this.getSchema() || null
    this.config = this.getConfig()

    if (this.schema) {
      debug('Loaded schema file: %O', this.schema)
    } else {
      /*
       * Deliberately NOT making this a debug() output because we want
       * to encourage all users to define a schema for their configs
       */
      console.info(
        `⚠️ No schema file found under '${this.options.configRoot}/schema.json'. We recommend creating a schema so Strong Config can ensure your config is valid.`
      )
    }
  }

  public getConfig(): HydratedConfig {
    if (this.config) {
      debug('Returning memoized config')

      return this.config
    }

    debug('💰 Loading config from file (expensive operation!)')
    const configFile = readConfig(this.runtimeEnv, this.options.configRoot)
    debug('Loaded config file: %O', configFile)

    const decryptedConfig: DecryptedConfig = sops.decryptToObject(
      configFile.filePath,
      configFile.contents
    )
    debug('Decrypted config: %O', decryptedConfig)

    const config = hydrateConfig(this.runtimeEnv, this.options)(decryptedConfig)
    debug('Hydrated config: %O', config)

    if (this.schema) {
      this.validate(config, this.schema)
      this.generateTypes()
    }

    return config
  }

  public getSchema(): Schema | null {
    /*
     * If schema is 'null' instead of 'undefined' it means there is no schema file.
     * We're using this early exit in order to not have to call loadSchema() again
     * and again which would be a waste of work if we already know there is no schema.
     */
    if (this.schema === null) {
      debug(
        `getSchema() :: No schema found in ${this.options.configRoot}. Skip loading.`
      )

      return this.schema
    }

    if (this.schema) {
      debug('Returning memoized schema')

      return this.schema
    }

    debug('💰 Loading schema from file (expensive operation!)')

    // eslint-disable-next-line unicorn/no-null
    return loadSchema(this.options.configRoot) || null
  }

  public validate(data: MemoizedConfig | Options, schema: Schema): true {
    const ajv = new Ajv({ allErrors: true, useDefaults: true })

    if (!ajv.validate(schema, data)) {
      throw new Error(ajv.errorsText())
    }

    return true
  }

  public generateTypes(): ReturnType<typeof generateTypesFromSchemaCallback> {
    debug('Checking whether types should be generated...')

    if (
      this.options.types !== false &&
      process.env.NODE_ENV === 'development'
    ) {
      debug('Starting type generation...')
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
        this.options.configRoot,
        this.options.types,
        /* istanbul ignore next: too difficult to test and too little value in testing this */
        (error) => {
          if (error) {
            console.error('Failed to generate types from schema:', error)
          } else {
            debug('Type generation succeeded')
          }
        }
      )
    }
  }
}

/*
 * Using `export =` syntax for better CommonJS compatibility
 * See: https://www.typescriptlang.org/docs/handbook/modules.html#export--and-import--require
 */
export = StrongConfig
