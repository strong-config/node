import { compileFromFile } from 'json-schema-to-typescript'
import { readFileSync, writeFileSync } from 'fs'
import { prop } from 'ramda'

import { TypeOptions } from '../options'

/*
 * json-schema-to-typescript uses a `toSafeString(string)` function to obtain a normalized string.
 * This pascalCase mimics this functionality and should address most cases.
 * => https://github.com/bcherny/json-schema-to-typescript/blob/f41945f19b68918e9c13885f345cb708e1d9898a/src/utils.ts#L163)
 */
export const pascalCase = (input: string): string =>
  input
    .split(/[^a-zA-Z0-9]+/g)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join('')

export const generateTypeFromSchema = async (
  configRoot: string,
  types: TypeOptions
): Promise<void> => {
  const schemaPath = `${configRoot}/schema.json`
  const baseTypes = await compileFromFile(schemaPath, {
    style: { semi: false },
  })

  const schemaString = readFileSync(schemaPath).toString()
  const title = prop('title', JSON.parse(schemaString))

  if (title === undefined) {
    throw new Error('Expected title attribute in top-level schema definition.')
  }

  if (title.toLowerCase() === 'config') {
    throw new Error(
      'Title attribute of top-level schema definition must not be named Config or config'
    )
  }

  const configInterfaceAsString = `
export interface ${types.rootTypeName} extends ${pascalCase(title)} {
  runtimeEnv: string
}`
  const exportedTypes = baseTypes.concat(configInterfaceAsString)

  writeFileSync(`${configRoot}/${types.fileName}`, exportedTypes)
}
