jest.mock('../utils/validate-json')

import { validateJson } from '../utils/validate-json'
import { defaultOptions } from '.'

const mockedValidateJson = validateJson as jest.MockedFunction<
  typeof validateJson
>

const mockedOptions = { ...defaultOptions }

mockedValidateJson.mockReturnValue(true)

import { validate } from './validate'

describe('validate()', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('validates json', () => {
    validate(mockedOptions)

    expect(mockedValidateJson).toHaveBeenCalledWith(
      mockedOptions,
      expect.any(Object)
    )
  })

  it('returns the options when they are valid', () => {
    const validationResult = validate(mockedOptions)

    expect(validationResult).toStrictEqual(mockedOptions)
  })

  it('throws when option validation fails', () => {
    mockedValidateJson.mockImplementation(() => {
      throw new Error('some validation error')
    })

    expect(() => validate(mockedOptions)).toThrowError('some validation error')
  })
})
