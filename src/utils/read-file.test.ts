import fs from 'fs'
import type { ConfigFile } from '../types'
import { findConfigFilesAtPath } from './find-files'
import { getFileFromPath } from './get-file-from-path'
import { readConfigFile, readSchemaFile } from './read-file'

const configFilePathsMock = ['config/development.yml']
const configFileMock: ConfigFile = {
  contents: { parsed: 'values' },
  filePath: configFilePathsMock[0],
}

jest.mock('fs')
jest.mock('./find-files')
jest.mock('./get-file-from-path', () => ({
  getFileFromPath: jest.fn(() => configFileMock),
}))

const findConfigFilesAtPathMock = findConfigFilesAtPath as jest.MockedFunction<
  typeof findConfigFilesAtPath
>
findConfigFilesAtPathMock.mockReturnValue(configFilePathsMock)

const existsSyncMock = fs.existsSync as jest.MockedFunction<
  typeof fs.existsSync
>

describe('readConfigFile()', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('passes arguments to findConfigFilesAtPath', () => {
    readConfigFile('config', 'smth')

    expect(findConfigFilesAtPathMock).toHaveBeenCalledWith('config', 'smth')
  })

  it('throws when files array is empty', () => {
    findConfigFilesAtPathMock.mockReturnValueOnce([])

    expect(() => readConfigFile('config', 'smth')).toThrow(
      /One of these files must exist/
    )
  })

  it('throws when files array contains more than one match', () => {
    findConfigFilesAtPathMock.mockReturnValueOnce([
      ...configFilePathsMock,
      'config/anotherfile.yaml',
    ])

    expect(() => readConfigFile('config', 'development')).toThrow(
      /Exactly one must exist/
    )
  })

  it('reads file when exactly one config is found', () => {
    readConfigFile('dev/config', 'development')

    expect(getFileFromPath).toHaveBeenCalledWith(configFilePathsMock[0])
  })

  it('returns result of getFileFromPath', () => {
    expect(readConfigFile('dev/config', 'development')).toEqual(configFileMock)
  })
})

describe('readSchemaFile()', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('given a config root without an existing schema.json', () => {
    it('returns undefined when input is not a JSON file', () => {
      existsSyncMock.mockReturnValueOnce(false)
      expect(readSchemaFile('not-a-json-file.yaml')).toBeUndefined()
    })
  })

  describe('given a config root with an existing schema.json', () => {
    it('returns the parsed schema file', () => {
      existsSyncMock.mockReturnValueOnce(true)
      expect(readSchemaFile('config')).toEqual(configFileMock)
    })
  })
})
