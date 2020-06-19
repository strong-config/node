import Debug from 'debug'
import Ajv from 'ajv'
import type { Options } from '../options'
import { defaultOptions } from '../options'
import type { MemoizedConfig } from '../types'
import optionsSchema from '../options-schema.json'
import { generateTypesFromSchemaCallback } from './generate-types-from-schema'
import { validate } from './validate'
import { load } from './load'

const debug = Debug('strong-config:main')

/*
 * Using `export =` syntax for better CommonJS compatibility
 * See: https://www.typescriptlang.org/docs/handbook/modules.html#export--and-import--require
 */
export = class StrongConfig {
  public readonly options: Options
  private readonly runtimeEnv: string
  private config: MemoizedConfig

  constructor(options?: Partial<Options>) {
    const mergedOptions = options
      ? { ...defaultOptions, ...options }
      : defaultOptions

    this.validateOptions(mergedOptions)
    this.options = mergedOptions
    this.runtimeEnv = process.env[mergedOptions.runtimeEnvName] as string // we have validated process.env.NODE_ENV in this.validateOptions()
  }

  public validateOptions = (options: Options): void => {
    debug('Validating options:\n%O', options)
    const ajv = new Ajv({ allErrors: true, useDefaults: true })

    if (!ajv.validate(optionsSchema, options)) throw new Error(ajv.errorsText())

    if (!process.env[options.runtimeEnvName]) {
      throw new Error(
        `[💪 strong-config] process.env.${options.runtimeEnvName} is undefined.
         Maybe you forgot to set the environment variable ${options.runtimeEnvName} when starting your application?
         For example: 'NODE_ENV=production yarn start'\n`
      )
    }

    debug('Options are valid')
  }

  public load = (): ReturnType<typeof load> => {
    if (this.config) {
      debug('Returning memoized config')

      return this.config
    }

    debug('💰 Loading config from file (expensive operation!)')
    this.config = load(this.runtimeEnv, this.options)

    this.generateTypes()

    return this.config
  }

  public validate = (): ReturnType<typeof validate> => {
    return validate(this.runtimeEnv, this.options.configRoot)
  }

  public generateTypes = (): ReturnType<
    typeof generateTypesFromSchemaCallback
  > => {
    debug('Checking whether types should be generated...')

    if (
      this.options.types !== false &&
      process.env.NODE_ENV === 'development' &&
      /*
       * Hacky way to skip type generation for dev scripts like 'yarn dev:load:watch'
       * but NOT skip when running 'yarn test --watch' (because some tests are checking that type generation occurs)
       */
      /* istanbul ignore next: not worth testing this development-only hack */
      (!process.env?.npm_config_argv?.includes('watch') ||
        process.env?.npm_config_argv?.includes('--watch'))
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
