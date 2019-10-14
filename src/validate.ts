import R from 'ramda'
import fs from 'fs'
import path from 'path'
import { findConfigFiles } from './utils/find-files'
import { getFileFromPath } from './utils/get-file-from-path'
import { validateConfig } from './utils/validate-config'

import { Schema } from './types'

const validateConfigAgainstSchema = (schema: Schema) => (
  configFilePath: string
): true => {
  const configFile = getFileFromPath(configFilePath)

  return validateConfig(configFile.contents, schema)
}

export const validate = (
  schemaPath: string,
  ...configPaths: string[]
): true => {
  const normalizedSchemaPath = path.normalize(schemaPath)

  if (R.isNil(configPaths) || R.isEmpty(configPaths)) {
    throw new Error('Config path(s) must be passed so they can be validated')
  }

  const normalizedConfigPaths = configPaths.map(path.normalize)

  const schemaFile = getFileFromPath(normalizedSchemaPath)
  const validateConfig = validateConfigAgainstSchema(schemaFile.contents)

  if (R.isNil(schemaFile)) {
    throw new Error('Could not find a schema for validation')
  }

  // Resolve absolute paths of all given `normalizedConfigPaths`, which can be passed as directories and/or files
  // TODO: Figure out correct type here. Error: R.compose<string[], (string | string[])[], string[]>
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const flatConfigPaths = R.compose<string[], any[], string[]>(
    R.flatten,
    R.map(configPath =>
      fs.lstatSync(configPath).isDirectory()
        ? findConfigFiles(configPath)
        : path.resolve(configPath)
    )
  )(normalizedConfigPaths)

  flatConfigPaths.forEach(validateConfig)

  return true
}
