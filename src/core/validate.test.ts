import Ajv from 'ajv'
import { defaultOptions } from '../options'
import * as readFiles from '../utils/read-file'
import * as sops from '../utils/sops'
import type { Schema } from '../types'
import { validate } from './validate'

describe('validate()', () => {
  const configRoot = 'example'
  const decryptedConfigValid = {
    name: 'example-project',
    someField: { optionalField: 123, requiredField: 'crucial string' },
    someArray: ['joe', 'freeman'],
  }
  const decryptedConfigInvalid = {
    nameXXX: 'invalid name',
    someField: 'wrong value type',
    extraField: 'field disallowed by schema',
  }

  const decryptToObjectStub = jest
    .spyOn(sops, 'decryptToObject')
    .mockReturnValue(decryptedConfigValid)

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('given a valid DECRYPTED config file', () => {
    it('should return true', () => {
      expect(validate('unencrypted', configRoot)).toBe(true)
    })
  })

  describe('given a valid ENCRYPTED config file', () => {
    it('should return true', () => {
      expect(validate('development', configRoot)).toBe(true)
    })
  })

  describe('given an invalid DECRYPTED config file', () => {
    it('should throw', () => {
      decryptToObjectStub.mockReturnValueOnce(decryptedConfigInvalid)
      expect(() => validate('invalid', configRoot)).toThrowError(
        'data should NOT have additional properties'
      )
    })
  })

  describe('given a non-existing config file', () => {
    it('should throw', () => {
      const filePath = 'i-dont-exist.yml'
      expect(() => validate(filePath, configRoot)).toThrowError(
        `Couldn't find config file ${configRoot}/${filePath}`
      )
    })
  })

  describe("when schema can't be found in configRoot", () => {
    it('should throw', () => {
      jest
        .spyOn(readFiles, 'readSchemaFromConfigRoot')
        // eslint-disable-next-line unicorn/no-useless-undefined
        .mockReturnValueOnce(undefined)

      expect(() => validate('development', 'example')).toThrowError(
        'No schema file found'
      )
    })
  })

  describe('valid input', () => {
    it('accepts a relative path to a config file as input', () => {
      const relativePaths = [
        'example/development.yaml',
        './example/development.yaml',
        '../node/example/development.yaml',
      ]

      for (const path of relativePaths) {
        expect(validate(path, configRoot)).toBe(true)
      }
    })

    it('accepts an absolute path to a config file as input', () => {
      expect(
        validate(`${process.cwd()}/example/development.yaml`, configRoot)
      ).toBe(true)
    })

    it('accepts a runtimeEnv name as input', () => {
      expect(validate('development', configRoot)).toBe(true)
    })

    it('uses defaultOptions.configRoot in case no explicit configRoot flag gets passed', () => {
      jest.spyOn(readFiles, 'readConfigForEnv')
      const runtimeEnv = 'development'

      // this will throw because defaultOptions.configRoot is './config' which doesn't exist
      expect(() => validate(runtimeEnv)).toThrow()

      expect(readFiles.readConfigForEnv).toHaveBeenCalledWith(
        runtimeEnv,
        defaultOptions.configRoot
      )
    })
  })

  describe('schema augmentation with runtimeEnv property', () => {
    it('should dynamically add a runtimeEnv prop to the loaded schema', () => {
      jest.spyOn(Ajv.prototype, 'validate')

      const schema = readFiles.readSchemaFromConfigRoot(configRoot) as Schema
      expect(schema).not.toHaveProperty('properties.runtimeEnv')
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore we know it's not undefined here because we control the file
      schema.properties['runtimeEnv'] = { type: 'string' }

      validate('development', configRoot)

      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      expect(Ajv.prototype.validate).toHaveBeenCalledWith(
        schema,
        expect.any(Object)
      )
    })
  })
})
