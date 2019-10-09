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
  it('StrongConfig is a class that can be instantiated', () => {
    expect(new StrongConfig()).toBeDefined()
  })

  it('StrongConfig accepts and stores a configuration object', () => {
    const mockConfiguration = {}
    const strongConfig = new StrongConfig(mockConfiguration)

    expect(strongConfig.configuration).toStrictEqual(mockConfiguration)
  })

  it('strongConfig exposes "load()"', () => {
    expect(new StrongConfig().load).toBeInstanceOf(Function)
  })

  it('strongConfig exposes "validate()"', () => {
    expect(new StrongConfig().validate).toBeInstanceOf(Function)
  })

  it('strongConfig.load() calls imported load() and returns its result', () => {
    const strongConfig = new StrongConfig()

    const result = strongConfig.load()

    expect(mockedLoad).toHaveBeenCalledTimes(1)
    expect(result).toStrictEqual(mockedConfig)
  })

  it('strongConfig.validate() calls imported validate() and returns its result', () => {
    const strongConfig = new StrongConfig()

    const result = strongConfig.validate(
      'path/to/schema.json',
      'some/config/path'
    )

    expect(mockedValidate).toHaveBeenCalledTimes(1)
    expect(result).toStrictEqual(mockedValidationResult)
  })
})
