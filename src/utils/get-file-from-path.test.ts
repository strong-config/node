jest.mock('fs')
jest.mock('js-yaml')

import * as fs from 'fs'
import * as yaml from 'js-yaml'

/*
 * NOTE: Need to import this way because I couldn't figure out how to
 * mock named imports (e.g. `import { blubb } from './dubb'`) with jest.
 * Jest's `spyOn()` function can't be applied to individual functions
 */
import * as x from './get-file-from-path'

describe('readFileToString()', () => {
  const pathToFile = 'some/path/to/file.yaml'
  it('reads correct path', () => {
    jest
      .spyOn(fs, 'readFileSync')
      .mockReturnValueOnce('parsed config in json or yaml format')

    x.readFileToString(pathToFile)

    expect(fs.readFileSync).toHaveBeenCalledWith(pathToFile)
  })

  it('always returns string', () => {
    jest
      .spyOn(fs, 'readFileSync')
      .mockReturnValueOnce(Buffer.from('some buffer'))

    expect(x.readFileToString(pathToFile)).toBe('some buffer')
  })
})

describe('isJson()', () => {
  it('returns true when passed filePath ends with .json', () => {
    expect(x.isJson('/dev/path/to/some/json/file.json')).toBe(true)
  })

  it('returns false when passed filePath does not end with .json', () => {
    expect(x.isJson('/dev/path/to/some/json/file.yml')).toBe(false)
  })
})

describe('parseToJson()', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    jest.spyOn(yaml, 'load').mockReturnValue({ parsed: 'yaml' })
  })

  it('parses YAML if YAML file is passed', () => {
    x.parseToJson('/path/to/json/file.yml')('file: "yaml"')

    expect(yaml.load).toHaveBeenCalledTimes(1)
  })

  it('parses not YAML if JSON file is passed', () => {
    x.parseToJson('/path/to/json/file.json')('{}')

    expect(yaml.load).toHaveBeenCalledTimes(0)
  })
})

describe('getFileFromPath()', () => {
  const innerParse = jest.fn().mockReturnValue({ parsed: 'tojson' })

  beforeEach(() => {
    jest.clearAllMocks()
    jest.spyOn(x, 'readFileToString').mockReturnValue('string')
    jest.spyOn(x, 'parseToJson').mockImplementation(() => innerParse)
  })

  it('reads the file to string', () => {
    x.getFileFromPath('some/path/config.yaml')

    expect(x.readFileToString).toHaveBeenCalledWith('some/path/config.yaml')
  })

  it('parses the string to json', () => {
    x.getFileFromPath('some/path/config.yaml')

    expect(x.parseToJson).toHaveBeenCalledWith('some/path/config.yaml')
    expect(innerParse).toHaveBeenCalledWith('string')
  })

  it('returns the expected file', () => {
    const result = x.getFileFromPath('some/path/config.yaml')

    expect(result).toStrictEqual({
      filePath: 'some/path/config.yaml',
      contents: { parsed: 'tojson' },
    })
  })
})
