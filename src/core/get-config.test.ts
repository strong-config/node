/* eslint-disable @typescript-eslint/unbound-method */
import Ajv from 'ajv'
import { optionsSchema, defaultOptions } from '../options'
import * as readFiles from '../utils/read-files'
import * as sops from '../utils/sops'
import {
  validOptions,
  encryptedConfigFile,
  decryptedConfig,
  hydratedConfig,
  schema,
} from '../fixtures'
import * as hydrateConfigModule from './../utils/hydrate-config'
import StrongConfig = require('.')

jest.mock('../utils/generate-types-from-schema')

describe('StrongConfig.getConfig()', () => {
  const OLD_ENV = process.env
  const runtimeEnv = 'development'

  jest.spyOn(console, 'info').mockReturnValue()
  const readConfig = jest.spyOn(readFiles, 'readConfig')
  const loadSchema = jest.spyOn(readFiles, 'loadSchema')
  const decryptToObject = jest.spyOn(sops, 'decryptToObject')
  const hydrateConfig = jest.spyOn(hydrateConfigModule, 'hydrateConfig')
  const innerHydrateFunction = jest.fn().mockReturnValue(hydratedConfig)

  beforeEach(() => {
    jest.clearAllMocks()
    process.env[defaultOptions.runtimeEnvName] = runtimeEnv
    readConfig.mockReturnValue(encryptedConfigFile)
    decryptToObject.mockReturnValue(decryptedConfig)
    loadSchema.mockReturnValue(schema)
    hydrateConfig.mockReturnValue(innerHydrateFunction)
  })

  afterAll(() => {
    process.env = OLD_ENV
    jest.restoreAllMocks()
  })

  describe('upon first invocation, when config is not memoized yet', () => {
    it('loads the config file from disk, based on runtimeEnv', () => {
      new StrongConfig(validOptions)

      expect(readConfig).toHaveBeenCalledWith(
        runtimeEnv,
        validOptions.configRoot
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

      expect(hydrateConfig).toHaveBeenCalledWith(runtimeEnv, validOptions)
      expect(innerHydrateFunction).toHaveBeenCalledWith(decryptedConfig)
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

    describe('when NO schema exists', () => {
      it('should skip validation', () => {
        // eslint-disable-next-line unicorn/no-useless-undefined
        loadSchema.mockReturnValueOnce(undefined)
        jest.spyOn(StrongConfig.prototype, 'validate')

        const sc = new StrongConfig(validOptions)

        // The first call to StrongConfig.validate() happens in the constructor to validate the options
        expect(sc.validate).toHaveBeenCalledTimes(1)
        expect(sc.validate).toHaveBeenCalledWith(validOptions, optionsSchema)

        // The second time would have been the call to validate the actual config which should not happen without a schema
        expect(sc.validate).not.toHaveBeenCalledTimes(2)
      })

      it('should skip type generation', () => {
        jest
          .spyOn(StrongConfig.prototype, 'getSchema')
          // eslint-disable-next-line unicorn/no-null
          .mockReturnValue(null)
        jest.spyOn(StrongConfig.prototype, 'generateTypes')
        const sc = new StrongConfig(validOptions)

        expect(sc.generateTypes).not.toHaveBeenCalled()
      })
    })
  })

  describe('after first invocation, when config is memoized', () => {
    it('should NOT load config file from disk and return memoized config directly', () => {
      const sc = new StrongConfig(validOptions)
      const firstLoadResult = sc.getConfig()
      expect(readConfig).toHaveBeenCalled()
      expect(sops.decryptToObject).toHaveBeenCalled()
      expect(hydrateConfig).toHaveBeenCalled()

      jest.clearAllMocks()

      const secondLoadResult = sc.getConfig()
      expect(readConfig).not.toHaveBeenCalled()
      expect(sops.decryptToObject).not.toHaveBeenCalled()
      expect(hydrateConfig).not.toHaveBeenCalled()

      expect(firstLoadResult).toStrictEqual(secondLoadResult)
    })

    describe('when a schema exists', () => {
      beforeEach(() => {
        jest
          .spyOn(StrongConfig.prototype, 'getSchema')
          .mockReturnValueOnce(schema)
      })

      it('should skip validation', () => {
        jest.spyOn(StrongConfig.prototype, 'validate')
        const sc = new StrongConfig(validOptions)
        expect(sc.validate).toHaveBeenCalledTimes(2)

        jest.clearAllMocks()
        sc.getConfig()
        expect(sc.validate).not.toHaveBeenCalled()
      })

      it('should skip type generation', () => {
        jest.spyOn(StrongConfig.prototype, 'generateTypes')
        const sc = new StrongConfig(validOptions)
        expect(sc.generateTypes).toHaveBeenCalledTimes(1)

        jest.clearAllMocks()

        sc.getConfig()
        expect(sc.generateTypes).not.toHaveBeenCalled()
      })
    })
  })
})
