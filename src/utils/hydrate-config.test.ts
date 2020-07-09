import { hydrateConfig } from './hydrate-config'
import * as substituteWithEnvModule from './substitute-with-env'

describe('hydrateConfig()', () => {
  const runtimeEnv = 'test'
  const configMock = { field: 'value', replaceMe: '${AN_ENV_VAR}' }
  const configMockSubstituted = { field: 'value', replaceMe: 'ENV_VAR_VALUE' }
  const configMockHydrated = { ...configMockSubstituted, runtimeEnv }
  const substituteWithEnv = jest
    .spyOn(substituteWithEnvModule, 'substituteWithEnv')
    .mockReturnValue(configMockSubstituted)

  it('calls substituteWithEnv', () => {
    hydrateConfig(configMock, runtimeEnv)

    expect(substituteWithEnv).toHaveBeenCalledWith(configMock)
  })

  it('adds runtimeEnv as top-level field', () =>
    expect(hydrateConfig(configMock, runtimeEnv)).toEqual(
      expect.objectContaining({
        runtimeEnv,
      })
    ))

  it('returns the expected result', () => {
    expect(hydrateConfig(configMock, runtimeEnv)).toEqual(configMockHydrated)
  })
})
