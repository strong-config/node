import R from 'ramda'
import path from 'path'
import { findConfigFilesAtPaths } from './utils/find-files'
import { getFileFromPath } from './utils/get-file-from-path'
import { validateJson } from './utils/validate-json'

import { Schema } from './types'
import { Options } from './options'

const validateConfigAgainstSchema = (schema: Schema) => (
  configFilePath: string
): true => {
  const configFile = getFileFromPath(configFilePath)

  return validateJson(configFile.contents, schema)
}

export const validate = (
  configPaths: string[],
  { schemaPath }: Options
): true => {
  const normalizedSchemaPath = path.normalize(schemaPath)
  const normalizedConfigPaths = configPaths.map(path.normalize)

  const schemaFile = getFileFromPath(normalizedSchemaPath)
  const validateConfig = validateConfigAgainstSchema(schemaFile.contents)

  if (R.isNil(schemaFile)) {
    throw new Error('Could not find a schema for validation')
  }

  findConfigFilesAtPaths(normalizedConfigPaths).forEach(validateConfig)

  return true
}
