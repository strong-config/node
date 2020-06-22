import * as readFiles from '../utils/read-files'
import * as sops from '../utils/sops'
import {
  validOptions,
  encryptedConfigFile,
  schema,
  decryptedConfig,
} from '../fixtures'
import { generateTypesFromSchemaCallback } from '../utils/generate-types-from-schema'
import StrongConfig = require('.')

jest.mock('../utils/generate-types-from-schema')

describe('StrongConfig.generateTypes()', () => {
  const originalEnv = process.env[validOptions.runtimeEnvName]
  jest.spyOn(console, 'info').mockReturnValue()
  jest.spyOn(readFiles, 'readConfig').mockReturnValue(encryptedConfigFile)
  jest.spyOn(readFiles, 'loadSchema').mockReturnValue(schema)
  jest.spyOn(sops, 'decryptToObject').mockReturnValue(decryptedConfig)
  let sc: StrongConfig

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe("when process.env[runtimeEnvName] === 'development'", () => {
    beforeEach(() => {
      jest.clearAllMocks()
      process.env[validOptions.runtimeEnvName] = 'development'
    })

    afterAll(() => {
      process.env[validOptions.runtimeEnvName] = originalEnv
    })

    describe('when options.types is NOT false', () => {
      it('generates types', () => {
        sc = new StrongConfig(validOptions)
        sc.generateTypes()

        expect(generateTypesFromSchemaCallback).toHaveBeenCalledWith(
          validOptions.configRoot,
          validOptions.types,
          expect.any(Function)
        )
      })

      it('generates types if called from tests in --watch mode', () => {
        process.env.npm_config_argv = `cooked: { 'test', '--watch' }`

        sc = new StrongConfig(validOptions)

        expect(generateTypesFromSchemaCallback).toHaveBeenCalledTimes(1)
      })

      it('does NOT generate types if called from a dev script in watch mode', () => {
        process.env.npm_config_argv = `cooked: { 'dev', 'load', 'watch' }`

        sc = new StrongConfig(validOptions)
        sc.generateTypes()

        expect(generateTypesFromSchemaCallback).not.toHaveBeenCalled()
      })
    })

    describe('when options.types is false', () => {
      it('skips generating types', () => {
        new StrongConfig({ ...validOptions, types: false })

        expect(generateTypesFromSchemaCallback).toHaveBeenCalledTimes(0)
      })
    })
  })

  describe("when process.env.NODE_ENV is anything other than 'development'", () => {
    beforeEach(() => {
      process.env[validOptions.runtimeEnvName] = 'production'
    })

    afterAll(() => {
      process.env[validOptions.runtimeEnvName] = originalEnv
    })

    it('skips generating types', () => {
      sc = new StrongConfig(validOptions)
      sc.generateTypes()

      expect(generateTypesFromSchemaCallback).not.toHaveBeenCalled()
    })
  })
})
