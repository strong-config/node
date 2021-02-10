import { pascalCase } from './pascal-case'

describe('utils :: pascal-case', () => {
  describe('pascalCase()', () => {
    it.each([
      ['name', 'Name'],
      ['some-name', 'SomeName'],
      ['some name', 'SomeName'],
      ['some name----asdf', 'SomeNameAsdf'],
      ['some name----asdf !@#($@^!)#% camelCase', 'SomeNameAsdfCamelCase'],
    ])('given %s, it correctly pascalCases to %s', (input, expectedOutput) => {
      expect(pascalCase(input)).toBe(expectedOutput)
    })
  })
})
