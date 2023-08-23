import * as readFiles from '../utils/load-files'
import * as sops from '../utils/sops'
import {
  validOptions,
  encryptedConfigFile,
  schema,
  decryptedConfig,
} from '../fixtures'
import { generateTypesFromSchemaCallback } from '../utils/generate-types-from-schema'

// Needed for commonjs compatibility
// eslint-disable-next-line @typescript-eslint/no-require-imports
import StrongConfig = require('.')

jest.mock('../utils/generate-types-from-schema')

describe('Type Generation', () => {
  const originalEnv = process.env[validOptions.runtimeEnvName]
  jest.spyOn(console, 'info').mockReturnValue()
  jest.spyOn(readFiles, 'loadConfigForEnv').mockReturnValue(encryptedConfigFile)
  jest.spyOn(readFiles, 'loadSchema').mockReturnValue(schema)
  jest.spyOn(sops, 'decryptToObject').mockReturnValue(decryptedConfig)

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe("when process.env[runtimeEnvName] is 'development'", () => {
    beforeEach(() => {
      jest.clearAllMocks()
      process.env[validOptions.runtimeEnvName] = 'development'
    })

    afterAll(() => {
      process.env[validOptions.runtimeEnvName] = originalEnv
    })

    describe('when options.generateTypes is TRUE', () => {
      it('generates types', () => {
        new StrongConfig({
          ...validOptions,
          generateTypes: true,
          typesPath: '@types',
        })

        expect(generateTypesFromSchemaCallback).toHaveBeenCalledWith(
          validOptions.configRoot,
          '@types',
          expect.any(Function)
        )
      })

      it('if options.typesPath is undefined, then use configRoot as the default output path for generated types', () => {
        new StrongConfig({ ...validOptions, generateTypes: true })

        expect(generateTypesFromSchemaCallback).toHaveBeenCalledWith(
          validOptions.configRoot,
          validOptions.configRoot,
          expect.any(Function)
        )
      })
    })

    describe('when options.generateTypes is FALSE', () => {
      it('skips generating types', () => {
        new StrongConfig({ ...validOptions, generateTypes: false })

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
      new StrongConfig(validOptions)

      expect(generateTypesFromSchemaCallback).not.toHaveBeenCalled()
    })
  })
})
