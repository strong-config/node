/* eslint-disable @typescript-eslint/ban-ts-comment, @typescript-eslint/unbound-method */
import Ajv from 'ajv'
import { optionsSchema, defaultOptions } from '../options'
import * as readFiles from '../utils/load-files'
import * as sops from '../utils/sops'
import {
  schema,
  validOptions,
  encryptedConfigFile,
  hydratedConfig,
  decryptedConfig,
} from '../fixtures'

// Needed for commonjs-compatibility
// eslint-disable-next-line @typescript-eslint/no-require-imports
import StrongConfig = require('.')

jest.mock('../utils/generate-types-from-schema')

describe('StrongConfig.constructor()', () => {
  const loadConfigForEnv = jest.spyOn(readFiles, 'loadConfigForEnv')
  const loadSchema = jest.spyOn(readFiles, 'loadSchema')
  const decryptToObject = jest.spyOn(sops, 'decryptToObject')

  beforeAll(() => {
    jest.spyOn(console, 'info').mockImplementation()
  })

  beforeEach(() => {
    jest.clearAllMocks()
    loadConfigForEnv.mockReturnValue(encryptedConfigFile)
    loadSchema.mockReturnValue(schema)
    decryptToObject.mockReturnValue(decryptedConfig)
  })

  afterAll(() => {
    jest.restoreAllMocks()
  })

  it('can be instantiated without any options', () => {
    expect(new StrongConfig()).toBeDefined()
  })

  it('can be instantiated with options', () => {
    expect(new StrongConfig(validOptions)).toBeDefined()
  })

  it('validates the passed options object against the optionsSchema', () => {
    jest.spyOn(StrongConfig.prototype, 'validate')

    const sc = new StrongConfig(validOptions)

    expect(sc.validate).toHaveBeenCalledWith(validOptions, optionsSchema)
    expect(sc.validate).toHaveReturnedWith(true)
  })

  it('throws if runtimeEnv is not set', () => {
    const originalEnv = process.env[defaultOptions.runtimeEnvName]
    delete process.env[defaultOptions.runtimeEnvName]

    expect(() => new StrongConfig()).toThrow(
      `process.env.${defaultOptions.runtimeEnvName} needs to be set but was 'undefined'`
    )

    process.env[defaultOptions.runtimeEnvName] = originalEnv
  })

  /* eslint-disable no-console */
  it('throws if the passed options object is invalid', () => {
    const invalidOptions = { i: 'am', super: 'invalid' }
    const originalConsoleError = console.error
    jest.spyOn(console, 'error').mockImplementation()
    const validate = jest.spyOn(StrongConfig.prototype, 'validate')

    expect(
      // @ts-ignore explicitly testing invalid options here
      () => new StrongConfig(invalidOptions)
    ).toThrow('config must NOT have additional properties')

    expect(validate).toHaveBeenCalledWith(
      { ...defaultOptions, ...invalidOptions },
      optionsSchema
    )

    expect(console.error).toHaveBeenCalledWith(
      expect.stringMatching("Invalid options passed to 'new StrongConfig")
    )

    console.error = originalConsoleError
  })
  /* eslint-enable no-console */

  it('stores the validated options object', () => {
    const sc = new StrongConfig(validOptions)

    expect(sc.options).toStrictEqual(validOptions)
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
      jest.spyOn(StrongConfig.prototype, 'getSchema').mockReturnValue(null)
      jest.spyOn(StrongConfig.prototype, 'generateTypes')
      const sc = new StrongConfig(validOptions)

      expect(sc.generateTypes).not.toHaveBeenCalled()
    })
  })
})
