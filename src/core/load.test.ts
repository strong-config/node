import { defaultOptions } from '../options'
import { hydrateConfig, HydrateConfig } from '../utils/hydrate-config'
import * as readFiles from '../utils/read-file'
import * as sops from '../utils/sops'
import type { HydratedConfig } from '../types'
import { validate } from './validate'
import { load } from './load'

jest.mock('../utils/hydrate-config')
jest.mock('../utils/sops')
jest.mock('./validate')

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
  })
})
