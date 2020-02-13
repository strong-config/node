import R from 'ramda'
import fs from 'fs'

import { findConfigFilesAtPath } from './find-files'
import { getFileFromPath } from './get-file-from-path'

import defaultOptions, { ConfigFileExtensions } from '../options'
import { EncryptedConfig, Schema } from '../types'

export type File = {
  contents: EncryptedConfig | Schema
  filePath: string
}

export const getFileExtensionPattern = (): string =>
  `{${Object.values(ConfigFileExtensions).join(',')}}`

export const readConfigFile = (basePath: string, fileName: string): File => {
  const filePaths = findConfigFilesAtPath(basePath, fileName)

  if (R.isEmpty(filePaths)) {
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
): File | null => {
  const schemaPath = `${configRoot}/schema.json`
  return fs.existsSync(schemaPath) ? getFileFromPath(schemaPath) : null
}
