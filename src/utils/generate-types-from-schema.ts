import { callbackify } from 'util'
import { readFileSync, writeFileSync } from 'fs'
import { compileFromFile } from 'json-schema-to-typescript'
import Debug from 'debug'
import type { JSONObject } from '../types'
import { pascalCase } from './pascal-case'

const debug = Debug('strong-config:generate-types')

export const generateTypesFromSchema = async (
  configRoot: string,
  typesPath: string
): Promise<void> => {
  const schemaPath = `${configRoot}/schema.json`

  const baseTypes = await compileFromFile(schemaPath, {
    style: { semi: false },
  })
  debug(`Compiled base types from ${schemaPath} : %s`, '\n'.concat(baseTypes))

  const schemaString = readFileSync(schemaPath).toString()
  debug('Read schema file: %s', '\n'.concat(schemaString))

  const parsedSchemaString = JSON.parse(schemaString) as JSONObject
  debug('Parsed schema string to JSON:\n%O\n', parsedSchemaString)

  const title = parsedSchemaString.title

  if (title === undefined) {
    throw new Error(
      "Expected top-level attribute 'title' in schema definition."
    )
  }

  if (typeof title !== 'string') {
    throw new TypeError(
      `'Title' attribute in schema definition must be a string, but is of type '${typeof title}'`
    )
  }

  if (title.toLowerCase() === 'config') {
    throw new Error(
      'Title attribute of top-level schema definition must not be named Config or config'
    )
  }

  const configInterfaceAsString = `
export interface Config extends ${pascalCase(title)} {
  runtimeEnv: string
}`
  // eslint-disable-next-line unicorn/prefer-spread
  const exportedTypes = baseTypes.concat(configInterfaceAsString)

  writeFileSync(`${typesPath}/config.d.ts`, exportedTypes)
  debug(
    `Wrote generated types to file '${typesPath}/config.d.ts': %s`,
    '\n'.concat(exportedTypes)
  )
}

export const generateTypesFromSchemaCallback = callbackify(
  generateTypesFromSchema
)
