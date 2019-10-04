import { substituteWithEnv } from './substitute-with-env'

const mockedProcessEnv = {
  replace: 'REPLACED',
  ABC: 'SOME_ENV_VAR_VALUE',
  '0INVALID': 'INVALID KEY',
}

describe('substituteWithEnv()', () => {
  const OLD_PROCESS_ENV = process.env

  beforeAll(() => {
    process.env = mockedProcessEnv
  })

  afterAll(() => {
    process.env = OLD_PROCESS_ENV
  })

  it('returns strings without any substitutions as is', () => {
    const input = '{"field":"value","otherField":"whatever"}'

    expect(substituteWithEnv(input)).toBe(input)
  })

  it('substitutes all valid ${...}', () => {
    const input = '{"field":"${ABC}","otherField":"${replace}"}'

    expect(substituteWithEnv(input)).toBe(
      '{"field":"SOME_ENV_VAR_VALUE","otherField":"REPLACED"}'
    )
  })

  it('throws when an environment variable is not set', () => {
    const input = '{"field":"${NOT_SET}","otherField":"${replace}"}'

    expect(() => substituteWithEnv(input)).toThrow(/process.env is missing key/)
  })

  it('throws when an environment variable starts with a string', () => {
    const input = '{"field":"${0INVALID}","otherField":"${REPLACE}"}'

    expect(() => substituteWithEnv(input)).toThrow(
      /Environment variable must not start with a digit/
    )
  })

  test.todo('throws when template ${} is found')
  test.todo('throws when template ${...} contains invalid characters')
})
