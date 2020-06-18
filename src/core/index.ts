import Debug from 'debug'
import Ajv from 'ajv'
import type { Options } from '../options'
import { defaultOptions } from '../options'
import type { MemoizedConfig } from '../types'
import optionsSchema from '../options-schema.json'
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

    return this.config
  }

  public validate = (): ReturnType<typeof validate> => {
    return validate(this.runtimeEnv, this.options.configRoot)
  }
}
