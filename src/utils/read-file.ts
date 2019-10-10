import R from 'ramda'
import path from 'path'

import { findConfigFiles, findFiles } from './find-files'
import { getFileFromPath } from './get-file-from-path'

import { EncryptedConfig, Schema } from '../types'

export enum FileExtension {
  JSON = 'json',
  YAML = 'yaml',
  YML = 'yml',
}
export type File = {
  contents: EncryptedConfig | Schema
  filePath: string
}

export const getFileExtensionPattern = (): string =>
  `{${Object.values(FileExtension).join(',')}}`

export const readConfigFile = (basePath: string, fileName: string): File => {
  const filePaths = findConfigFiles(basePath, fileName)

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

export const readConfigFileAtPath = (filePath: string): File =>
  readConfigFile(path.dirname(filePath), path.basename(filePath))

export const readSchemaFile = (
  basePath: string,
  fileName = 'schema.json'
): File | undefined => {
  const filePaths = findFiles(basePath, fileName)

  if (R.isEmpty(filePaths)) {
    return undefined
  }

  if (filePaths.length > 1) {
    throw new Error(
      `More than one of ${fileName}.${getFileExtensionPattern()} found. Exactly one must exist.`
    )
  }

  return getFileFromPath(filePaths[0])
}

export const readSchemaFileAtPath = (filePath: string): File | undefined =>
  readSchemaFile(path.dirname(filePath), path.basename(filePath))
