jest.mock('./load')
jest.mock('./validate')

import { load } from './load'
import { validate } from './validate'

const mockedLoad = load as jest.MockedFunction<typeof load>
const mockedValidate = validate as jest.MockedFunction<typeof validate>

const mockedConfig = { some: 'config', runtimeEnvironment: 'development' }
const mockedValidationResult = true
mockedLoad.mockReturnValue(mockedConfig)
mockedValidate.mockReturnValue(mockedValidationResult)

import StrongConfig from './index'

describe('StrongConfig class', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('can be instantiated', () => {
    expect(new StrongConfig()).toBeDefined()
  })

  it('accepts and stores a parameter object', () => {
    const mockedParams = {}
    const strongConfig = new StrongConfig(mockedParams)

    expect(strongConfig.params).toStrictEqual(mockedParams)
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

      const result = strongConfig.validate(
        'path/to/schema.json',
        'some/config/path'
      )

      expect(mockedValidate).toHaveBeenCalledTimes(1)
      expect(result).toStrictEqual(mockedValidationResult)
    })
  })
})
