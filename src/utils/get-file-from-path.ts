import R from 'ramda'
import fs from 'fs'
import yaml from 'js-yaml'

import { File } from './read-file'

export const readFileToString = (filePath: string): string =>
  fs.readFileSync(filePath).toString()

export const isJson = R.compose<string, string[], string, boolean>(
  R.equals('json'),
  R.last,
  R.split('.')
)

export const parseToJson = (filePath: string) => (
  fileAsString: string
): JSONObject =>
  isJson(filePath) ? JSON.parse(fileAsString) : yaml.load(fileAsString)

export const getFileFromPath = (filePath: string): File =>
  R.compose<string, string, JSONObject, File>(
    contents => ({ contents, filePath }),
    parseToJson(filePath),
    readFileToString
  )(filePath)
