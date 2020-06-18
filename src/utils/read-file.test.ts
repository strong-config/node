import fs from 'fs'
import yaml from 'js-yaml'
import type { ConfigFile } from '../types'
import * as findFiles from './find-files'
import * as readFile from './read-file'

const configRoot = 'config'
const configFilePaths = [`${configRoot}/development.yml`]
const configFile: ConfigFile = {
  contents: { parsed: 'values' },
  filePath: configFilePaths[0],
}
const {
  readConfigForEnv,
  readConfigFromPath,
  readSchemaFromConfigRoot,
} = readFile

describe('utils :: read-file', () => {
  describe('readConfigForEnv()', () => {
    beforeEach(() => {
      jest.clearAllMocks()
    })

    afterAll(() => {
      jest.restoreAllMocks()
    })

    describe('given an invalid configRoot', () => {
      it('should throw', () => {
        expect(() =>
          readConfigForEnv('production', '/wrong/config/root')
        ).toThrowError("Couldn't find config file")
      })
    })

    describe('given a config name for which multiple files exist (e.g. development.yaml AND development.json)', () => {
      it('should throw', () => {
        const findFilesResult = [
          'config/development.yml',
          'config/development.json',
        ]
        jest
          .spyOn(findFiles, 'findConfigFilesAtPath')
          .mockReturnValueOnce(findFilesResult)

        expect(() => readConfigForEnv('development', './config')).toThrowError(
          `Duplicate config files detected: ${findFilesResult.join(',')}`
        )
      })
    })

    describe('given a valid config name', () => {
      it('loads the config file', () => {
        jest
          .spyOn(findFiles, 'findConfigFilesAtPath')
          .mockReturnValueOnce(configFilePaths)
        jest.spyOn(fs, 'existsSync').mockReturnValueOnce(true)
        jest.spyOn(fs, 'readFileSync').mockReturnValueOnce('mocked config file')
        jest.spyOn(yaml, 'load').mockReturnValueOnce(configFile.contents)

        expect(readConfigForEnv('development', configRoot)).toStrictEqual(
          configFile
        )
      })
    })
  })

  describe('readConfigFromPath()', () => {
    describe('given an invalid path', () => {
      it('should return undefined', () => {
        expect(
          readSchemaFromConfigRoot('./an/invalid/path/prod.yml')
        ).toBeUndefined()
      })
    })

    describe('given a valid path to a YAML config file', () => {
      const configFileContents = 'parsed: yaml'

      beforeEach(() => {
        jest.clearAllMocks()
        jest.spyOn(yaml, 'load')
        jest.spyOn(JSON, 'parse')
        jest.spyOn(fs, 'readFileSync').mockReturnValueOnce(configFileContents)
        jest.spyOn(fs, 'existsSync').mockReturnValueOnce(true)
      })

      afterAll(() => {
        jest.restoreAllMocks()
      })

      it('returns the expected config file', () => {
        const result = readConfigFromPath('some/path/config.yaml')

        expect(yaml.load).toHaveBeenCalledWith(configFileContents)
        expect(JSON.parse).not.toHaveBeenCalled()

        expect(result).toStrictEqual({
          filePath: 'some/path/config.yaml',
          contents: { parsed: 'yaml' },
        })
      })
    })

    describe('given a valid path to a JSON config file', () => {
      const configFileContents = `{ "parsed": "json" }`

      beforeEach(() => {
        jest.clearAllMocks()
        jest.spyOn(yaml, 'load')
        jest.spyOn(JSON, 'parse')
        jest.spyOn(fs, 'readFileSync').mockReturnValueOnce(configFileContents)
        jest.spyOn(fs, 'existsSync').mockReturnValueOnce(true)
      })

      afterAll(() => {
        jest.restoreAllMocks()
      })

      it('returns the expected config file', () => {
        const result = readConfigFromPath('some/path/config.json')

        expect(JSON.parse).toHaveBeenCalledWith(configFileContents)
        expect(yaml.load).not.toHaveBeenCalled()

        expect(result).toStrictEqual({
          filePath: 'some/path/config.json',
          contents: { parsed: 'json' },
        })
      })
    })
  })

  describe('readSchemaFromConfigRoot()', () => {
    beforeEach(() => {
      jest.clearAllMocks()
    })

    describe('given a config root WITHOUT an existing schema.json', () => {
      it('returns undefined when input is not a JSON file', () => {
        jest.spyOn(fs, 'existsSync').mockReturnValueOnce(false)

        expect(readSchemaFromConfigRoot('not-a-json-file.yaml')).toBeUndefined()
      })
    })

    describe('given a config root WITH an existing schema.json', () => {
      it('returns the parsed schema file', () => {
        jest.spyOn(fs, 'existsSync').mockReturnValueOnce(true)
        jest
          .spyOn(fs, 'readFileSync')
          .mockReturnValueOnce(JSON.stringify({ mocked: 'schema' }))

        expect(readSchemaFromConfigRoot('config')).toEqual({ mocked: 'schema' })
      })
    })
  })
})
