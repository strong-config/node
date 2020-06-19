import Ajv from 'ajv'
import { defaultOptions } from '../options'
import optionsSchema from '../options-schema.json'
import { load } from './load'
import * as validateModule from './validate'
import { generateTypesFromSchemaCallback } from './generate-types-from-schema'
import StrongConfig = require('.')

jest.mock('./load')
jest.mock('./validate')
jest.mock('./generate-types-from-schema')

describe('StrongConfig class', () => {
  const runtimeEnv = process.env.NODE_ENV || 'test'

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

    it('throws if runtimeEnv is not set', () => {
      delete process.env[defaultOptions.runtimeEnvName]
      expect(() => new StrongConfig(defaultOptions)).toThrow(
        /process.env.*.is undefined/
      )
      process.env[defaultOptions.runtimeEnvName] = runtimeEnv
    })

    it('triggers type generation', () => {
      const strongConfig = new StrongConfig()
      strongConfig.generateTypes = jest.fn()
      strongConfig.load()

      expect(strongConfig.generateTypes).toHaveBeenCalled()
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

  describe('generateTypes()', () => {
    describe("when process.env.NODE_ENV === 'development' and options.types is NOT false", () => {
      let strongConfig: StrongConfig

      beforeEach(() => {
        strongConfig = new StrongConfig()
        process.env.NODE_ENV = 'development'
      })

      it('generates types', () => {
        strongConfig.generateTypes()

        expect(generateTypesFromSchemaCallback).toHaveBeenCalledWith(
          defaultOptions.configRoot,
          defaultOptions.types,
          expect.any(Function)
        )
      })

      it('skips generating types if called from a dev script in watch mode', () => {
        process.env.npm_config_argv = `cooked: { 'dev', 'load', 'watch' }`

        strongConfig.generateTypes()

        expect(generateTypesFromSchemaCallback).not.toHaveBeenCalled()
      })

      it('does NOT skip generating types if called from tests in watch mode', () => {
        process.env.npm_config_argv = `cooked: { 'test', '--watch' }`

        strongConfig.generateTypes()

        expect(generateTypesFromSchemaCallback).toHaveBeenCalledTimes(1)
      })
    })

    describe("when process.env.NODE_ENV is anything other than 'development'", () => {
      it('skips generating types', () => {
        process.env.NODE_ENV = 'production'

        new StrongConfig().generateTypes()

        expect(generateTypesFromSchemaCallback).not.toHaveBeenCalled()
        process.env.NODE_ENV = runtimeEnv
      })
    })

    describe('when options.types is false', () => {
      it('skips generating types', () => {
        process.env.NODE_ENV = 'development'

        new StrongConfig({ ...defaultOptions, types: false }).generateTypes()

        expect(generateTypesFromSchemaCallback).toHaveBeenCalledTimes(0)
        process.env.NODE_ENV = runtimeEnv
      })
    })
  })
})
