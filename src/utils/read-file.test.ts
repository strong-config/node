jest.mock('glob')
jest.mock('fs')
jest.mock('js-yaml')
import glob from 'glob'
import fs from 'fs'
import yaml from 'js-yaml'
const mockedGlob = glob as jest.Mocked<typeof glob>
const mockedFs = fs as jest.Mocked<typeof fs>
const mockedYaml = yaml as jest.Mocked<typeof yaml>

const mockedFilenames = ['config/development.yml']
const mockedReadFile = 'result'
mockedGlob.sync = jest.fn().mockReturnValue(mockedFilenames)
mockedFs.readFileSync = jest
  .fn()
  .mockReturnValue('parsed config in json or yaml format')
mockedYaml.load = jest.fn().mockReturnValue(mockedReadFile)

import { NoFileError, readConfigFile, readSchemaFile } from './read-file'

describe('readConfigFile behaves as expected', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('throws when filename is nil', () => {
    expect(() => readConfigFile(undefined)).toThrow(
      /Config file name must not be nil/
    )
  })

  it('throws NoFileError when files array is empty', () => {
    mockedGlob.sync.mockReturnValueOnce([])

    expect(() => readConfigFile('config')).toThrow(NoFileError)
  })

  it('throws when files array contains more than one match', () => {
    mockedGlob.sync.mockReturnValueOnce([
      ...mockedFilenames,
      'config/anotherfile.yaml',
    ])

    expect(() => readConfigFile('config')).toThrow(/Exactly one must exist/)
  })

  it('reads file when exactly one config is found', () => {
    readConfigFile('config')

    expect(mockedFs.readFileSync).toHaveBeenCalledWith(mockedFilenames[0])
  })

  it('parses file as YAML when the file extension is yml|yaml', () => {
    readConfigFile('config')

    expect(mockedYaml.load).toHaveBeenCalledTimes(1)
  })

  it('parses file not as YAML when the file extension is not yml|yaml', () => {
    mockedGlob.sync.mockReturnValueOnce(['config/development.json'])
    mockedFs.readFileSync.mockReturnValueOnce('{ "some": "value"}')

    readConfigFile('config')

    expect(mockedYaml.load).toHaveBeenCalledTimes(0)
  })

  it('returns parsed file', () => {
    expect(readConfigFile('config')).toEqual({
      contents: mockedReadFile,
      filePath: mockedFilenames[0],
    })
  })
})

describe('readSchemaFile behaves as expected', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('returns undefined and does not throw NoFileError when files array is empty', () => {
    mockedGlob.sync.mockReturnValueOnce([])

    expect(readSchemaFile('schema')).toBeUndefined()
  })

  it('throws when files array contains more than one match', () => {
    mockedGlob.sync.mockReturnValueOnce([
      ...mockedFilenames,
      'config/anotherschema.json',
    ])

    expect(() => readSchemaFile('schema')).toThrow(/Exactly one must exist/)
  })

  it('returns parsed schema', () => {
    expect(readSchemaFile('schema')).toEqual({
      contents: mockedReadFile,
      filePath: mockedFilenames[0],
    })
  })
})
