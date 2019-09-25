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

  const decrypted = sops.decryptToObject(
    configFile.filePath,
    configFile.contents
  )

  const config = hydrateConfig(process.env.RUNTIME_ENVIRONMENT)(decrypted)

  const schemaFile = readSchemaFile('schema')

  if (schemaFile !== undefined) {
    validateConfig(config, schemaFile.contents)

    generateTypeFromSchema('config/schema.json')
  }

  state.didLoad = true
  state.config = config

  return config
}
