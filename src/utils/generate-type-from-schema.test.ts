import fs from 'fs'
import { compileFromFile } from 'json-schema-to-typescript'
import { pascalCase, generateTypeFromSchema } from './generate-type-from-schema'
import { defaultOptions, TypeOptions } from '../options'

/*
 * MOCKS
 */
jest.mock('fs')
jest.mock('json-schema-to-typescript')

describe('pascalCase()', () => {
  test.each([
    ['name', 'Name'],
    ['some-name', 'SomeName'],
    ['some name', 'SomeName'],
    ['some name----asdf', 'SomeNameAsdf'],
    ['some name----asdf !@#($@^!)#% camelCase', 'SomeNameAsdfCamelCase'],
  ])('given %s, it correctly pascalCases to %s', (input, expectedOutput) => {
    expect(pascalCase(input)).toBe(expectedOutput)
  })
})

describe('generateTypeFromSchema()', () => {
  const mockedTypes = defaultOptions.types as TypeOptions
  const mockedSchemaString = `
{
  "title": "the top-level-interface"
}`

  const mockedFs = fs as jest.Mocked<typeof fs>
  mockedFs.readFileSync = jest.fn().mockReturnValue(mockedSchemaString)
  mockedFs.writeFileSync = jest.fn().mockReturnValue(undefined)

  const mockedCompileFromFile = compileFromFile as jest.MockedFunction<
    typeof compileFromFile
  >
  const mockedCompiledTypes = `
export interface TheTopLevelInterface {
  name: string
  otherField: number
}`
  mockedCompileFromFile.mockResolvedValue(mockedCompiledTypes)

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('given a configRoot with a valid schema.json file', () => {
    it('generates a TypeScript file with corresponding type definitionas', async () => {
      const expectedRootType = `
export interface Config extends TheTopLevelInterface {
  runtimeEnv: string
}`
      const expectedTypes = `${mockedCompiledTypes}${expectedRootType}`
      const typeOptions = mockedTypes as TypeOptions

      await generateTypeFromSchema(defaultOptions.configRoot, mockedTypes)

      expect(mockedFs.writeFileSync).toHaveBeenCalledWith(
        `${defaultOptions.configRoot}/${typeOptions.fileName}`,
        expectedTypes
      )
    })
  })

  it('throws when top-level schema definition does not have a title field', async () => {
    const mockedSchemaStringWithoutTitle = `{
      "required": ["field"],
      "description": "This is a description"
    }`
    mockedFs.readFileSync.mockReturnValueOnce(mockedSchemaStringWithoutTitle)

    await expect(
      generateTypeFromSchema(defaultOptions.configRoot, mockedTypes)
    ).rejects.toThrowError(Error)
  })

  it('throws when top-level schema definition has invalid title field', async () => {
    const mockedSchemaStringWithInvalidTitle = `{
      "title": "config",
      "description": "This is a description"
    }`
    mockedFs.readFileSync.mockReturnValueOnce(
      mockedSchemaStringWithInvalidTitle
    )

    await expect(
      generateTypeFromSchema(defaultOptions.configRoot, mockedTypes)
    ).rejects.toThrow(Error)
  })
})
