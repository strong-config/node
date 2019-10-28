import R from 'ramda'

import { load } from './load'
import { validate } from './validate'
import { validate as validateParameters } from './params/validate'

import { MemoizedConfig } from './types'
import { defaultParameters, Parameters } from './params'

export = class StrongConfig {
  public readonly parameters: Parameters
  private config: MemoizedConfig

  constructor(parameters?: Partial<Parameters>) {
    this.parameters = validateParameters(
      parameters
        ? {
            ...defaultParameters,
            ...parameters,
          }
        : defaultParameters
    )
  }

  public load(): ReturnType<typeof load> {
    if (this.config) {
      return this.config
    }

    this.config = load(this.parameters)

    return this.config
  }

  public validate(...configPaths: string[]): ReturnType<typeof validate> {
    return validate(
      R.isEmpty(configPaths) ? [this.parameters.configPath] : configPaths,
      this.parameters
    )
  }
}
