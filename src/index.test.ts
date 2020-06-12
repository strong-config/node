import { load } from './load'
import { validate } from './validate'
import { defaultOptions } from './options'
import optionsSchema from './options-schema.json'
import StrongConfig = require('.')

const ajvValidateSpy = jest.fn(() => true)
jest.mock('ajv', () => {
  return function () {
    return { validate: ajvValidateSpy }
  }
})

jest.mock('./load')
jest.mock('./validate')

const runtimeEnv = process.env.NODE_ENV || 'test'

describe('StrongConfig class', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('strongConfig instance exposes "load()"', () => {
    expect(new StrongConfig().load).toBeInstanceOf(Function)
  })

  it('strongConfig instance exposes "validate()"', () => {
    expect(new StrongConfig().validate).toBeInstanceOf(Function)
  })

  describe('constructor()', () => {
    it('can be instantiated without constructor arguments', () => {
      expect(new StrongConfig()).toBeDefined()
    })

    it('can be instantiated with a options object', () => {
      expect(new StrongConfig(defaultOptions)).toBeDefined()
    })

    it('validates the options object', () => {
      new StrongConfig(defaultOptions)

      expect(ajvValidateSpy).toHaveBeenCalledWith(optionsSchema, defaultOptions)
    })

    it('stores the validated options object', () => {
      const strongConfig = new StrongConfig(defaultOptions)

      expect(strongConfig.options).toStrictEqual(defaultOptions)
    })
  })

  describe('load()', () => {
    const configMock = { some: 'config', runtimeEnv }
    const loadMock = load as jest.MockedFunction<typeof load>
    loadMock.mockReturnValue(configMock)

    it('calls imported load() and returns its result', () => {
      const strongConfig = new StrongConfig()

      const result = strongConfig.load()

      expect(loadMock).toHaveBeenCalledTimes(1)
      expect(result).toStrictEqual(configMock)
    })

    it('calls imported load() with initialized options', () => {
      const strongConfig = new StrongConfig(defaultOptions)

      strongConfig.load()

      expect(loadMock).toHaveBeenCalledWith(runtimeEnv, defaultOptions)
    })

    it('memoizes previously loaded config', () => {
      const strongConfig = new StrongConfig()

      const firstLoadResult = strongConfig.load()
      const secondLoadResult = strongConfig.load()

      expect(loadMock).toHaveBeenCalledTimes(1)
      expect(firstLoadResult).toStrictEqual(configMock)
      expect(secondLoadResult).toStrictEqual(configMock)
    })

    describe('when process.env.NODE_ENV is undefined', () => {
      beforeAll(() => {
        delete process.env[defaultOptions.runtimeEnvName]
      })

      it('throws if runtimeEnv is not set', () => {
        const strongConfig = new StrongConfig({
          ...defaultOptions,
          runtimeEnvName: undefined,
        })
        expect(() => strongConfig.load()).toThrow(
          /Can't load config.+is undefined/
        )
      })

      afterAll(() => {
        process.env[defaultOptions.runtimeEnvName] = runtimeEnv
      })
    })
  })

  describe('validate()', () => {
    const validateMock = validate as jest.MockedFunction<typeof validate>
    validateMock.mockReturnValue(true)

    it('calls imported validate() and returns its result', () => {
      const strongConfig = new StrongConfig()

      const result = strongConfig.validate()

      expect(validateMock).toHaveBeenCalledTimes(1)
      expect(validateMock).toHaveBeenCalledWith(
        runtimeEnv,
        defaultOptions.configRoot
      )
      expect(result).toStrictEqual(true)
    })
  })
})
