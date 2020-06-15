import { resolve } from 'path'
import { compose, last, reject, split } from 'ramda'
import glob from 'glob'
import { ConfigFileExtensions } from '../types'

export const isSchema = (filePath: string): boolean =>
  compose<string, string[], string, boolean>(
    (fileName) => fileName.startsWith('schema'),
    last,
    split('/')
  )(filePath)

export const findFiles = (
  basePath: string,
  globFileName = '**/*',
  globFileExtension = '*'
): string[] => {
  const globPattern = ConfigFileExtensions.find((extension) =>
    globFileName.endsWith(extension)
  )
    ? globFileName
    : `${globFileName}.${globFileExtension}`

  return glob.sync(globPattern, { cwd: resolve(basePath), absolute: true })
}

export const findConfigFilesAtPath = (
  basePath: string,
  fileName?: string
): string[] =>
  reject(
    isSchema,
    findFiles(basePath, fileName, `{${ConfigFileExtensions.join(',')}}`)
  )
