import fs from 'fs'
import type { ConfigFile } from '../types'
import { findConfigFilesAtPath } from './find-files'
import { getFileFromPath } from './get-file-from-path'
import { readConfigFile, readSchemaFile } from './read-file'

jest.mock('fs')
jest.mock('./find-files')
const configFilePaths = ['config/development.yml']
const configFile: ConfigFile = {
  contents: { parsed: 'values' },
  filePath: configFilePaths[0],
}
jest.mock('./get-file-from-path', () => ({
  getFileFromPath: jest.fn(() => configFile),
}))

describe('utils :: read-file', () => {
  describe('readConfigFile()', () => {
    const findConfigFilesAtPathMock = findConfigFilesAtPath as jest.MockedFunction<
      typeof findConfigFilesAtPath
    >
    findConfigFilesAtPathMock.mockReturnValue(configFilePaths)

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
        ...configFilePaths,
        'config/anotherfile.yaml',
      ])

      expect(() => readConfigFile('config', 'development')).toThrow(
        /Exactly one must exist/
      )
    })

    it('reads file when exactly one config is found', () => {
      readConfigFile('dev/config', 'development')

      expect(getFileFromPath).toHaveBeenCalledWith(configFilePaths[0])
    })

    it('returns result of getFileFromPath', () => {
      expect(readConfigFile('dev/config', 'development')).toEqual(configFile)
    })
  })

  describe('readSchemaFile()', () => {
    const existsSyncMock = fs.existsSync as jest.MockedFunction<
      typeof fs.existsSync
    >

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
        expect(readSchemaFile('config')).toEqual(configFile)
      })
    })
  })
})
