const memoizedState = {
  didLoad: false,
  config: null,
}

export const load = (state = memoizedState): Record<K, T> => {
  if (state.didLoad) {
    return state.config
  }

  if (process.env.RUNTIME_ENVIRONMENT === null) {
    throw new Error('process.env.RUNTIME_ENVIRONMENT is not defined.')
  }

  const configFile = readConfigFile(process.env.BBK_RUNTIME_ENVIRONMENT)

  const decrypted =
    configFile.contents.sops != null && process.env.NODE_ENV !== 'test'
      ? /* istanbul ignore next: we trust that the sops package works as expected */
        sops.decrypt(configFile.path)
      : configFile.contents

  const config = JSON.parse(envsubst(JSON.stringify(decrypted)))
  config.runtimeEnvironment = process.env.BBK_RUNTIME_ENVIRONMENT

  let schemaFile

  try {
    schemaFile = readConfigFile('schema')
  } catch (error) {
    // It's explicitly allowed to NOT have a schema file, just return whatever we substituted
    if (error.message === configFileMissingError('schema')) {
      return config
    }

    throw error
  }

  validate(config, schemaFile.contents)

  /*
   * Auto-generate a flow type definition for the config schema if:
   *   1) We're in a development environment
   *   2) The schema filetype is JSON
   *   3a) Either there is no auto-generated flow type file yet
   *   3b) Or the auto-generated flow type hasn't been updated since at least 24 hours
   */

  // TODO: generate Typescript interface dynamically?
  // if (
  //   process.env.BBK_RUNTIME_ENVIRONMENT === 'development' &&
  //   schemaFile.fileType === 'json'
  // ) {
  //   //
  //   const generateFlowTypeFromJsonSchema = nullrequire(
  //     './generate-flow-type-from-schema'
  //   )

  //   schemaFile.contents.required.push('runtimeEnvironment')
  //   schemaFile.contents.properties.runtimeEnvironment = {
  //     $id: '#/properties/runtimeEnvironment',
  //     type: 'string',
  //     enum: ['development', 'review', 'staging', 'production'],
  //     title: 'BBK runtime environment',
  //     default: '',
  //     pattern: '/^development|review|staging|production$/',
  //   }
  //   generateFlowTypeFromJsonSchema(schemaFile.contents)
  // }

  state.didLoad = true
  state.config = config

  return config
}
