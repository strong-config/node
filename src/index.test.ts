jest.mock('./load')
jest.mock('./validate')
jest.mock('./params/validate')

import { load } from './load'
import { validate } from './validate'
import { validate as validateParams } from './params/validate'
import { defaultParameters } from './params'

const mockedLoad = load as jest.MockedFunction<typeof load>
const mockedValidate = validate as jest.MockedFunction<typeof validate>
const mockedValidateParams = validateParams as jest.MockedFunction<
  typeof validateParams
>

const runtimeEnv = process.env.NODE_ENV || 'test'
const mockedConfig = { some: 'config', runtimeEnv }
const mockedParameters = defaultParameters
const mockedConfigPath = 'some/config/path'
const mockedValidationResult = true
mockedLoad.mockReturnValue(mockedConfig)
mockedValidate.mockReturnValue(mockedValidationResult)
mockedValidateParams.mockReturnValue(mockedParameters)

import StrongConfig from '.'

describe('StrongConfig class', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('instantiation', () => {
    it('can be instantiated without constructor arguments', () => {
      expect(new StrongConfig()).toBeDefined()
    })

    it('can be instantiated with a parameters object', () => {
      expect(new StrongConfig(mockedParameters)).toBeDefined()
    })

    it('validates the parameters object', () => {
      new StrongConfig(mockedParameters)

      expect(mockedValidateParams).toHaveBeenCalledWith(mockedParameters)
    })

    it('stores the validated parameters object', () => {
      const strongConfig = new StrongConfig(mockedParameters)

      expect(strongConfig.parameters).toStrictEqual(mockedParameters)
    })
  })

  it('strongConfig instance exposes "load()"', () => {
    expect(new StrongConfig().load).toBeInstanceOf(Function)
  })

  it('strongConfig instance exposes "validate()"', () => {
    expect(new StrongConfig().validate).toBeInstanceOf(Function)
  })

  describe('strongConfig.load()', () => {
    it('calls imported load() and returns its result', () => {
      const strongConfig = new StrongConfig()

      const result = strongConfig.load()

      expect(mockedLoad).toHaveBeenCalledTimes(1)
      expect(result).toStrictEqual(mockedConfig)
    })

    it('calls imported load() with initialized parameters', () => {
      const strongConfig = new StrongConfig(mockedParameters)

      strongConfig.load()

      expect(mockedLoad).toHaveBeenCalledWith(mockedParameters)
    })

    it('memoizes previously loaded config', () => {
      const strongConfig = new StrongConfig()

      const firstLoadResult = strongConfig.load()
      const secondLoadResult = strongConfig.load()

      expect(mockedLoad).toHaveBeenCalledTimes(1)
      expect(firstLoadResult).toStrictEqual(mockedConfig)
      expect(secondLoadResult).toStrictEqual(mockedConfig)
    })
  })

  describe('strongConfig.validate()', () => {
    it('calls imported validate() and returns its result', () => {
      const strongConfig = new StrongConfig()

      const result = strongConfig.validate(mockedConfigPath)

      expect(mockedValidate).toHaveBeenCalledTimes(1)
      expect(result).toStrictEqual(mockedValidationResult)
    })

    it('validates config paths that are passed', () => {
      const strongConfig = new StrongConfig(mockedParameters)

      strongConfig.validate(mockedConfigPath, mockedConfigPath)

      expect(mockedValidate).toHaveBeenCalledWith(
        [mockedConfigPath, mockedConfigPath],
        mockedParameters
      )
    })

    it('validates parameters.configPath by default', () => {
      const strongConfig = new StrongConfig(mockedParameters)

      // Do not pass any configPaths to trigger default validation
      strongConfig.validate()

      expect(mockedValidate).toHaveBeenCalledWith(
        [defaultParameters.configPath],
        mockedParameters
      )
    })
  })
})
