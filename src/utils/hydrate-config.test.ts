jest.mock('./substitute-with-env')
import { substituteWithEnv } from './substitute-with-env'

const mockedSubstituteWithEnv = substituteWithEnv as jest.MockedFunction<
  typeof substituteWithEnv
>
const mockedRuntimeEnvironment = 'development'
const mockedConfig = {
  field: 'value',
  replaceMe: '${asdf}',
}
const mockedSubstitutedConfig = '{"field":"value","replaceMe":"PASTE"}'
const mockedHydratedConfig = {
  ...mockedConfig,
  replaceMe: 'PASTE',
  runtimeEnvironment: mockedRuntimeEnvironment,
}
mockedSubstituteWithEnv.mockReturnValue(mockedSubstitutedConfig)

import { hydrateConfig } from './hydrate-config'
const hydrateConfigInited = hydrateConfig(mockedRuntimeEnvironment)

describe('hydrateConfig behaves as expected', () => {
  it('calls substituteWithEnv', () => {
    hydrateConfigInited(mockedConfig)

    expect(mockedSubstituteWithEnv).toHaveBeenCalledTimes(1)
  })

  it('adds runtimeEnvironment as top-level field', () => {
    expect(hydrateConfigInited(mockedConfig)).toEqual(
      expect.objectContaining({ runtimeEnvironment: mockedRuntimeEnvironment })
    )
  })

  it('returns the expected result', () => {
    expect(hydrateConfigInited(mockedConfig)).toEqual(mockedHydratedConfig)
  })
})
