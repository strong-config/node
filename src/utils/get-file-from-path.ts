import { equals, last, split, compose } from 'ramda'
import { readFileSync } from 'fs'
import { load } from 'js-yaml'

import { JSONObject } from '../types'
import { File } from './read-file'

export const readFileToString = (filePath: string): string =>
  readFileSync(filePath).toString()

export const isJson = compose<string, string[], string, boolean>(
  equals('json'),
  last,
  split('.')
)

export const parseToJson = (filePath: string) => (
  fileAsString: string
): JSONObject =>
  isJson(filePath) ? JSON.parse(fileAsString) : load(fileAsString)

export const getFileFromPath = (filePath: string): File =>
  compose<string, string, JSONObject, File>(
    contents => ({ contents, filePath }),
    parseToJson(filePath),
    readFileToString
  )(filePath)

export default getFileFromPath
