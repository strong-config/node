jest.mock('./utils/hydrate-config')
jest.mock('./utils/generate-types-from-schema')
jest.mock('./utils/sops')
jest.mock('./validate')

import { load } from './load'
import { defaultOptions } from './options'
import { generateTypesFromSchemaCallback } from './utils/generate-types-from-schema'
import { hydrateConfig, InnerHydrateFunction } from './utils/hydrate-config'
import { validate } from './validate'
import * as readFile from './utils/read-file'
import * as sops from './utils/sops'

import type { HydratedConfig } from './types'

describe('load()', () => {
  const OLD_ENV = process.env
  let readConfigFileSpy: jest.SpyInstance

  const runtimeEnv = process.env[defaultOptions.runtimeEnvName] || 'test'
  const configFileMock = {
    filePath: './config/test.yaml',
    contents: {
      key: 'config',
      sops: { some: 'sopsdetails' },
    },
  }
  const decryptedConfigFileMock = { key: 'value' }
  const hydratedConfigMock: HydratedConfig = { some: 'config', runtimeEnv }
  const hydrateConfigMock = hydrateConfig as jest.MockedFunction<
    typeof hydrateConfig & jest.Mock
  >
  const innerHydrateFunction = jest
    .fn()
    .mockReturnValue(hydratedConfigMock) as jest.Mock<InnerHydrateFunction>
  hydrateConfigMock.mockReturnValue(innerHydrateFunction)

  beforeEach(() => {
    jest.clearAllMocks()
    jest.resetModules()
    process.env = Object.assign(process.env, {
      [defaultOptions.runtimeEnvName]: runtimeEnv,
    })

    readConfigFileSpy = jest.spyOn(readFile, 'readConfigFile')
    readConfigFileSpy.mockReturnValue(configFileMock)
  })

  afterAll(() => {
    process.env = OLD_ENV
  })

  it('reads the config based on process.env[runtimeEnv]', () => {
    load(runtimeEnv, defaultOptions)

    expect(readConfigFileSpy).toHaveBeenCalledWith(
      defaultOptions.configRoot,
      runtimeEnv
    )
  })

  it('decrypts the config with SOPS', () => {
    const decryptToObjectMock = jest
      .spyOn(sops, 'decryptToObject')
      .mockReturnValue(decryptedConfigFileMock)
    load(runtimeEnv, defaultOptions)

    expect(decryptToObjectMock).toHaveBeenCalledWith(
      configFileMock.filePath,
      configFileMock.contents
    )
    decryptToObjectMock.mockClear()
  })

  it('hydrates the config object', () => {
    load(runtimeEnv, defaultOptions)

    expect(hydrateConfigMock).toHaveBeenCalledWith(runtimeEnv, defaultOptions)
    expect(innerHydrateFunction).toHaveBeenCalledWith(decryptedConfigFileMock)
  })

  describe('given a configRoot folder with an existing schema.json file', () => {
    let readSchemaFileSpy
    const schemaFileMock = {
      contents: { key: 'schema' },
      filePath: './config/schema.json',
    }

    beforeEach(() => {
      readSchemaFileSpy = jest.spyOn(readFile, 'readSchemaFile')
      readSchemaFileSpy.mockReturnValue(schemaFileMock)
    })

    it('validates config against schema if schema was found', () => {
      load(runtimeEnv, defaultOptions)

      expect(validate).toHaveBeenCalledWith(
        runtimeEnv,
        defaultOptions.configRoot
      )
    })

    it('generates types if options.types is not false', () => {
      load(runtimeEnv, defaultOptions)

      expect(generateTypesFromSchemaCallback).toHaveBeenCalledWith(
        defaultOptions.configRoot,
        defaultOptions.types,
        expect.any(Function)
      )
    })

    it('skips generating types if options.types is false', () => {
      load(runtimeEnv, {
        ...defaultOptions,
        types: false,
      })

      expect(generateTypesFromSchemaCallback).toHaveBeenCalledTimes(0)
    })
  })

  it('returns a config object', () => {
    const loadedConfig = load(runtimeEnv, defaultOptions)

    expect(loadedConfig).toStrictEqual(hydratedConfigMock)
  })
})
