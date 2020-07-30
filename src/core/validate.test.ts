/* eslint-disable @typescript-eslint/ban-ts-comment */
import Ajv from 'ajv'
import { optionsSchema } from '../options'
import {
  validOptions,
  invalidOptions,
  encryptedConfigFile,
  hydratedConfig,
  schema,
  decryptedConfig,
} from '../fixtures'
import * as readFiles from '../utils/load-files'
import * as sops from '../utils/sops'
import StrongConfig = require('.')

jest.mock('../utils/generate-types-from-schema')

describe('StrongConfig.validate(data, schema)', () => {
  const loadConfigForEnv = jest.spyOn(readFiles, 'loadConfigForEnv')
  const loadSchema = jest.spyOn(readFiles, 'loadSchema')
  const decryptToObject = jest.spyOn(sops, 'decryptToObject')
  const ajvValidate = jest.spyOn(Ajv.prototype, 'validate')
  let sc: StrongConfig

  beforeEach(() => {
    jest.clearAllMocks()
    loadConfigForEnv.mockReturnValue(encryptedConfigFile)
    loadSchema.mockReturnValue(schema)
    decryptToObject.mockReturnValue(decryptedConfig)
    sc = new StrongConfig()

    // Reset mock again because it was implicitly called through `new StrongConfig()` already
    ajvValidate.mockClear()
  })

  it('can validate config objects', () => {
    sc.validate(hydratedConfig, schema)
    expect(ajvValidate).toHaveBeenCalledWith(schema, hydratedConfig)
    expect(ajvValidate).toHaveReturnedWith(true)

    ajvValidate.mockClear()

    const invalidConfig = { i: 'am', not: 'valid' }
    // @ts-ignore explicitly testing invalid input here
    expect(() => sc.validate(invalidConfig, schema)).toThrowError(
      'config should NOT have additional properties'
    )
    expect(ajvValidate).toHaveBeenCalledWith(schema, invalidConfig)
    expect(ajvValidate).toHaveReturnedWith(false)
  })

  it('can validate strong-config options', () => {
    sc.validate(validOptions, optionsSchema)
    expect(ajvValidate).toHaveBeenCalledWith(optionsSchema, validOptions)
    expect(ajvValidate).toHaveReturnedWith(true)

    ajvValidate.mockClear()

    // @ts-ignore explicitly testing invalid input here
    expect(() => sc.validate(invalidOptions, optionsSchema)).toThrowError(
      'config should NOT have additional properties'
    )
    expect(ajvValidate).toHaveBeenCalledWith(optionsSchema, invalidOptions)
    expect(ajvValidate).toHaveReturnedWith(false)
  })
})
