import { hasSecrets } from './has-secrets'

describe('hasSecrets()', () => {
  it('should return true if a given config object contains secrets', () => {
    const config = {
      some: 'value',
      and: { a: { deeply: { nested: 'value' } } },
      someSecret: 'i am not allowed in a base config 😞',
    }

    expect(hasSecrets(config)).toBe(true)
  })

  it('should return true if a given config object contains deeply nested secrets', () => {
    const config = {
      some: 'value',
      and: { a: { deeply: { nestedSecret: 'value' } } },
    }

    expect(hasSecrets(config)).toBe(true)
  })

  it('should return false if a given config object does not contain secrets', () => {
    const config = {
      some: 'value',
      and: { a: { deeply: { nested: 'value' } } },
    }

    expect(hasSecrets(config)).toBe(false)
  })
})
