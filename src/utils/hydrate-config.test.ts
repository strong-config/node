import { hydrateConfig } from './hydrate-config'
import { substituteWithEnv } from './substitute-with-env'

jest.mock('./substitute-with-env', () => ({
  substituteWithEnv: jest
    .fn()
    .mockReturnValue('{ "field": "value", "replaceMe": "ENV_VAR_VALUE" }'),
}))

describe('utils :: hydrate-config', () => {
  describe('hydrateConfig()', () => {
    const runtimeEnv = 'test'
    const mockedConfig = {
      field: 'value',
      replaceMe: '${AN_ENV_VAR}',
    }

    it('calls substituteWithEnv', () => {
      hydrateConfig(runtimeEnv)(mockedConfig)

      expect(substituteWithEnv).toHaveBeenCalledWith(
        JSON.stringify(mockedConfig)
      )
    })

    it('adds runtimeEnv as top-level field', () => {
      expect(hydrateConfig(runtimeEnv)(mockedConfig)).toEqual(
        expect.objectContaining({
          runtimeEnv,
        })
      )
    })

    it('returns the expected result', () => {
      const hydratedConfigMock = {
        ...mockedConfig,
        replaceMe: 'ENV_VAR_VALUE',
        runtimeEnv,
      }

      expect(hydrateConfig(runtimeEnv)(mockedConfig)).toEqual(
        hydratedConfigMock
      )
    })
  })
})
