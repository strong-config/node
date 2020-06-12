import { existsSync } from 'fs'
import { isEmpty } from 'ramda'
import { defaultOptions } from '../options'
import { ConfigFile, ConfigFileExtensions } from '../types'

import { findConfigFilesAtPath } from './find-files'
import { getFileFromPath } from './get-file-from-path'

export const getFileExtensionPattern = (): string =>
  `{${Object.values(ConfigFileExtensions).join(',')}}`

export const readConfigFile = (
  basePath: string,
  fileName: string
): ConfigFile => {
  const filePaths = findConfigFilesAtPath(basePath, fileName)

  if (isEmpty(filePaths)) {
    throw new Error(
      `None of ${fileName}.${getFileExtensionPattern()} found. One of these files must exist.`
    )
  } else if (filePaths.length > 1) {
    throw new Error(
      `More than one of ${fileName}.${getFileExtensionPattern()} found. Exactly one must exist.`
    )
  }

  return getFileFromPath(filePaths[0])
}

export const readSchemaFile = (
  configRoot: string = defaultOptions.configRoot
): ConfigFile | undefined => {
  const schemaPath = `${configRoot}/schema.json`

  return existsSync(schemaPath) ? getFileFromPath(schemaPath) : undefined
}
