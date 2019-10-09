import { load } from './load'
import { validate } from './validate'

interface Configuration {
  // TODO: define Configuration interface
}

export default class StrongConfig {
  public readonly configuration: Configuration | undefined

  constructor(configuration?: Configuration) {
    // TODO: validate configuration
    this.configuration = configuration
  }

  public load(passedConfig?: MemoizedConfig): ReturnType<typeof load> {
    return load(passedConfig)
  }

  public validate(
    schemaPath: string,
    ...configPaths: string[]
  ): ReturnType<typeof validate> {
    return validate(schemaPath, ...configPaths)
  }
}
