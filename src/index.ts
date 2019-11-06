import R from 'ramda'

import { load } from './load'
import { validate } from './validate'
import { validate as validateOptions } from './options/validate'

import { MemoizedConfig } from './types'
import { defaultOptions, Options } from './options'

export = class StrongConfig {
  public readonly options: Options
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
  }

  public load(): ReturnType<typeof load> {
    if (this.config) {
      return this.config
    }

    this.config = load(this.options)

    return this.config
  }

  public validate(...configPaths: string[]): ReturnType<typeof validate> {
    return validate(
      R.isEmpty(configPaths) ? [this.options.configPath] : configPaths,
      this.options
    )
  }
}
