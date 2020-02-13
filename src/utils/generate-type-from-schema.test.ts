import { defaultOptions, TypeOptions } from '../options'

const configRoot = 'config'
const mockedTypes = defaultOptions.types as TypeOptions

const mockedCompiledTypes = `
  export interface TheTopLevelInterface {
    name: string;
    otherField: number;
  }
`
const expectedRootType = `export interface Config extends TheTopLevelInterface {
  runtimeEnv: string;
}
`
const mockedSchemaString = `
  {
    "title": "the top-level-interface"
  }
`
const mockedSchemaStringWithoutTitle = `
  {
    "required": ["field"],
    "description": "This is a description"
  }
`
const mockedSchemaStringWithInvalidTitle = `
  {
    "title": "config",
    "description": "This is a description"
  }
`

jest.mock('fs')
jest.mock('json-schema-to-typescript')

import fs from 'fs'
import { compileFromFile } from 'json-schema-to-typescript'

const mockedFs = fs as jest.Mocked<typeof fs>
const mockedCompileFromFile = compileFromFile as jest.MockedFunction<
  typeof compileFromFile
>

mockedFs.readFileSync = jest.fn().mockReturnValue(mockedSchemaString)
mockedFs.writeFileSync = jest.fn().mockReturnValue(undefined)
mockedCompileFromFile.mockResolvedValue(mockedCompiledTypes)

import { pascalCase, generateTypeFromSchema } from './generate-type-from-schema'

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
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('given a configRoot with a valid schema.json file', () => {
    it('generates a TypeScript file with corresponding type definitionas', async () => {
      const expectedTypes = `${mockedCompiledTypes}${expectedRootType}`
      const typeOptions = mockedTypes as TypeOptions

      await generateTypeFromSchema(configRoot, mockedTypes)

      expect(mockedFs.writeFileSync).toHaveBeenCalledWith(
        typeOptions.filePath,
        expectedTypes
      )
    })
  })

  it('throws when top-level schema definition does not have a title field', async () => {
    mockedFs.readFileSync.mockReturnValueOnce(mockedSchemaStringWithoutTitle)

    await expect(
      generateTypeFromSchema(configRoot, mockedTypes)
    ).rejects.toThrowError(Error)
  })

  it('throws when top-level schema definition has invalid title field', async () => {
    mockedFs.readFileSync.mockReturnValueOnce(
      mockedSchemaStringWithInvalidTitle
    )

    await expect(
      generateTypeFromSchema(configRoot, mockedTypes)
    ).rejects.toThrow(Error)
  })
})
