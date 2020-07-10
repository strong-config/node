import matchAll from 'match-all'
import { substituteWithEnv } from './substitute-with-env'

jest.mock('match-all', () => {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  const matchAllOriginal = jest.requireActual('match-all')

  return jest.fn().mockImplementation(matchAllOriginal)
})

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
      const config = { field: 'value', otherField: 'other-value' }

      expect(substituteWithEnv(config)).toStrictEqual(config)
    })
  })

  describe('given a string WITH substitutable values', () => {
    it('substitutes all valid ${...} expressions with the respective env var value', () => {
      const config = { field: '${SOME_ENV_VAR}', otherField: '${REPLACE_ME}' }

      expect(substituteWithEnv(config)).toStrictEqual({
        field: process.env.SOME_ENV_VAR,
        otherField: process.env.REPLACE_ME,
      })
    })

    it('throws when an environment variable is not set', () => {
      const config = { field: '${NOT_SET}' }

      expect(() => substituteWithEnv(config)).toThrow(
        /Environment variable "NOT_SET" is undefined/
      )
    })

    it('throws when an environment variable starts with a string', () => {
      const config = { field: '${0INVALID}' }

      expect(() => substituteWithEnv(config)).toThrow(
        /Environment variable must not start with a digit/
      )
    })

    it('throws when config value has empty substitution pattern ${}', () => {
      const config = { field: '${}', otherField: '${REPLACE_ME}' }

      expect(() => substituteWithEnv(config)).toThrow(
        "Config can't contain empty substitution template '${}'"
      )
    })

    it('throws when template ${...} contains invalid characters', () => {
      const config = {
        field: '${NO_$PEC!AL_CHARS_ALLOWED}',
        otherField: '${REPLACE_ME}',
      }

      expect(() => substituteWithEnv(config)).toThrow(
        `Env vars 'NO_$PEC!AL_CHARS_ALLOWED' contain unsupported characters. Env var names should only contain a-z, A-Z, 0-9, and _`
      )
    })
  })

  it('uses a polyfill for String.prototype.matchAll in older Node versions', () => {
    // eslint-disable-next-line @typescript-eslint/unbound-method
    const originalImplementation = String.prototype.matchAll

    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore explicitly testing error case here
    String.prototype.matchAll = undefined

    const config = { field: 'value', otherField: 'other-value' }

    substituteWithEnv(config)
    expect(matchAll).toHaveBeenCalled()

    String.prototype.matchAll = originalImplementation
  })
})
