import Ajv from 'ajv'
import { defaultOptions } from '../options'
import optionsSchema from '../options-schema.json'
import { load } from './load'
import * as validateModule from './validate'
import StrongConfig = require('.')

jest.mock('./load')
jest.mock('./validate')

const runtimeEnv = process.env.NODE_ENV || 'test'

describe('StrongConfig class', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('constructor()', () => {
    it('can be instantiated without constructor arguments', () => {
      expect(new StrongConfig()).toBeDefined()
    })

    it('can be instantiated with options', () => {
      expect(new StrongConfig(defaultOptions)).toBeDefined()
    })

    it('validates the options object', () => {
      jest.spyOn(Ajv.prototype, 'validate')

      new StrongConfig(defaultOptions)

      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      expect(Ajv.prototype.validate).toHaveBeenCalledWith(
        optionsSchema,
        defaultOptions
      )
    })

    it('stores the validated options object', () => {
      const strongConfig = new StrongConfig(defaultOptions)

      expect(strongConfig.options).toStrictEqual(defaultOptions)
    })
  })

  describe('validateOptions()', () => {
    it('validates the options object', () => {
      const strongConfig = new StrongConfig(defaultOptions)

      jest.spyOn(Ajv.prototype, 'validate')
      strongConfig.validateOptions(defaultOptions)

      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      expect(Ajv.prototype.validate).toHaveBeenCalledWith(
        optionsSchema,
        defaultOptions
      )
    })

    it('throws if passed options are invalid against schema', () => {
      const invalidOptions = {
        ...defaultOptions,
        superIllegalProperty: 'sneaky value',
      }

      expect(() => new StrongConfig(invalidOptions)).toThrowError(
        'data should NOT have additional properties'
      )
    })
  })

  describe('load()', () => {
    const configMock = { some: 'config', runtimeEnv }
    const loadMock = load as jest.MockedFunction<typeof load>
    loadMock.mockReturnValue(configMock)

    it('calls imported load() and returns its result', () => {
      const result = new StrongConfig().load()

      expect(loadMock).toHaveBeenCalledTimes(1)
      expect(result).toStrictEqual(configMock)
    })

    it('calls imported load() with initialized options', () => {
      new StrongConfig().load()

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

    describe('when process.env[runtimeEnv] is undefined', () => {
      beforeAll(() => {
        delete process.env[defaultOptions.runtimeEnvName]
      })

      it('throws if runtimeEnv is not set', () => {
        expect(() => new StrongConfig(defaultOptions)).toThrow(
          /process.env.*.is undefined/
        )
      })

      afterAll(() => {
        process.env[defaultOptions.runtimeEnvName] = runtimeEnv
      })
    })
  })

  describe('validate()', () => {
    it('calls imported validate() and returns its result', () => {
      const validateStub = jest
        .spyOn(validateModule, 'validate')
        .mockReturnValue(true)
      const strongConfig = new StrongConfig()

      const result = strongConfig.validate()

      expect(validateStub).toHaveBeenCalledTimes(1)
      expect(validateStub).toHaveBeenCalledWith(
        runtimeEnv,
        defaultOptions.configRoot
      )
      expect(result).toStrictEqual(true)
    })
  })
})
