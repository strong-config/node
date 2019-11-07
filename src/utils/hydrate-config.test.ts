jest.mock('./substitute-with-env')
import { substituteWithEnv } from './substitute-with-env'
import { defaultOptions } from '../options'

const mockedSubstituteWithEnv = substituteWithEnv as jest.MockedFunction<
  typeof substituteWithEnv
>
const mockedOptions = defaultOptions
const runtimeEnv = 'test'
const mockedConfig = {
  field: 'value',
  replaceMe: '${asdf}',
}
const mockedSubstitutedConfig = '{"field":"value","replaceMe":"PASTE"}'
const mockedHydratedConfig = {
  ...mockedConfig,
  replaceMe: 'PASTE',
  runtimeEnv,
}
mockedSubstituteWithEnv.mockReturnValue(() => mockedSubstitutedConfig)

import { hydrateConfig } from './hydrate-config'
const hydrateConfigInited = hydrateConfig(runtimeEnv, mockedOptions)

describe('hydrateConfig()', () => {
  it('calls substituteWithEnv with substitutionPattern', () => {
    hydrateConfigInited(mockedConfig)

    expect(mockedSubstituteWithEnv).toHaveBeenCalledWith(
      mockedOptions.substitutionPattern
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
    expect(hydrateConfigInited(mockedConfig)).toEqual(mockedHydratedConfig)
  })
})
