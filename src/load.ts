import R from 'ramda'
import { generateTypeFromSchema } from './utils/generate-type-from-schema'
import { hydrateConfig } from './utils/hydrate-config'
import { validateConfig } from './utils/validate-config'
import { readConfigFile, readSchemaFile } from './utils/read-file'
import * as sops from './utils/sops'

type MemoizedState = {
  didLoad: boolean
  config: any
}

const memoizedState: MemoizedState = {
  didLoad: false,
  config: null,
}

export const load = (
  state: MemoizedState = memoizedState
): Record<string, any> => {
  if (state.didLoad) {
    return state.config
  }

  if (R.isNil(process.env.RUNTIME_ENVIRONMENT)) {
    throw new Error('process.env.RUNTIME_ENVIRONMENT must be defined.')
  }

  const configFile = readConfigFile(process.env.RUNTIME_ENVIRONMENT)

  // TODO: Only decrypt when process.env.NODE_ENV !== 'test' ?
  const decrypted = sops.decryptToObject(
    configFile.filePath,
    configFile.contents
  )

  const config = hydrateConfig(process.env.RUNTIME_ENVIRONMENT)(decrypted)

  const schemaFile = readSchemaFile('schema')

  console.log('SCHEMA', schemaFile)

  if (schemaFile !== undefined) {
    validateConfig(config, schemaFile.contents)
    console.log('CONFIG and SCHEMA validated')
    /*
     * TODO: Does this comment still apply?
     * -> We should always create the type if a schema exists
     * -> Support schema files in yaml format?
     *
     * Auto-generate a flow type definition for the config schema if:
     *   1) We're in a development environment
     *   2) The schema filetype is JSON
     *   3a) Either there is no auto-generated flow type file yet
     *   3b) Or the auto-generated flow type hasn't been updated since at least 24 hours
     */
    generateTypeFromSchema('config/schema.json')
  }

  state.didLoad = true
  state.config = config

  return config
}
