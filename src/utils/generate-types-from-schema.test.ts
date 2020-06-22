import fs from 'fs'
import * as jsonSchemaToTypescript from 'json-schema-to-typescript'
import { defaultOptions } from '../options'
import { generateTypesFromSchema } from './generate-types-from-schema'

describe('generateTypesFromSchema()', () => {
  const compiledTypes = `
export interface TheTopLevelInterface {
  name: string
  otherField: number
}`

  let readFileSyncSpy: jest.SpyInstance

  beforeEach(() => {
    jest.spyOn(fs, 'writeFileSync').mockImplementation()
    jest
      .spyOn(jsonSchemaToTypescript, 'compileFromFile')
      .mockResolvedValue(compiledTypes)
    readFileSyncSpy = jest.spyOn(fs, 'readFileSync')
    jest.clearAllMocks()
  })

  describe('given a configRoot with a valid schema.json file', () => {
    it('generates a TypeScript file with corresponding type definitionas', async () => {
      readFileSyncSpy.mockReturnValueOnce(
        `{ "title": "the top-level-interface" }`
      )

      await generateTypesFromSchema(
        defaultOptions.configRoot,
        defaultOptions.types
      )

      const expectedRootType = `
export interface Config extends TheTopLevelInterface {
  runtimeEnv: string
}`
      const expectedTypes = compiledTypes.concat(expectedRootType)

      expect(fs.writeFileSync).toHaveBeenCalledWith(
        `${defaultOptions.configRoot}/${defaultOptions.types.fileName}`,
        expectedTypes
      )
    })
  })

  it('throws when top-level schema definition does not have a title field', async () => {
    readFileSyncSpy.mockReturnValueOnce(
      `{ "required": ["field"], "description": "This is a description" }`
    )

    await expect(async () =>
      generateTypesFromSchema(defaultOptions.configRoot, defaultOptions.types)
    ).rejects.toThrowError(
      "Expected top-level attribute 'title' in schema definition."
    )
  })

  it('throws when schema title is not a string', async () => {
    const title = true
    // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
    readFileSyncSpy.mockReturnValueOnce(`{ "title": ${title} }`)

    await expect(async () =>
      generateTypesFromSchema(defaultOptions.configRoot, defaultOptions.types)
    ).rejects.toThrowError(
      `'Title' attribute in schema definition must be a string, but is of type '${typeof title}'`
    )
  })

  it('throws when schema title is named "config" or "Config"', async () => {
    readFileSyncSpy.mockReturnValueOnce(`{ "title": "config" }`)

    await expect(async () =>
      generateTypesFromSchema(defaultOptions.configRoot, defaultOptions.types)
    ).rejects.toThrowError(
      'Title attribute of top-level schema definition must not be named Config or config'
    )
  })
})
