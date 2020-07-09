import Debug from 'debug'
import Ajv from 'ajv'
import type { Options } from '../options'
import { optionsSchema, defaultOptions } from '../options'
import type { MemoizedConfig, Schema } from '../types'
import { loadSchema, readConfig } from '../utils/read-files'
import { hydrateConfig } from '../utils/hydrate-config'
import * as sops from '../utils/sops'
import { generateTypesFromSchemaCallback } from '../utils/generate-types-from-schema'
import { HydratedConfig } from './../types'

const debug = Debug('strong-config:main')

/**
 * The main Strong Config interface
 *
 * @remarks
 * This class lets you interact with your application configuration in a  simple, safe,
 * and reliable way. It finds & loads configuration files from the file system, decrypts
 * encrypted config values, and optionally validates config against a user-defined json-schema.
 * If a schema is defined, it will also auto-generate typescript types for your config
 * for a better development experience.
 *
 * This class should be instantiated just once per application in order to avoid unnecessary
 * repetitive file system lookups.
 *
 * @example
 * ```js
 * // In Node.js projects, import it like any other module:
 * const StrongConfig = require('strong-config/node') // (omitted at-sign in package name due to tsdoc incompatibility)
 * ```
 *
 * @example
 * ```ts
 * // In TypeScript projects, you have to use 'import =' syntax (because we want to stay CommonJS-compatible):
 * import StrongConfig = require('strong-config/node') // (omitted at-sign in package name due to tsdoc incompatibility)
 * ```
 *
 * @example
 * ```ts
 * // It's advisable to instantiate Strong Config only once to leverage memoization and avoid unnecessary disk lookups
 *
 * // ./src/config.ts
 * import StrongConfig = require('strong-config/node') // (omitted at-sign in package name due to tsdoc incompatibility)
 * const config = new StrongConfig().getConfig()
 * export default config
 *
 * // ./src/index.ts
 * import config from './config' // import memoized config instead of doing 'new StrongConfig()' again
 * console.log("Here is your memoized config:", config)
 * ```
 *
 * @remarks
 * We use `export =` syntax for CommonJS compatibility
 * https://www.typescriptlang.org/docs/handbook/modules.html#export--and-import--require
 */
