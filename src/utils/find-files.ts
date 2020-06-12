import { resolve } from 'path'
import { compose, last, reject, split } from 'ramda'
import { sync } from 'glob'
import { ConfigFileExtensions } from '../options'
import { getFileExtensionPattern } from './read-file'

export const isSchema = (filePath: string): boolean =>
  compose<string, string[], string, boolean>(
    (fileName) => fileName.startsWith('schema'),
    last,
    split('/')
  )(filePath)

export const isJson = (filePath: string): boolean => filePath.endsWith('.json')

export const findFiles = (
  basePath: string,
  globFileName = '**/*',
  globFileExtension = '*'
): string[] => {
  let globPattern

  if (
    Object.values(ConfigFileExtensions).find((extension) =>
      globFileName.endsWith(extension)
    )
  ) {
    globPattern = globFileName
  } else {
    globPattern = `${globFileName}.${globFileExtension}`
  }

  return sync(globPattern, { cwd: resolve(basePath), absolute: true })
}

export const findConfigFilesAtPath = (
  basePath: string,
  fileName?: string
): string[] =>
  reject(isSchema, findFiles(basePath, fileName, getFileExtensionPattern()))
