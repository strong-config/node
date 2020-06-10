import { isNil } from 'ramda'
import Debug from 'debug'
import type { JSONObject, MemoizedConfig } from './types'
import { load } from './load'
import { validate } from './validate'
import { defaultOptions, Options } from './options'
import optionsSchema from './options/schema.json'
import { validateJsonAgainstSchema } from './utils/validate-json-against-schema'
const debug = Debug('strong-config:main')

export = class StrongConfig {
  public readonly options: Options
  private readonly runtimeEnv: string | undefined
  private config: MemoizedConfig

  constructor(options?: Partial<Options>) {
    const mergedOptions = options
      ? { ...defaultOptions, ...options }
      : defaultOptions

    debug('Validating options:\n%O', mergedOptions)
    validateJsonAgainstSchema(
      (mergedOptions as unknown) as JSONObject,
      optionsSchema
    )
    debug('Options are valid')

    this.options = mergedOptions

    this.runtimeEnv = process.env[this.options.runtimeEnvName]
  }

  private checkRuntimeEnv = (): void => {
    if (isNil(this.runtimeEnv)) {
      throw new Error(
        `[💪 strong-config] Can't load config: process.env.${this.options.runtimeEnvName} is undefined.
         Maybe you have forgotten to set the environment variable ${this.options.runtimeEnvName} when starting your application?
         For example: 'NODE_ENV=production yarn start'\n`
      )
    }
  }

  public load = (): ReturnType<typeof load> => {
    this.checkRuntimeEnv()

    if (this.config) {
      debug('Returning memoized config')

      return this.config
    }

    debug('💰 Loading config from file (expensive operation!)')
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore because we're checking for 'undefined' in this.checkRuntimeEnv() already
    this.config = load(this.runtimeEnv, this.options)

    return this.config
  }

  public validate = (): ReturnType<typeof validate> => {
    this.checkRuntimeEnv()

    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore because we're checking for 'undefined' in this.checkRuntimeEnv() already
    return validate(this.runtimeEnv, this.options.configRoot)
  }
}
