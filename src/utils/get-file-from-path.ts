import { readFileSync } from 'fs'
import { compose } from 'ramda'
import yaml from 'js-yaml'
import type { JSONObject, ConfigFile, SchemaFile } from '../types'

export const readFileToString = (filePath: string): string =>
  readFileSync(filePath).toString()

export const parseToJson = (filePath: string) => (
  fileAsString: string
): JSONObject =>
  // If the file extension isn't .json, then it HAS to be YAML as this is the only other filetype we support
  // eslint-disable-next-line @typescript-eslint/no-unsafe-return
  filePath.split('.').pop() === 'json'
    ? JSON.parse(fileAsString)
    : yaml.load(fileAsString)

export const getFileFromPath = (filePath: string): ConfigFile | SchemaFile =>
  compose<string, string, JSONObject, ConfigFile | SchemaFile>(
    (contents) => ({ contents, filePath }),
    parseToJson(filePath),
    readFileToString
  )(filePath)
