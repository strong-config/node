/* eslint-disable @typescript-eslint/ban-ts-comment, @typescript-eslint/unbound-method */
import { optionsSchema, defaultOptions } from '../options'
import * as readFiles from '../utils/read-files'
import * as sops from '../utils/sops'
import {
  validOptions,
  encryptedConfigFile,
  schema,
  decryptedConfig,
} from '../fixtures'
import StrongConfig = require('.')

jest.mock('../utils/generate-types-from-schema')

describe('StrongConfig.constructor()', () => {
  const readConfig = jest.spyOn(readFiles, 'readConfig')
  const loadSchema = jest.spyOn(readFiles, 'loadSchema')
  const decryptToObject = jest.spyOn(sops, 'decryptToObject')

  beforeAll(() => {
    jest.spyOn(console, 'info').mockImplementation()
  })

  beforeEach(() => {
    jest.clearAllMocks()
    readConfig.mockReturnValue(encryptedConfigFile)
    loadSchema.mockReturnValue(schema)
    decryptToObject.mockReturnValue(decryptedConfig)
  })

  afterAll(() => {
    jest.restoreAllMocks()
  })

  it('can be instantiated without constructor arguments', () => {
    expect(new StrongConfig()).toBeDefined()
  })

  it('can be instantiated with options', () => {
    expect(new StrongConfig(validOptions)).toBeDefined()
  })

  it('validates the passed options object against the optionsSchema', () => {
    jest.spyOn(StrongConfig.prototype, 'validate')

    const sc = new StrongConfig(validOptions)

    expect(sc.validate).toHaveBeenCalledWith(validOptions, optionsSchema)
    expect(sc.validate).toHaveReturnedWith(true)
  })

  it('throws if the passed options object is invalid', () => {
    const invalidOptions = { i: 'am', super: 'invalid' }
    const validate = jest.spyOn(StrongConfig.prototype, 'validate')

    expect(
      // @ts-ignore explicitly testing invalid options here
      () => new StrongConfig(invalidOptions)
    ).toThrowError('data should NOT have additional properties')

    expect(validate).toHaveBeenCalledWith(
      { ...defaultOptions, ...invalidOptions },
      optionsSchema
    )
  })

  it('stores the validated options object', () => {
    const sc = new StrongConfig(validOptions)

    expect(sc.options).toStrictEqual(validOptions)
  })
})
