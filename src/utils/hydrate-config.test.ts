jest.mock('./substitute-with-env')
import { substituteWithEnv } from './substitute-with-env'
import { defaultParameters } from '../params'

const mockedSubstituteWithEnv = substituteWithEnv as jest.MockedFunction<
  typeof substituteWithEnv
>
const mockedParameters = defaultParameters
const runtimeEnv = 'test'
const mockedConfig = {
  field: 'value',
  replaceMe: '${asdf}',
}
const mockedSubstitutedConfig = '{"field":"value","replaceMe":"PASTE"}'
const mockedHydratedConfig = {
  ...mockedConfig,
  replaceMe: 'PASTE',
  [mockedParameters.runtimeEnvName]: runtimeEnv,
}
mockedSubstituteWithEnv.mockReturnValue(() => mockedSubstitutedConfig)

import { hydrateConfig } from './hydrate-config'
const hydrateConfigInited = hydrateConfig(runtimeEnv, mockedParameters)

describe('hydrateConfig()', () => {
  it('calls substituteWithEnv with substitutionPattern', () => {
    hydrateConfigInited(mockedConfig)

    expect(mockedSubstituteWithEnv).toHaveBeenCalledWith(
      mockedParameters.substitutionPattern
    )
  })

  it('adds runtimeEnv as top-level field', () => {
    expect(hydrateConfigInited(mockedConfig)).toEqual(
      expect.objectContaining({
        [mockedParameters.runtimeEnvName]: runtimeEnv,
      })
    )
  })

  it('returns the expected result', () => {
    expect(hydrateConfigInited(mockedConfig)).toEqual(mockedHydratedConfig)
  })
})