export = class StrongConfig {
  public readonly options: Options
  private readonly runtimeEnv: string
  private config: MemoizedConfig
  private schema: Schema | null | undefined

  /**
   * Initializes StrongConfig and loads & memoizes config (plus schema, if existent)
   *
   * @param options - custom options to override defaults
   *
   * @remarks
   * The constructor also ensures that the options are valid,
   * and a runtime env has been set.
   */
  constructor(options?: Partial<Options>) {
    const mergedOptions = options
      ? { ...defaultOptions, ...options }
      : defaultOptions

    this.validate(mergedOptions, optionsSchema)
    this.options = mergedOptions

    if (
      !process.env[this.options.runtimeEnvName] ||
      typeof process.env[this.options.runtimeEnvName] !== 'string'
    ) {
      throw new Error(
        `[strong-config 💪]: process.env.${
          this.options.runtimeEnvName
        } needs to be set but was '${
          process.env[this.options.runtimeEnvName] || 'undefined'
        }'\nMake sure it's set when starting the app, for example: '${
          this.options.runtimeEnvName
        }'=development yarn start'\n`
      )
    }

    // Typecasting to string is safe as we've determined it's a string in the previous if-statement
    this.runtimeEnv = process.env[this.options.runtimeEnvName] as string

    // See explanation for why 'null' in comments for getSchema() method
    // eslint-disable-next-line unicorn/no-null
    this.schema = this.getSchema() || null
    this.config = this.getConfig()

    if (this.schema) {
      debug('Loaded schema file: %O', this.schema)
    } else {
      /*
       * Deliberately NOT using debug() here because we want to
       * always encourage users to define a schema for their config.
       */
      console.info(
        `⚠️ No schema file found under '${this.options.configRoot}/schema.json'. We recommend creating a schema so Strong Config can ensure your config is valid.`
      )
    }
  }

  /**
   * Returns the environment-specific decrypted config.
   *
   * @remarks
   * Upon first invocation: loads config file from disk, decrypts encrypted fields, hydrates config, then memoizes it.
   * Upon subsequent invocations, returns memoized config directly.
   *
   * If a schema.json exists in the config folder, then it will also
   * a) validate the loaded config object against the schema
   * b) generate config types based on the schema
   *
   * @returns The config
   */
  public getConfig(): HydratedConfig {
    if (this.config) {
      debug('Returning memoized config')

      return this.config
    }

    debug('💰 Loading config from disk (expensive operation!)')
    const configFile = readConfig(this.runtimeEnv, this.options.configRoot)
    debug('Loaded config file: %O', configFile)

    const decryptedConfig = sops.decryptToObject(
      configFile.filePath,
      configFile.contents
    )
    debug('Decrypted config: %O', decryptedConfig)

    const config = hydrateConfig(this.runtimeEnv)(decryptedConfig)
    debug('Hydrated config: %O', config)

    if (this.schema) {
      this.validate(config, this.schema)
      this.generateTypes()
    }

    return config
  }

  /**
   * Returns the schema against which to validate the config
   *
   * @remarks
   * If we can't find a schema file, we're explicitly setting it to 'null'.
   * We're doing this to distinguish between the first invocation (where this.schema
   * is 'undefined') and subsequent invocations (where this.schema is 'null).
   *
   * We only want to look for the schema once.
   * If we were to leave it 'undefined' then we would look for a schema on disk every time
   * getSchema() gets called, which is a waste of work if we already know there is no schema.
   *
   * @returns The config schema
   */
  public getSchema(): Schema | null {
    if (this.schema) {
      debug('Returning memoized schema')

      return this.schema
    }

    if (this.schema === null) {
      debug(
        `getSchema() :: No schema found in ${this.options.configRoot}. Skip loading.`
      )

      return this.schema
    }

    debug('💰 Loading schema from file (expensive operation!)')

    // eslint-disable-next-line unicorn/no-null
    return loadSchema(this.options.configRoot) || null
  }

  /**
   * Validates config against a user-defined json-schema
   *
   * @remarks
   * Also used to validate the Strong Config options upon instantiation
   *
   * @param data - A config object to validate
   * @param schema - A config schema to validate against
   *
   * @throws an error if validation failed
   *
   * @returns true, if validation succeeded
   */
  public validate(data: MemoizedConfig | Options, schema: Schema): true {
    const ajv = new Ajv({ allErrors: true, useDefaults: true })

    if (!ajv.validate(schema, data)) {
      throw new Error(ajv.errorsText())
    }

    return true
  }

  /**
   * Generates a types.d.ts file in your config folder to strongly type your config object
   *
   * @example
   * ```ts
   * // Import the generated types from your config folder
   * import { Config } from "../config/types"
   * // Then use them like this
   * const config = new StrongConfig().getConfig() as unknown as Config
   * ```
   * The 'as unknown as Config' part is a slightly hacky way of convincing the TypeScript compiler
   * that the config variable is in fact of type 'Config'. See more details about this approach in
   * this blog article: https://mariusschulz.com/blog/the-unknown-type-in-typescript#using-type-assertions-with-unknown
   *
   * @remarks
   * Why a callback?
   * Because if we made this function asynchronous, it would mean that wherever strong-config
   * is used, the code from which it's called needs to be asynchronous, too.
   * For example, it would be "const strongConfig = await new StrongConfig()" which means also
   * that this code would need to be wrapped in an 'async' function. This is too cumbersome.
   *
   * Also, type generation is a dev-only feature that can safely fail without impacting
   * the core functionality of strong-config, so it's OK to not wait for it to finish.
   */
  public generateTypes(): void {
    debug('Checking whether types should be generated...')

    if (
      this.options.types !== false &&
      process.env[this.options.runtimeEnvName] === 'development'
    ) {
      debug('Starting type generation...')
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
