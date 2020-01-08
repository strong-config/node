import { defaultOptions, TypeOptions } from '../options'

// define string here and not import from defaultOptions as defaultOptions.schemaPath can be null
const mockedSchemaPath = 'some/path/to/schema.json'
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

  it('calls compileFromFile with a file path', async () => {
    await generateTypeFromSchema(mockedSchemaPath, mockedTypes)

    expect(mockedCompileFromFile).toHaveBeenCalledWith(mockedSchemaPath)
  })

  it('reads the file at filePath', async () => {
    await generateTypeFromSchema(mockedSchemaPath, mockedTypes)

    expect(mockedFs.readFileSync).toHaveBeenCalledWith(mockedSchemaPath)
  })

  it('generates correct types', async () => {
    const expectedTypes = `${mockedCompiledTypes}${expectedRootType}`
    const typeOptions = mockedTypes as TypeOptions

    await generateTypeFromSchema(mockedSchemaPath, mockedTypes)

    expect(mockedFs.writeFileSync).toHaveBeenCalledWith(
      typeOptions.filePath,
      expectedTypes
    )
  })

  it('throws when top-level schema definition does not have a title field', async () => {
    mockedFs.readFileSync.mockReturnValueOnce(mockedSchemaStringWithoutTitle)

    await expect(
      generateTypeFromSchema(mockedSchemaPath, mockedTypes)
    ).rejects.toThrowError(Error)
  })

  it('throws when top-level schema definition has invalid title field', async () => {
    mockedFs.readFileSync.mockReturnValueOnce(
      mockedSchemaStringWithInvalidTitle
    )

    await expect(
      generateTypeFromSchema(mockedSchemaPath, mockedTypes)
    ).rejects.toThrow(Error)
  })
})
