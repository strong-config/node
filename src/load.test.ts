jest.mock('./utils/generate-type-from-schema')
jest.mock('./utils/hydrate-config')
jest.mock('./utils/generate-type-from-schema')
jest.mock('./utils/validate-json')
jest.mock('./utils/read-file')
jest.mock('./utils/sops')

import { defaultOptions } from './options'
import { generateTypeFromSchema } from './utils/generate-type-from-schema'
import { hydrateConfig, InnerHydrateFunction } from './utils/hydrate-config'
import { validateJson } from './utils/validate-json'
import { readConfigFile, readSchemaFile } from './utils/read-file'
import { decryptToObject } from './utils/sops'

import { HydratedConfig } from './types'

const mockedOptions = defaultOptions
const runtimeEnv = process.env.NODE_ENV || 'test'
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

const mockedReadConfigFile = readConfigFile as jest.MockedFunction<
  typeof readConfigFile
>
const mockedReadSchemaFile = readSchemaFile as jest.MockedFunction<
  typeof readSchemaFile
>
const mockedDecryptToObject = decryptToObject as jest.MockedFunction<
  typeof decryptToObject
>
const mockedHydrateConfig = hydrateConfig as jest.MockedFunction<
  typeof hydrateConfig & jest.Mock
>

mockedReadConfigFile.mockReturnValue(mockedConfigFile)
mockedReadSchemaFile.mockReturnValue(mockedSchemaFile)
mockedDecryptToObject.mockReturnValue(mockedDecryptedConfigFile)
const innerHydrateFunction = jest
  .fn()
  .mockReturnValue(mockedHydratedConfig) as jest.Mock<InnerHydrateFunction>
mockedHydrateConfig.mockReturnValue(innerHydrateFunction)

import { load } from './load'

describe('load()', () => {
  const OLD_ENV = process.env

  beforeEach(() => {
    jest.clearAllMocks()
    jest.resetModules()
    process.env = Object.assign(process.env, {
      [defaultOptions.runtimeEnvName]: runtimeEnv,
    })
  })

  afterAll(() => {
    process.env = OLD_ENV
  })

  it('throws if NODE_ENV is not set', () => {
    delete process.env[defaultOptions.runtimeEnvName]

    expect(() => load(mockedOptions)).toThrow('runtimeEnv must be defined')

    process.env = Object.assign(process.env, {
      [defaultOptions.runtimeEnvName]: runtimeEnv,
    })
  })

  it('reads the config based on process.env.NODE_ENV', () => {
    load(mockedOptions)

    expect(mockedReadConfigFile).toHaveBeenCalledWith(
      expect.any(String),
      runtimeEnv
    )
  })

  it('decrypts the config with SOPS', () => {
    load(mockedOptions)

    expect(mockedDecryptToObject).toHaveBeenCalledWith(
      mockedConfigFile.filePath,
      mockedConfigFile.contents
    )
  })

  it('hydrates the config', () => {
    load(mockedOptions)

    expect(mockedHydrateConfig).toHaveBeenCalledWith(runtimeEnv, mockedOptions)
    expect(innerHydrateFunction).toHaveBeenCalledWith(mockedDecryptedConfigFile)
  })

  it('reads the schema file', () => {
    load(mockedOptions)

    expect(mockedReadSchemaFile).toHaveBeenCalledWith(defaultOptions.schemaPath)
  })

  it('validates config against schema if schema was found', () => {
    load(mockedOptions)

    expect(validateJson).toHaveBeenCalledWith(
      mockedHydratedConfig,
      mockedSchemaFile.contents
    )
  })

  it('generates types if options.types is not false', () => {
    load(mockedOptions)

    expect(generateTypeFromSchema).toHaveBeenCalledWith(mockedOptions)
  })

  it('skips generating types if options.types is false', () => {
    load({
      ...mockedOptions,
      types: false,
    })

    expect(generateTypeFromSchema).toHaveBeenCalledTimes(0)
  })

  it('skips validating config if schema was not found', () => {
    mockedReadSchemaFile.mockReturnValueOnce(null)

    load(mockedOptions)

    expect(validateJson).toHaveBeenCalledTimes(0)
  })

  it('skips generating types if schema was not found', () => {
    mockedReadSchemaFile.mockReturnValueOnce(null)

    load(mockedOptions)

    expect(generateTypeFromSchema).toHaveBeenCalledTimes(0)
  })

  it('returns the config', () => {
    const loadedConfig = load(mockedOptions)

    expect(loadedConfig).toStrictEqual(mockedHydratedConfig)
  })
})
