import { defaultOptions } from '../options'
import { hydrateConfig } from './hydrate-config'
import { substituteWithEnv } from './substitute-with-env'

jest.mock('./substitute-with-env', () => ({
  substituteWithEnv: jest
    .fn()
    .mockReturnValue(() => '{"field":"value","replaceMe":"PASTE"}'),
}))

describe('utils :: hydrate-config', () => {
  describe('hydrateConfig()', () => {
    const runtimeEnv = 'test'
    const mockedConfig = {
      field: 'value',
      replaceMe: '${asdf}',
    }

    const hydrateConfigInited = hydrateConfig(runtimeEnv, defaultOptions)

    it('calls substituteWithEnv with substitutionPattern', () => {
      hydrateConfigInited(mockedConfig)

      expect(substituteWithEnv).toHaveBeenCalledWith(
        defaultOptions.substitutionPattern
      )
    })

    it('adds runtimeEnv as top-level field', () => {
      expect(hydrateConfigInited(mockedConfig)).toEqual(
        expect.objectContaining({
          runtimeEnv,
        })
      )
    })

    it('returns the expected result', () => {
      const hydratedConfigMock = {
        ...mockedConfig,
        replaceMe: 'PASTE',
        runtimeEnv,
      }

      expect(hydrateConfigInited(mockedConfig)).toEqual(hydratedConfigMock)
    })
  })
})
