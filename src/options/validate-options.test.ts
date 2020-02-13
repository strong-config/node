jest.mock('../utils/validate-json-against-schema')

import validateJsonAgainstSchema from '../utils/validate-json-against-schema'
import { defaultOptions } from '.'

const mockedValidateJson = validateJsonAgainstSchema as jest.MockedFunction<
  typeof validateJsonAgainstSchema
>

const mockedOptions = { ...defaultOptions }

mockedValidateJson.mockReturnValue(true)

import validateOptions from './validate-options'

describe('validate()', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('validates json', () => {
    validateOptions(mockedOptions)

    expect(mockedValidateJson).toHaveBeenCalledWith(
      mockedOptions,
      expect.any(Object)
    )
  })

  it('returns the options when they are valid', () => {
    const validationResult = validateOptions(mockedOptions)

    expect(validationResult).toStrictEqual(mockedOptions)
  })

  it('throws when option validation fails', () => {
    mockedValidateJson.mockImplementation(() => {
      throw new Error('some validation error')
    })

    expect(() => validateOptions(mockedOptions)).toThrowError(
      'some validation error'
    )
  })
})
