import { readFileSync } from 'fs'
import { compose, equals, last, split } from 'ramda'
import yaml from 'js-yaml'

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
  /*
   * The isJson() method checks that the input is safely parseable JSON.
   * If it's not JSON, it has to be YAML as this is the only other filetype we support
   */
  // eslint-disable-next-line @typescript-eslint/no-unsafe-return
  isJson(filePath) ? JSON.parse(fileAsString) : yaml.load(fileAsString)

export const getFileFromPath = (filePath: string): File =>
  compose<string, string, JSONObject, File>(
    (contents) => ({ contents, filePath }),
    parseToJson(filePath),
    readFileToString
  )(filePath)
