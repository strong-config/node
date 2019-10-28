jest.mock('../utils/validate-json')

import { validateJson } from '../utils/validate-json'
import { defaultParameters } from '.'

const mockedValidateJson = validateJson as jest.MockedFunction<
  typeof validateJson
>

const mockedParameters = { ...defaultParameters }

mockedValidateJson.mockReturnValue(true)

import { validate } from './validate'

describe('validate()', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('validates json', () => {
    validate(mockedParameters)

    expect(mockedValidateJson).toHaveBeenCalledWith(
      mockedParameters,
      expect.any(Object)
    )
  })

  it('returns the params when they are valid', () => {
    const validationResult = validate(mockedParameters)

    expect(validationResult).toStrictEqual(mockedParameters)
  })

  it('throws when parameter validation fails', () => {
    mockedValidateJson.mockImplementation(() => {
      throw new Error('some validation error')
    })

    expect(() => validate(mockedParameters)).toThrowError(
      'some validation error'
    )
  })
})
