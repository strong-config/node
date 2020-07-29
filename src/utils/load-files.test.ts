import fs from 'fs'
import fastGlob from 'fast-glob'
import yaml from 'js-yaml'
import type { EncryptedConfigFile } from '../types'
import * as readFiles from './load-files'

const { loadConfigForEnv, loadConfigFromPath, loadSchema } = readFiles

describe('utils :: read-file', () => {
  const configRoot = 'config'

  describe('loadConfigForEnv()', () => {
    beforeEach(() => {
      jest.clearAllMocks()
    })

    afterAll(() => {
      jest.restoreAllMocks()
    })

    describe('given an invalid configRoot', () => {
      it('should throw', () => {
        expect(() =>
          loadConfigForEnv('production', '/wrong/config/root')
        ).toThrowError("Couldn't find config file")
      })
    })

    describe('given a config name for which multiple files exist (e.g. development.yaml AND development.json)', () => {
      it('should throw', () => {
        const multipleConfigFiles = [
          'config/development.yml',
          'config/development.json',
        ]
        jest.spyOn(fastGlob, 'sync').mockReturnValueOnce(multipleConfigFiles)

        expect(() => loadConfigForEnv('development', './config')).toThrowError(
          `Duplicate config files detected: ${multipleConfigFiles.join(',')}`
        )
      })
    })

    describe('given a valid config name', () => {
      it('loads the config file', () => {
        const oneConfigFile = [`${configRoot}/development.yml`]
        const configFile: EncryptedConfigFile = {
          contents: { parsed: 'values' },
          filePath: oneConfigFile[0],
        }
        jest.spyOn(fastGlob, 'sync').mockReturnValueOnce(oneConfigFile)
        jest.spyOn(fs, 'existsSync').mockReturnValueOnce(true)
        jest.spyOn(fs, 'readFileSync').mockReturnValueOnce('mocked config file')
        jest.spyOn(yaml, 'load').mockReturnValueOnce(configFile.contents)

        expect(loadConfigForEnv('development', configRoot)).toStrictEqual(
          configFile
        )
      })
    })
  })

  describe('loadConfigFromPath()', () => {
    describe('given an invalid path', () => {
      it('should return undefined', () => {
        expect(loadSchema('./an/invalid/path/prod.yml')).toBeUndefined()
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
        const result = loadConfigFromPath('some/path/config.yaml')

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
        jest.spyOn(fs, 'existsSync').mockReturnValueOnce(true)
        jest.spyOn(fs, 'readFileSync').mockReturnValueOnce(configFileContents)
      })

      afterAll(() => {
        jest.restoreAllMocks()
      })

      it('returns the expected config file', () => {
        const result = loadConfigFromPath('some/path/config.json')

        expect(JSON.parse).toHaveBeenCalledWith(configFileContents)
        expect(yaml.load).not.toHaveBeenCalled()

        expect(result).toStrictEqual({
          filePath: 'some/path/config.json',
          contents: { parsed: 'json' },
        })
      })
    })

    describe('given a valid path to a file that is neither JSON nor YAML', () => {
      afterAll(() => {
        jest.restoreAllMocks()
      })

      it('should throw, because we only support JSON and YAML config files', () => {
        jest.spyOn(fs, 'existsSync').mockReturnValueOnce(true)
        const configPath = 'some/path/config.xml'

        expect(() => loadConfigFromPath(configPath)).toThrowError(
          `Unsupported file: ${configPath}. Only JSON and YAML config files are supported.`
        )
      })
    })
  })

  describe('loadSchema()', () => {
    beforeEach(() => {
      jest.clearAllMocks()
    })

    describe('given a config root WITHOUT an existing schema.json', () => {
      it('returns undefined when input is not a JSON file', () => {
        jest.spyOn(fs, 'existsSync').mockReturnValueOnce(false)

        expect(loadSchema('not-a-json-file.yaml')).toBeUndefined()
      })
    })

    describe('given a config root WITH an existing schema.json', () => {
      it('returns the parsed schema file and hydrates it with the runtimeEnv', () => {
        jest.spyOn(fs, 'existsSync').mockReturnValueOnce(true)
        jest
          .spyOn(fs, 'readFileSync')
          .mockReturnValueOnce(JSON.stringify({ mocked: 'schema' }))

        expect(loadSchema('config')).toEqual({
          mocked: 'schema',
          properties: { runtimeEnv: { type: 'string' } },
        })
      })
    })
  })
})
