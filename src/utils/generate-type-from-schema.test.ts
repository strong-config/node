const mockFilePath = './config/schema.json'
const mockGeneratedTypesPath = 'strong-config.d.ts'
const mockedCompiledTypes = `
  export interface TheTopLevelInterface {
    name: string;
    otherField: number;
  }
`
const mockedRootType = `export interface Config extends TheTopLevelInterface {
  runtimeEnvironment: string;
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
    await generateTypeFromSchema(mockFilePath)

    expect(mockedCompileFromFile).toHaveBeenCalledWith(mockFilePath)
  })

  it('reads the file at filePath', async () => {
    await generateTypeFromSchema(mockFilePath)

    expect(mockedFs.readFileSync).toHaveBeenCalledWith(mockFilePath)
  })

  it('generates correct types', async () => {
    const expectedTypes = `${mockedCompiledTypes}${mockedRootType}`

    await generateTypeFromSchema(mockFilePath)

    expect(mockedFs.writeFileSync).toHaveBeenCalledWith(
      mockGeneratedTypesPath,
      expectedTypes
    )
  })

  it('throws when top-level schema definition does not have a title field', async () => {
    mockedFs.readFileSync.mockReturnValueOnce(mockedSchemaStringWithoutTitle)

    await expect(generateTypeFromSchema(mockFilePath)).rejects.toThrowError(
      Error
    )
  })

  it('throws when top-level schema definition has invalid title field', async () => {
    mockedFs.readFileSync.mockReturnValueOnce(
      mockedSchemaStringWithInvalidTitle
    )

    await expect(generateTypeFromSchema(mockFilePath)).rejects.toThrow(Error)
  })
})
