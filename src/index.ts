import { load } from './load'
import { validate } from './validate'

import { MemoizedConfig } from './types'

interface Parameters {
  // TODO: define Parameters interface
}

export = class StrongConfig {
  public readonly params: Parameters | undefined
  private config: MemoizedConfig

  constructor(params?: Parameters) {
    // TODO: validate params
    this.params = params
  }

  public load(configDir?: string): ReturnType<typeof load> {
    if (this.config) {
      return this.config
    }

    this.config = load(configDir)

    return this.config
  }

  public validate(
    schemaPath: string,
    ...configPaths: string[]
  ): ReturnType<typeof validate> {
    return validate(schemaPath, ...configPaths)
  }
}
