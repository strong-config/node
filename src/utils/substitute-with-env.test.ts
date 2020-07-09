import { substituteWithEnv } from './substitute-with-env'

describe('substituteWithEnv()', () => {
  const OLD_PROCESS_ENV = process.env

  beforeAll(() => {
    process.env = {
      REPLACE_ME: 'REPLACED',
      SOME_ENV_VAR: 'an-env-var-value',
      '0INVALID': 'INVALID KEY',
    }
  })

  afterAll(() => {
    process.env = OLD_PROCESS_ENV
  })

  describe('given a string WITHOUT any substitutable values', () => {
    it('returns the same value it received as input', () => {
      const input = '{"field": "value", "otherField": "other-value"}'

      expect(substituteWithEnv(input)).toBe(input)
    })
  })

  describe('given a string WITH substitutable values', () => {
    it('substitutes all valid ${...} expressions with the respective env var value', () => {
      const input =
        '{ "field": "${SOME_ENV_VAR}", "otherField": "${REPLACE_ME}" }'
      // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
      const substitutedOutput = `{ "field": "${process.env.SOME_ENV_VAR}", "otherField": "${process.env.REPLACE_ME}" }`

      expect(substituteWithEnv(input)).toBe(substitutedOutput)
    })

    it('throws when an environment variable is not set', () => {
      const input = '{ "field": "${NOT_SET}" }'

      expect(() => substituteWithEnv(input)).toThrow(
        /Environment variable "NOT_SET" is undefined/
      )
    })

    it('throws when an environment variable starts with a string', () => {
      const input = '{ "field": "${0INVALID}" }'

      expect(() => substituteWithEnv(input)).toThrow(
        /Environment variable must not start with a digit/
      )
    })

    it('throws when config value has empty substitution pattern ${}', () => {
      const input = '{ "field": "${}", "otherField": "${REPLACE_ME}" }'

      expect(() => substituteWithEnv(input)).toThrow(
        "Config can't contain empty substitution template '${}'"
      )
    })

    it('throws when template ${...} contains invalid characters', () => {
      const input =
        '{ "field": "${NO_$PEC!AL_CHARS_ALLOWED}", "otherField": "${REPLACE_ME}" }'

      expect(() => substituteWithEnv(input)).toThrow(
        `Env vars 'NO_$PEC!AL_CHARS_ALLOWED' contain unsupported characters. Env var names should only contain a-z, A-Z, 0-9, and _`
      )
    })
  })
})
