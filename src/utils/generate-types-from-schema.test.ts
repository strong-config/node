import fs from 'fs'
import { compileFromFile } from 'json-schema-to-typescript'
import { defaultOptions } from '../options'
import { generateTypesFromSchemaCallback } from './generate-types-from-schema'

/*
 * MOCKS
 */
jest.mock('fs')
jest.mock('json-schema-to-typescript')

describe('generateTypesFromSchema()', () => {
  const mockedSchemaString = `
{
  "title": "the top-level-interface"
}`

  const mockedFs = fs as jest.Mocked<typeof fs>
  mockedFs.readFileSync = jest.fn().mockReturnValue(mockedSchemaString)
  // eslint-disable-next-line unicorn/no-useless-undefined
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
    it('generates a TypeScript file with corresponding type definitionas', (done) => {
      const callback = () => {
        expect(mockedFs.writeFileSync).toHaveBeenCalledWith(
          `${defaultOptions.configRoot}/${defaultOptions.types.fileName}`,
          expectedTypes
        )

        done()
      }

      const expectedRootType = `
export interface Config extends TheTopLevelInterface {
  runtimeEnv: string
}`
      const expectedTypes = `${mockedCompiledTypes}${expectedRootType}`

      generateTypesFromSchemaCallback(
        defaultOptions.configRoot,
        defaultOptions.types,
        callback
      )
    })
  })

  it('throws when top-level schema definition does not have a title field', (done) => {
    const callback = (error?: Error) => {
      expect(error).toBeInstanceOf(Error)
      done()
    }

    const mockedSchemaStringWithoutTitle = `{
      "required": ["field"],
      "description": "This is a description"
    }`
    mockedFs.readFileSync.mockReturnValueOnce(mockedSchemaStringWithoutTitle)

    generateTypesFromSchemaCallback(
      defaultOptions.configRoot,
      defaultOptions.types,
      callback
    )
  })

  it('throws when top-level schema definition has invalid title field', (done) => {
    const callback = (error?: Error) => {
      expect(error).toBeInstanceOf(Error)
      done()
    }

    const mockedSchemaStringWithInvalidTitle = `{
      "title": "config",
      "description": "This is a description"
    }`
    mockedFs.readFileSync.mockReturnValueOnce(
      mockedSchemaStringWithInvalidTitle
    )
    generateTypesFromSchemaCallback(
      defaultOptions.configRoot,
      defaultOptions.types,
      callback
    )
  })
})
