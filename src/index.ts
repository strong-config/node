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

  public load(): ReturnType<typeof load> {
    if (R.isNil(this.runtimeEnv)) {
      throw new Error('runtimeEnv must be defined.')
    }

    if (this.config) {
      return this.config
    }

    this.config = load(this.runtimeEnv, this.options)

    return this.config
  }

  public validate(): ReturnType<typeof validate> {
    if (R.isNil(this.runtimeEnv)) {
      throw new Error('runtimeEnv must be defined.')
    }

    return validate(this.runtimeEnv, this.options.configRoot)
  }
}
