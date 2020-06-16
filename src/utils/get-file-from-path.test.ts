jest.mock('fs')
jest.mock('js-yaml')

import * as fs from 'fs'
import * as yaml from 'js-yaml'
import * as getFileFromPathModule from './get-file-from-path'

describe('utils :: get-file-from-path', () => {
  describe('readFileToString()', () => {
    const pathToFile = 'some/path/to/file.yaml'
    it('reads correct path', () => {
      jest
        .spyOn(fs, 'readFileSync')
        .mockReturnValueOnce('parsed config in json or yaml format')

      getFileFromPathModule.readFileToString(pathToFile)

      expect(fs.readFileSync).toHaveBeenCalledWith(pathToFile)
    })

    it('always returns string', () => {
      jest
        .spyOn(fs, 'readFileSync')
        .mockReturnValueOnce(Buffer.from('some buffer'))

      expect(getFileFromPathModule.readFileToString(pathToFile)).toBe(
        'some buffer'
      )
    })
  })

  describe('parseToJson()', () => {
    beforeEach(() => {
      jest.clearAllMocks()
      jest.spyOn(yaml, 'load').mockReturnValue({ parsed: 'yaml' })
    })

    it('parses YAML if YAML file is passed', () => {
      getFileFromPathModule.parseToJson('/path/to/json/file.yml')(
        'file: "yaml"'
      )

      expect(yaml.load).toHaveBeenCalledTimes(1)
    })

    it('parses not YAML if JSON file is passed', () => {
      getFileFromPathModule.parseToJson('/path/to/json/file.json')('{}')

      expect(yaml.load).toHaveBeenCalledTimes(0)
    })
  })

  describe('getFileFromPath()', () => {
    const innerParse = jest.fn().mockReturnValue({ parsed: 'tojson' })

    beforeEach(() => {
      jest.clearAllMocks()
      jest
        .spyOn(getFileFromPathModule, 'readFileToString')
        .mockReturnValue('string')
      jest
        .spyOn(getFileFromPathModule, 'parseToJson')
        .mockReturnValue(innerParse)
    })

    it('reads the file to string', () => {
      getFileFromPathModule.getFileFromPath('some/path/config.yaml')

      expect(getFileFromPathModule.readFileToString).toHaveBeenCalledWith(
        'some/path/config.yaml'
      )
    })

    it('parses the string to json', () => {
      getFileFromPathModule.getFileFromPath('some/path/config.yaml')

      expect(getFileFromPathModule.parseToJson).toHaveBeenCalledWith(
        'some/path/config.yaml'
      )
      expect(innerParse).toHaveBeenCalledWith('string')
    })

    it('returns the expected file', () => {
      const result = getFileFromPathModule.getFileFromPath(
        'some/path/config.yaml'
      )

      expect(result).toStrictEqual({
        filePath: 'some/path/config.yaml',
        contents: { parsed: 'tojson' },
      })
    })
  })
})
