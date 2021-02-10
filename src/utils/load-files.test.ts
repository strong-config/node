import fs from 'fs'
import fastGlob from 'fast-glob'
import yaml from 'js-yaml'
import type { EncryptedConfigFile } from '../types'
import { defaultOptions } from '../options'
import * as loadFiles from './load-files'
import { loadBaseConfig } from './load-files'

const { loadConfigForEnv, loadConfigFromPath, loadSchema } = loadFiles

describe('utils :: load-files', () => {
  const configRoot = 'config'

  describe('loadConfigForEnv()', () => {
    afterEach(() => {
      jest.restoreAllMocks()
    })

    describe('without a base config', () => {
      beforeEach(() => {
        jest.spyOn(loadFiles, 'loadBaseConfig').mockImplementation(() => ({}))
      })

      describe('given an invalid configRoot', () => {
        it('should throw', () => {
          expect(() =>
            loadConfigForEnv('production', '/wrong/config/root')
          ).toThrow("Couldn't find config file")
        })
      })

      describe('given a config name for which multiple files exist (e.g. development.yaml AND development.json)', () => {
        it('should throw', () => {
          const multipleConfigFiles = [
            'config/development.yml',
            'config/development.json',
          ]
          jest.spyOn(fastGlob, 'sync').mockReturnValueOnce(multipleConfigFiles)

          expect(() => loadConfigForEnv('development', './config')).toThrow(
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
          jest.spyOn(fastGlob, 'sync').mockReturnValue(oneConfigFile)
          jest.spyOn(fs, 'existsSync').mockReturnValue(true)
          jest.spyOn(fs, 'readFileSync').mockReturnValue('mocked config file')
          jest.spyOn(yaml, 'load').mockReturnValue(configFile.contents)

          expect(loadConfigForEnv('development', configRoot)).toStrictEqual(
            configFile
          )
        })
      })

      describe('given a runtimeEnv name that is identical to the base config name', () => {
        it('should throw because base config and env-specific config need to be different files', () => {
          const oneConfigFile = [`${configRoot}/development.yml`]
          const configFile: EncryptedConfigFile = {
            contents: { parsed: 'values' },
            filePath: oneConfigFile[0],
          }
          jest.spyOn(fastGlob, 'sync').mockReturnValue(oneConfigFile)
          jest.spyOn(fs, 'existsSync').mockReturnValue(true)
          jest.spyOn(fs, 'readFileSync').mockReturnValue('mocked config file')
          jest.spyOn(yaml, 'load').mockReturnValue(configFile.contents)

          expect(() => {
            loadConfigForEnv('development', configRoot, 'development.yml')
          }).toThrow(
            "Base config name 'development.yml' must be different from the environment-name 'development'. Base config and env-specific config can't be the same file."
          )
        })
      })
    })

    describe('with a base config', () => {
      describe('given a valid config name', () => {
        it('loads the config file, extended from the base config', () => {
          const baseConfig = { base: 'config' }
          const oneConfigFile = [`${configRoot}/development.yml`]
          const configFile: EncryptedConfigFile = {
            contents: { parsed: 'values' },
            filePath: oneConfigFile[0],
          }
          const mergedConfig = {
            contents: { ...baseConfig, ...configFile.contents },
            filePath: oneConfigFile[0],
          }

          jest.spyOn(loadFiles, 'loadBaseConfig').mockImplementation(() => ({
            base: 'config',
          }))
          jest.spyOn(fastGlob, 'sync').mockReturnValueOnce(oneConfigFile)
          jest.spyOn(fs, 'existsSync').mockReturnValueOnce(true)
          jest
            .spyOn(fs, 'readFileSync')
            .mockReturnValueOnce('mocked config file')
          jest.spyOn(yaml, 'load').mockReturnValueOnce(configFile.contents)

          expect(loadConfigForEnv('development', configRoot)).toStrictEqual(
            mergedConfig
          )
        })
      })
    })
  })

  describe('loadConfigFromPath()', () => {
    afterEach(() => {
      jest.restoreAllMocks()
    })

    describe('without a base config', () => {
      beforeEach(() => {
        jest.spyOn(loadFiles, 'loadBaseConfig').mockImplementation(() => ({}))
      })

      describe('given an invalid path', () => {
        it('should return undefined', () => {
          expect(loadSchema('./an/invalid/path/prod.yml')).toBeUndefined()
        })
      })

      describe('given a valid path to a YAML config file', () => {
        const configFileContents = 'parsed: yaml'

        beforeEach(() => {
          jest.spyOn(yaml, 'load')
          jest.spyOn(JSON, 'parse')
          jest.spyOn(fs, 'readFileSync').mockReturnValueOnce(configFileContents)
          jest.spyOn(fs, 'existsSync').mockReturnValueOnce(true)
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
          jest.spyOn(yaml, 'load')
          jest.spyOn(JSON, 'parse')
          jest.spyOn(fs, 'existsSync').mockReturnValueOnce(true)
          jest.spyOn(fs, 'readFileSync').mockReturnValueOnce(configFileContents)
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
        it('should throw, because we only support JSON and YAML config files', () => {
          jest.spyOn(fs, 'existsSync').mockReturnValue(true)
          const configPath = 'some/path/config.xml'

          expect(() => loadConfigFromPath(configPath)).toThrow(
            `Unsupported file: ${configPath}. Only JSON and YAML config files are supported.`
          )
        })
      })
    })

    describe('with a base config', () => {
      describe('given a valid path to a YAML config file', () => {
        it('returns the expected config file merged with the base config', () => {
          const baseConfig = { base: 'config' }
          const configFileContents = 'parsed: yaml'
          const mergedConfig = { base: 'config', parsed: 'yaml' }
          jest
            .spyOn(loadFiles, 'loadBaseConfig')
            .mockImplementation(() => baseConfig)
          jest.spyOn(yaml, 'load')
          jest.spyOn(fs, 'readFileSync').mockReturnValue(configFileContents)
          jest.spyOn(fs, 'existsSync').mockReturnValue(true)

          const result = loadConfigFromPath('some/path/config.yaml')

          expect(yaml.load).toHaveBeenCalledWith(configFileContents)

          expect(result).toStrictEqual({
            filePath: 'some/path/config.yaml',
            contents: mergedConfig,
          })
        })

        it('gives precedence to the env-specific config over the base config', () => {
          const baseConfig = {
            base: 'config',
            override: 'base value',
            deeply: {
              nested: { override: 'base value', noOverride: 'same-same' },
            },
          }
          const configFileContents = `
parsed: yaml
override: env-specific value
deeply:
  nested:
    override: env-specific value
`
          const mergedConfig = {
            base: 'config',
            parsed: 'yaml',
            override: 'env-specific value',
            deeply: {
              nested: {
                override: 'env-specific value',
                noOverride: 'same-same',
              },
            },
          }
          jest
            .spyOn(loadFiles, 'loadBaseConfig')
            .mockImplementation(() => baseConfig)
          jest.spyOn(fs, 'readFileSync').mockReturnValue(configFileContents)
          jest.spyOn(fs, 'existsSync').mockReturnValue(true)

          const result = loadConfigFromPath('some/path/config.yaml')

          expect(result).toStrictEqual({
            filePath: 'some/path/config.yaml',
            contents: mergedConfig,
          })
        })
      })
    })
  })

  describe('loadBaseConfig()', () => {
    afterEach(() => {
      jest.restoreAllMocks()
    })

    describe('given an existing base config file', () => {
      it('should load the base config', () => {
        jest.spyOn(fs, 'existsSync').mockReturnValueOnce(true)
        jest.spyOn(fs, 'readFileSync').mockReturnValueOnce('base: config')

        const baseConfig = { base: 'config' }
        const result = loadBaseConfig(configRoot, defaultOptions.baseConfig)

        expect(result).toStrictEqual(baseConfig)
      })

      it('should allow customising the base config filename', () => {
        jest.spyOn(fs, 'existsSync').mockReturnValueOnce(true)
        jest.spyOn(fs, 'readFileSync').mockReturnValueOnce('base: config')

        const baseConfig = { base: 'config' }
        const result = loadBaseConfig(configRoot, 'my-custom-base.yaml')

        expect(result).toStrictEqual(baseConfig)
      })
    })

    describe('given a non-existing base config file', () => {
      it('should return an empty object', () => {
        jest.spyOn(fs, 'existsSync').mockReturnValueOnce(false)

        const result = loadBaseConfig(configRoot, defaultOptions.baseConfig)

        expect(result).toStrictEqual({})
      })
    })

    describe('given a base config file with secrets', () => {
      it('should throw because base configs can not contain secrets because it is not clear which encryption key should be used to encrypt them', () => {
        jest.spyOn(fs, 'existsSync').mockReturnValueOnce(true)
        jest
          .spyOn(fs, 'readFileSync')
          .mockReturnValueOnce('baseSecret: you-can-not-encrypt-me')

        expect(() => {
          loadBaseConfig(configRoot, defaultOptions.baseConfig)
        }).toThrow(
          `Secret detected in ${configRoot}/${defaultOptions.baseConfig} config. Base config files can not contain secrets because when using different encryption keys per environment, it's unclear which key should be used to encrypt the base config.`
        )
      })
    })
  })

  describe('loadSchema()', () => {
    afterEach(() => {
      jest.restoreAllMocks()
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

        expect(loadSchema('config')).toStrictEqual({
          mocked: 'schema',
          properties: { runtimeEnv: { type: 'string' } },
        })
      })
    })
  })
})
