jest.mock('./utils/generate-type-from-schema')
jest.mock('./utils/hydrate-config')
jest.mock('./utils/generate-type-from-schema')
jest.mock('./utils/validate-json')
jest.mock('./utils/read-file')
jest.mock('./utils/sops')

import { defaultParameters } from './params'
import { generateTypeFromSchema } from './utils/generate-type-from-schema'
import { hydrateConfig, InnerHydrateFunction } from './utils/hydrate-config'
import { validateJson } from './utils/validate-json'
import { readConfigFile, readSchemaFile } from './utils/read-file'
import { decryptToObject } from './utils/sops'

import { HydratedConfig } from './types'

const mockedParameters = defaultParameters
// Note: This variable must be named according to defaultParameters.runtimeEnvName
const RUNTIME_ENVIRONMENT = 'development'
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
      [defaultParameters.runtimeEnvName]: RUNTIME_ENVIRONMENT,
    })
  })

  afterAll(() => {
    process.env = OLD_ENV
  })

  it('throws if RUNTIME_ENVIRONMENT is not set', () => {
    delete process.env[defaultParameters.runtimeEnvName]

    expect(() => load(mockedParameters)).toThrow('runtimeEnv must be defined')

    process.env = Object.assign(process.env, {
      [defaultParameters.runtimeEnvName]: RUNTIME_ENVIRONMENT,
    })
  })

  it('reads the config based on process.env.RUNTIME_ENVIRONMENT', () => {
    load(mockedParameters)

    expect(mockedReadConfigFile).toHaveBeenCalledWith(
      expect.any(String),
      RUNTIME_ENVIRONMENT
    )
  })

  it('decrypts the config with SOPS', () => {
    load(mockedParameters)

    expect(mockedDecryptToObject).toHaveBeenCalledWith(
      mockedConfigFile.filePath,
      mockedConfigFile.contents
    )
  })

  it('hydrates the config', () => {
    load(mockedParameters)

    expect(mockedHydrateConfig).toHaveBeenCalledWith(
      RUNTIME_ENVIRONMENT,
      mockedParameters
    )
    expect(innerHydrateFunction).toHaveBeenCalledWith(mockedDecryptedConfigFile)
  })

  it('reads the schema file', () => {
    load(mockedParameters)

    expect(mockedReadSchemaFile).toHaveBeenCalledWith(
      defaultParameters.schemaPath
    )
  })

  it('validates config against schema if schema was found', () => {
    load(mockedParameters)

    expect(validateJson).toHaveBeenCalledWith(
      mockedHydratedConfig,
      mockedSchemaFile.contents
    )
  })

  it('generates types if parameters.types is not false', () => {
    load(mockedParameters)

    expect(generateTypeFromSchema).toHaveBeenCalledWith(mockedParameters)
  })

  it('skips generating types if parameters.types is false', () => {
    load({
      ...mockedParameters,
      types: false,
    })

    expect(generateTypeFromSchema).toHaveBeenCalledTimes(0)
  })

  it('skips validating config if schema was not found', () => {
    mockedReadSchemaFile.mockReturnValueOnce(null)

    load(mockedParameters)

    expect(validateJson).toHaveBeenCalledTimes(0)
  })

  it('skips generating types if schema was not found', () => {
    mockedReadSchemaFile.mockReturnValueOnce(null)

    load(mockedParameters)

    expect(generateTypeFromSchema).toHaveBeenCalledTimes(0)
  })

  it('returns the config', () => {
    const loadedConfig = load(mockedParameters)

    expect(loadedConfig).toStrictEqual(mockedHydratedConfig)
  })
})
