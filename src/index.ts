import R from 'ramda'
import { load } from './load'
import { validate } from './validate'
import validateOptions from './options/validate-options'

import { MemoizedConfig } from './types'
import { defaultOptions, Options } from './options'

export = class StrongConfig {
  public readonly options: Options
  private readonly runtimeEnv: string | undefined
  private config: MemoizedConfig

  constructor(options?: Partial<Options>) {
    this.options = validateOptions(
      options
        ? {
            ...defaultOptions,
            ...options,
          }
        : defaultOptions
    )

    this.runtimeEnv = process.env[this.options.runtimeEnvName]
  }

  private checkRuntimeEnv(): void {
    if (R.isNil(this.runtimeEnv)) {
      throw new Error(
        `[💪 strong-config] Can't load config: process.env.${this.options.runtimeEnvName} is undefined.
         Maybe you have forgotten to set the environment variable ${this.options.runtimeEnvName} when starting your application?
         For example: 'NODE_ENV=production yarn start'\n`
      )
    }
  }

  public load(): ReturnType<typeof load> {
    this.checkRuntimeEnv()

    if (this.config) {
      return this.config
    }

    /* eslint-disable-next-line */
    // @ts-ignore because we're checking for 'undefined' in this.checkRuntimeEnv() already
    this.config = load(this.runtimeEnv, this.options)

    return this.config
  }

  public validate(): ReturnType<typeof validate> {
    this.checkRuntimeEnv()

    /* eslint-disable-next-line */
    // @ts-ignore because we're checking for 'undefined' in this.checkRuntimeEnv() already
    return validate(this.runtimeEnv, this.options.configRoot)
  }
}
