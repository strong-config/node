jest.mock('./utils/generate-type-from-schema')
jest.mock('./utils/hydrate-config')
jest.mock('./utils/generate-type-from-schema')
jest.mock('./utils/validate-config')
jest.mock('./utils/read-file')
jest.mock('./utils/sops')

import { generateTypeFromSchema } from './utils/generate-type-from-schema'
import { hydrateConfig, InnerHydrateFunction } from './utils/hydrate-config'
import { validateConfig } from './utils/validate-config'
import { readConfigFile, readSchemaFile } from './utils/read-file'
import { decryptToObject } from './utils/sops'

import { HydratedConfig } from './types'

const mockedConfigFile = {
  filePath: './config/development.yaml',
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
const RUNTIME_ENVIRONMENT = 'development'
const mockedHydratedConfig: HydratedConfig = {
  some: 'config',
  runtimeEnvironment: RUNTIME_ENVIRONMENT,
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
  typeof hydrateConfig
>

mockedReadConfigFile.mockReturnValue(mockedConfigFile)
mockedReadSchemaFile.mockReturnValue(mockedSchemaFile)
mockedDecryptToObject.mockReturnValue(mockedDecryptedConfigFile)
const innerHydrateFunction: jest.MockedFunction<InnerHydrateFunction> = jest.fn(
  () => mockedHydratedConfig
)
mockedHydrateConfig.mockReturnValue(innerHydrateFunction)

import { load } from './load'

describe('load()', () => {
  const OLD_ENV = process.env

  beforeEach(() => {
    jest.clearAllMocks()
    jest.resetModules()
    process.env = Object.assign(process.env, { RUNTIME_ENVIRONMENT })
  })

  afterAll(() => {
    process.env = OLD_ENV
  })

  it('throws if RUNTIME_ENVIRONMENT is not set', () => {
    delete process.env.RUNTIME_ENVIRONMENT

    expect(() => load()).toThrow(
      /process.env.RUNTIME_ENVIRONMENT must be defined/
    )

    process.env = Object.assign(process.env, { RUNTIME_ENVIRONMENT })
  })

  it('reads the config based on process.env.RUNTIME_ENVIRONMENT', () => {
    load()

    expect(mockedReadConfigFile).toHaveBeenCalledWith(
      expect.any(String),
      RUNTIME_ENVIRONMENT
    )
  })

  it('decrypts the config with SOPS', () => {
    load()

    expect(mockedDecryptToObject).toHaveBeenCalledWith(
      mockedConfigFile.filePath,
      mockedConfigFile.contents
    )
  })

  it('hydrates the config', () => {
    load()

    expect(mockedHydrateConfig).toHaveBeenCalledWith(RUNTIME_ENVIRONMENT)
    expect(innerHydrateFunction).toHaveBeenCalledWith(mockedDecryptedConfigFile)
  })

  it('reads the schema file', () => {
    load()

    expect(mockedReadSchemaFile).toHaveBeenCalledWith('schema')
  })

  it('validates config against schema if schema was found', () => {
    load()

    expect(validateConfig).toHaveBeenCalledWith(
      mockedHydratedConfig,
      mockedSchemaFile.contents
    )
  })

  it('generates types based on schema if schema was found', () => {
    load()

    expect(generateTypeFromSchema).toHaveBeenCalledWith('./config/schema.json')
  })

  it('skips validating config if schema was not found', () => {
    mockedReadSchemaFile.mockReturnValueOnce(undefined)

    load()

    expect(validateConfig).toHaveBeenCalledTimes(0)
  })

  it('skips generating types if schema was not found', () => {
    mockedReadSchemaFile.mockReturnValueOnce(undefined)

    load()

    expect(generateTypeFromSchema).toHaveBeenCalledTimes(0)
  })

  it('returns the config', () => {
    const loadedConfig = load()

    expect(loadedConfig).toStrictEqual(mockedHydratedConfig)
  })
})
