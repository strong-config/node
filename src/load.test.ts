jest.mock('./validate')
jest.mock('./utils/hydrate-config')
jest.mock('./utils/generate-type-from-schema')
jest.mock('./utils/sops')

import { load } from './load'
import { defaultOptions } from './options'
import { generateTypeFromSchema } from './utils/generate-type-from-schema'
import { hydrateConfig, InnerHydrateFunction } from './utils/hydrate-config'
import { validate } from './validate'
import * as readFile from './utils/read-file'

const runtimeEnv = process.env[defaultOptions.runtimeEnvName] || 'test'

// Mocks
const mockedConfigFile = {
  filePath: './config/test.yaml',
  contents: {
    key: 'config',
    sops: { some: 'sopsdetails' },
  },
}
const mockedDecryptedConfigFile = {
  key: 'value',
}
const mockedSchemaFile = {
  contents: { key: 'schema' },
  filePath: './config/schema.json',
}
const mockedHydratedConfig: HydratedConfig = {
  some: 'config',
  runtimeEnv,
}

const mockedDecryptToObject = decryptToObject as jest.MockedFunction<
  typeof decryptToObject
>
const mockedHydrateConfig = hydrateConfig as jest.MockedFunction<
  typeof hydrateConfig & jest.Mock
>

mockedDecryptToObject.mockReturnValue(mockedDecryptedConfigFile)
const innerHydrateFunction = jest
  .fn()
  .mockReturnValue(mockedHydratedConfig) as jest.Mock<InnerHydrateFunction>
mockedHydrateConfig.mockReturnValue(innerHydrateFunction)
import * as sops from './utils/sops'

import type { HydratedConfig } from './types'

describe('load()', () => {
  const OLD_ENV = process.env
  let readConfigFileSpy: jest.SpyInstance, consoleDebugSpy: jest.SpyInstance

  beforeAll(() => {
    consoleDebugSpy = jest.spyOn(console, 'debug').mockReturnValue()
  })

  beforeEach(() => {
    jest.clearAllMocks()
    jest.resetModules()
    process.env = Object.assign(process.env, {
      [defaultOptions.runtimeEnvName]: runtimeEnv,
    })

    readConfigFileSpy = jest.spyOn(readFile, 'readConfigFile')
    readConfigFileSpy.mockReturnValue(mockedConfigFile)
  })

  afterAll(() => {
    process.env = OLD_ENV
    consoleDebugSpy.mockRestore()
  })

  it('reads the config based on process.env[runtimeEnv]', () => {
    load(runtimeEnv, defaultOptions)

    expect(readConfigFileSpy).toHaveBeenCalledWith(
      defaultOptions.configRoot,
      runtimeEnv
    )
  })

  it('decrypts the config with SOPS', () => {
    load(runtimeEnv, defaultOptions)

    expect(mockedDecryptToObject).toHaveBeenCalledWith(
      mockedConfigFile.filePath,
      mockedConfigFile.contents
    )
  })

  it('hydrates the config object', () => {
    load(runtimeEnv, defaultOptions)

    expect(mockedHydrateConfig).toHaveBeenCalledWith(runtimeEnv, defaultOptions)
    expect(innerHydrateFunction).toHaveBeenCalledWith(mockedDecryptedConfigFile)
  })

  describe('given a configRoot folder with an existing schema.json file', () => {
    let readSchemaFileSpy

    beforeEach(() => {
      readSchemaFileSpy = jest.spyOn(readFile, 'readSchemaFile')
      readSchemaFileSpy.mockReturnValue(mockedSchemaFile)
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

      expect(generateTypeFromSchema).toHaveBeenCalledWith(
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

      expect(generateTypeFromSchema).toHaveBeenCalledTimes(0)
    })
  })

  it('returns a config object', () => {
    const loadedConfig = load(runtimeEnv, defaultOptions)

    expect(loadedConfig).toStrictEqual(mockedHydratedConfig)
  })
})
