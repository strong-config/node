import { defaultOptions } from '../options'
import { substituteWithEnv } from './substitute-with-env'

describe('utils :: substitute-with-env', () => {
  describe('substituteWithEnv()', () => {
    const processEnvMock = {
      replace: 'REPLACED',
      ABC: 'SOME_ENV_VAR_VALUE',
      '0INVALID': 'INVALID KEY',
    }

    const substituteWithEnvInitialized = substituteWithEnv(
      defaultOptions.substitutionPattern
    )
    const OLD_PROCESS_ENV = process.env

    beforeAll(() => {
      process.env = processEnvMock
    })

    afterAll(() => {
      process.env = OLD_PROCESS_ENV
    })

    it('returns strings without any substitutions as is', () => {
      const input = '{"field":"value","otherField":"whatever"}'

      expect(substituteWithEnvInitialized(input)).toBe(input)
    })

    it('substitutes all valid ${...}', () => {
      const input = '{"field":"${ABC}","otherField":"${replace}"}'

      expect(substituteWithEnvInitialized(input)).toBe(
        '{"field":"SOME_ENV_VAR_VALUE","otherField":"REPLACED"}'
      )
    })

    it('throws when an environment variable is not set', () => {
      const input = '{"field":"${NOT_SET}","otherField":"${replace}"}'

      expect(() => substituteWithEnvInitialized(input)).toThrow(
        /process.env is missing key/
      )
    })

    it('throws when an environment variable starts with a string', () => {
      const input = '{"field":"${0INVALID}","otherField":"${REPLACE}"}'

      expect(() => substituteWithEnvInitialized(input)).toThrow(
        /Environment variable must not start with a digit/
      )
    })

    test.todo('throws when template ${} is found')
    test.todo('throws when template ${...} contains invalid characters')
  })
})
