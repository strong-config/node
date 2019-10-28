import R from 'ramda'
import path from 'path'
import glob from 'glob'

import { getFileExtensionPattern } from './read-file'

export const isSchema = (filePath: string): boolean =>
  R.compose<string, string[], string, boolean>(
    fileName => fileName.startsWith('schema'),
    R.last,
    R.split('/')
  )(filePath)

export const isJson = (filePath: string): boolean => filePath.endsWith('.json')

export const findFiles = (
  basePath: string,
  globFileName = '**/*',
  globFileExtension = '*'
): string[] => {
  const globPattern = `${globFileName}.${globFileExtension}`

  return glob.sync(globPattern, { cwd: path.resolve(basePath), absolute: true })
}

export const findConfigFiles = (
  basePath: string,
  fileName?: string
): string[] =>
  R.reject(isSchema, findFiles(basePath, fileName, getFileExtensionPattern()))
