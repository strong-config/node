/* eslint-disable @typescript-eslint/unbound-method */
import Ajv from 'ajv'
import { optionsSchema, defaultOptions } from '../options'
import * as readFiles from '../utils/load-files'
import * as sops from '../utils/sops'
import {
  validOptions,
  encryptedConfigFile,
  decryptedConfig,
  hydratedConfig,
  schema,
} from '../fixtures'
import * as hydrateConfigModule from './../utils/hydrate-config'

// Needed for commonjs-compatibility
// eslint-disable-next-line @typescript-eslint/no-require-imports
import StrongConfig = require('.')

jest.mock('../utils/generate-types-from-schema')

describe('StrongConfig.getConfig()', () => {
  const OLD_ENV = process.env
  const runtimeEnv = 'development'

  jest.spyOn(console, 'info').mockReturnValue()
  const loadConfigForEnv = jest.spyOn(readFiles, 'loadConfigForEnv')
  const loadSchema = jest.spyOn(readFiles, 'loadSchema')
  const decryptToObject = jest.spyOn(sops, 'decryptToObject')
  const hydrateConfig = jest.spyOn(hydrateConfigModule, 'hydrateConfig')

  beforeEach(() => {
    jest.clearAllMocks()
    process.env[defaultOptions.runtimeEnvName] = runtimeEnv
    loadConfigForEnv.mockReturnValue(encryptedConfigFile)
    decryptToObject.mockReturnValue(decryptedConfig)
    loadSchema.mockReturnValue(schema)
    hydrateConfig.mockReturnValue(hydratedConfig)
  })

  afterAll(() => {
    process.env = OLD_ENV
    jest.restoreAllMocks()
  })

  describe('upon first invocation, when config is not memoized yet', () => {
    it('loads the config file from disk, based on runtimeEnv', () => {
      new StrongConfig(validOptions)

      expect(loadConfigForEnv).toHaveBeenCalledWith(
        runtimeEnv,
        validOptions.configRoot,
        validOptions.baseConfig
      )
    })

    it('decrypts the loaded config file', () => {
      new StrongConfig(validOptions)

      expect(sops.decryptToObject).toHaveBeenCalledWith(
        encryptedConfigFile.filePath,
        encryptedConfigFile.contents
      )
    })

    it('hydrates the config object', () => {
      new StrongConfig(validOptions)

      expect(hydrateConfig).toHaveBeenCalledWith(decryptedConfig, runtimeEnv)
    })

    describe('when a schema exists', () => {
      it('should validate the loaded config against the schema', () => {
        jest.spyOn(Ajv.prototype, 'validate').mockReturnValue(true)
        jest.spyOn(StrongConfig.prototype, 'validate')

        const sc = new StrongConfig(validOptions)

        expect(sc.validate).toHaveBeenCalledTimes(2)
        expect(sc.validate).toHaveBeenNthCalledWith(
          1,
          validOptions,
          optionsSchema
        )

        expect(sc.validate).toHaveBeenNthCalledWith(2, hydratedConfig, schema)
      })

      it('should trigger type generation', () => {
        jest.spyOn(StrongConfig.prototype, 'generateTypes')

        const sc = new StrongConfig(validOptions)

        expect(sc.generateTypes).toHaveBeenCalledTimes(1)
      })
    })
  })

  describe('after first invocation, when config is memoized', () => {
    it('should NOT load config file from disk and return memoized config directly', () => {
      const sc = new StrongConfig(validOptions)
      const firstLoadResult = sc.getConfig()

      expect(loadConfigForEnv).toHaveBeenCalled()
      expect(sops.decryptToObject).toHaveBeenCalled()
      expect(hydrateConfig).toHaveBeenCalled()

      jest.clearAllMocks()

      const secondLoadResult = sc.getConfig()

      expect(loadConfigForEnv).not.toHaveBeenCalled()
      expect(sops.decryptToObject).not.toHaveBeenCalled()
      expect(hydrateConfig).not.toHaveBeenCalled()

      expect(firstLoadResult).toStrictEqual(secondLoadResult)
    })
  })
})
