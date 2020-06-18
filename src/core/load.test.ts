jest.mock('../utils/hydrate-config')
jest.mock('../utils/sops')
jest.mock('./generate-types-from-schema')
jest.mock('./validate')

import { defaultOptions } from '../options'
import { hydrateConfig, HydrateConfig } from '../utils/hydrate-config'
import * as readFiles from '../utils/read-file'
import * as sops from '../utils/sops'

import type { HydratedConfig } from '../types'
import { validate } from './validate'
import { generateTypesFromSchemaCallback } from './generate-types-from-schema'
import { load } from './load'

describe('load()', () => {
  const OLD_ENV = process.env
  let readConfigForEnvStub: jest.SpyInstance

  const runtimeEnv = process.env[defaultOptions.runtimeEnvName] || 'test'
  const configFile = {
    filePath: './config/test.yaml',
    contents: {
      key: 'config',
      sops: { some: 'sopsdetails' },
    },
  }
  const decryptedConfigFile = { key: 'value' }
  const hydratedConfig: HydratedConfig = { some: 'config', runtimeEnv }
  const hydrateConfigStub = hydrateConfig as jest.MockedFunction<
    typeof hydrateConfig & jest.Mock
  >
  const innerHydrateFunction = jest
    .fn()
    .mockReturnValue(hydratedConfig) as jest.Mock<HydrateConfig>
  hydrateConfigStub.mockReturnValue(innerHydrateFunction)

  beforeAll(() => {
    jest.spyOn(console, 'info').mockReturnValue()
  })

  beforeEach(() => {
    jest.clearAllMocks()
    jest.resetModules()
    process.env = Object.assign(process.env, {
      [defaultOptions.runtimeEnvName]: runtimeEnv,
    })

    readConfigForEnvStub = jest.spyOn(readFiles, 'readConfigForEnv')
    readConfigForEnvStub.mockReturnValue(configFile)
  })

  afterAll(() => {
    process.env = OLD_ENV
    jest.restoreAllMocks()
  })

  it('determines the correct config to load based on process.env[runtimeEnv]', () => {
    load(runtimeEnv, defaultOptions)

    expect(readConfigForEnvStub).toHaveBeenCalledWith(
      runtimeEnv,
      defaultOptions.configRoot
    )
  })

  it('decrypts the config with sops', () => {
    const decryptToObjectStub = jest
      .spyOn(sops, 'decryptToObject')
      .mockReturnValue(decryptedConfigFile)
    load(runtimeEnv, defaultOptions)

    expect(decryptToObjectStub).toHaveBeenCalledWith(
      configFile.filePath,
      configFile.contents
    )
    decryptToObjectStub.mockClear()
  })

  it('hydrates the config object', () => {
    load(runtimeEnv, defaultOptions)

    expect(hydrateConfigStub).toHaveBeenCalledWith(runtimeEnv, defaultOptions)
    expect(innerHydrateFunction).toHaveBeenCalledWith(decryptedConfigFile)
  })

  describe('given a configRoot folder with an existing schema.json file', () => {
    let readSchemaFileSpy
    const schemaFile = {
      contents: { key: 'schema' },
      filePath: './config/schema.json',
    }

    beforeEach(() => {
      readSchemaFileSpy = jest.spyOn(readFiles, 'readSchemaFromConfigRoot')
      readSchemaFileSpy.mockReturnValue(schemaFile)
    })

    it('returns the config object', () => {
      expect(load(runtimeEnv, defaultOptions)).toStrictEqual(hydratedConfig)
    })

    it('validates config against schema', () => {
      load(runtimeEnv, defaultOptions)

      expect(validate).toHaveBeenCalledWith(
        runtimeEnv,
        defaultOptions.configRoot
      )
    })

    describe("when process.env.NODE_ENV === 'development' and options.types is NOT false", () => {
      beforeEach(() => {
        process.env.NODE_ENV = 'development'
      })

      it('generates types', () => {
        load(runtimeEnv, defaultOptions)

        expect(generateTypesFromSchemaCallback).toHaveBeenCalledWith(
          defaultOptions.configRoot,
          defaultOptions.types,
          expect.any(Function)
        )
      })

      it('skips generating types if called from a dev script in watch mode', () => {
        process.env.npm_config_argv = `cooked: { 'dev', 'load', 'watch' }`
        load(runtimeEnv, defaultOptions)

        expect(generateTypesFromSchemaCallback).not.toHaveBeenCalled()
      })

      it('does NOT skip generating types if called from tests in watch mode', () => {
        process.env.npm_config_argv = `cooked: { 'test', '--watch' }`
        load(runtimeEnv, defaultOptions)

        expect(generateTypesFromSchemaCallback).toHaveBeenCalledTimes(1)
      })
    })

    describe("when process.env.NODE_ENV is anything else than 'development'", () => {
      it('skips generating types', () => {
        process.env.NODE_ENV = 'production'
        load(runtimeEnv, defaultOptions)

        expect(generateTypesFromSchemaCallback).not.toHaveBeenCalled()
        process.env.NODE_ENV = runtimeEnv
      })
    })

    describe('when options.types is false', () => {
      it('skips generating types', () => {
        load(runtimeEnv, {
          ...defaultOptions,
          types: false,
        })

        expect(generateTypesFromSchemaCallback).toHaveBeenCalledTimes(0)
      })
    })
  })
})
