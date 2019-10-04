jest.mock('fs')
jest.mock('js-yaml')

import fs from 'fs'
import yaml from 'js-yaml'

const mockedFs = fs as jest.Mocked<typeof fs>
const mockedYaml = yaml as jest.Mocked<typeof yaml>

mockedFs.readFileSync = jest
  .fn()
  .mockReturnValue('parsed config in json or yaml format')
mockedYaml.load = jest.fn().mockReturnValue({ parsed: 'yaml' })
const pathToFile = 'some/path/to/file.yaml'

import {
  readFileToString,
  isJson,
  getFileFromPath,
  parseToJson,
} from './get-file-from-path'

describe('readFileToString()', () => {
  it('reads correct path', () => {
    readFileToString(pathToFile)

    expect(mockedFs.readFileSync).toHaveBeenCalledWith(pathToFile)
  })

  it('always returns string', () => {
    mockedFs.readFileSync.mockReturnValueOnce(Buffer.from('some buffer'))

    expect(readFileToString(pathToFile)).toBe('some buffer')
  })
})

describe('isJson()', () => {
  it('returns true when passed filePath ends with .json', () => {
    expect(isJson('/dev/path/to/some/json/file.json')).toBe(true)
  })

  it('returns false when passed filePath does not end with .json', () => {
    expect(isJson('/dev/path/to/some/json/file.yml')).toBe(false)
  })
})

describe('parseToJson()', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('parses YAML if YAML file is passed', () => {
    parseToJson('/path/to/json/file.yml')('file: "yaml"')

    expect(mockedYaml.load).toHaveBeenCalledTimes(1)
  })

  it('parses not YAML if JSON file is passed', () => {
    parseToJson('/path/to/json/file.json')('{}')

    expect(mockedYaml.load).toHaveBeenCalledTimes(0)
  })
})

describe('getFileFromPath()', () => {
  const innerParse = jest.fn().mockReturnValue({ parsed: 'tojson' })

  beforeAll(() => {
    readFileToString = jest.fn().mockReturnValue('string')
    parseToJson = jest.fn(() => innerParse)
  })

  it('reads the file to string', () => {
    getFileFromPath('some/path/config.yaml')

    expect(readFileToString).toHaveBeenCalledWith('some/path/config.yaml')
  })

  it('parses the string to json', () => {
    getFileFromPath('some/path/config.yaml')

    expect(parseToJson).toHaveBeenCalledWith('some/path/config.yaml')
    expect(innerParse).toHaveBeenCalledWith('string')
  })

  it('returns the expected file', () => {
    const result = getFileFromPath('some/path/config.yaml')

    expect(result).toStrictEqual({
      filePath: 'some/path/config.yaml',
      contents: { parsed: 'tojson' },
    })
  })
})
