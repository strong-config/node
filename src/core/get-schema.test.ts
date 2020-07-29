import * as readFiles from '../utils/load-files'
import * as sops from '../utils/sops'
import {
  validOptions,
  encryptedConfigFile,
  schema,
  decryptedConfig,
} from '../fixtures'
import StrongConfig = require('.')

describe('StrongConfig.getSchema()', () => {
  jest.spyOn(console, 'info').mockReturnValue()
  jest.spyOn(readFiles, 'loadConfigForEnv').mockReturnValue(encryptedConfigFile)
  jest.spyOn(sops, 'decryptToObject').mockReturnValue(decryptedConfig)
  const loadSchema = jest.spyOn(readFiles, 'loadSchema')
  let sc: StrongConfig

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('when a schema exists', () => {
    beforeEach(() => {
      loadSchema.mockReturnValue(schema)
    })

    it('loads the schema file from disk upon first invocation', () => {
      sc = new StrongConfig(validOptions)
      expect(loadSchema).toHaveBeenCalledWith(validOptions.configRoot)
    })

    it('memoizes the schema on subsequent calls and does NOT hit the disk', () => {
      sc = new StrongConfig(validOptions)
      expect(loadSchema).toHaveBeenCalledWith(validOptions.configRoot)

      const memoizedSchema = sc.getSchema()
      expect(loadSchema).not.toHaveBeenCalledWith()
      expect(memoizedSchema).toStrictEqual(schema)
    })
  })

  describe('when NO schema exists', () => {
    beforeEach(() => {
      // eslint-disable-next-line unicorn/no-useless-undefined
      loadSchema.mockReturnValue(undefined)
    })

    it('should return `null`', () => {
      jest.spyOn(StrongConfig.prototype, 'getSchema')
      sc = new StrongConfig(validOptions)

      expect(sc.getSchema()).toBeNull()
    })

    it('should still memoize `null` as schema to avoid retrying to read a schema from disk on subsequent calls', () => {
      jest.spyOn(StrongConfig.prototype, 'getSchema')
      sc = new StrongConfig(validOptions)
      expect(loadSchema).toHaveBeenCalled()

      jest.clearAllMocks()

      sc.getSchema()
      expect(loadSchema).not.toHaveBeenCalled()
    })
  })
})
