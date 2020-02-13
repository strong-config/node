import R from 'ramda'
import path from 'path'

import { defaultOptions, ConfigFileExtensions } from './options'

// Utils
import { findConfigFilesAtPath } from './utils/find-files'
import { readSchemaFile } from './utils/read-file'
import { getFileFromPath } from './utils/get-file-from-path'
import validateJsonAgainstSchema from './utils/validate-json-against-schema'

export const validate = (
  fileName: string,
  configRoot: string = defaultOptions.configRoot
): true => {
  const normalizedConfigRoot = path.normalize(configRoot)
  const normalizedFileName = Object.values(ConfigFileExtensions).find(ext =>
    fileName.endsWith(ext)
  )
    ? fileName
    : findConfigFilesAtPath(normalizedConfigRoot, fileName)[0]

  const configFile = getFileFromPath(normalizedFileName)
  const schemaFile = readSchemaFile(normalizedConfigRoot)

  if (R.isNil(schemaFile)) {
    throw new Error(
      '[💪 strong-config] ❌ No schema file found. Cannot validate without a schema.'
    )
  }

  return validateJsonAgainstSchema(configFile.contents, schemaFile.contents)
}

export default validate
