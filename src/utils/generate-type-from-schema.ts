import { compileFromFile } from 'json-schema-to-typescript'
import fs from 'fs'
import R from 'ramda'

import { Parameters } from '../params'

// json-schema-to-typescript uses a `toSafeString(string)` function https://github.com/bcherny/json-schema-to-typescript/blob/f41945f19b68918e9c13885f345cb708e1d9898a/src/utils.ts#L163) to obtain a normalized string. This pascalCase mimics this functionality and should address most cases.
export const pascalCase = (input: string): string =>
  input
    .split(/[^a-zA-Z0-9]+/g)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join('')

export const generateTypeFromSchema = async ({
  runtimeEnvName,
  schemaPath,
  types,
}: Parameters): Promise<void> => {
  if (types === false) {
    return
  }

  const baseTypes = await compileFromFile(schemaPath)

  const schemaString = fs.readFileSync(schemaPath).toString()
  const title = R.prop('title', JSON.parse(schemaString))

  if (title === undefined) {
    throw new Error('Expected title attribute in top-level schema definition.')
  }

  if (title.toLowerCase() === 'config') {
    throw new Error(
      'Title attribute of top-level schema definition must not be named Config or config'
    )
  }

  const configInterfaceAsString = `export interface ${
    types.rootTypeName
  } extends ${pascalCase(title)} {
  ${runtimeEnvName}: string;
}
`
  const exportedTypes = baseTypes.concat(configInterfaceAsString)

  fs.writeFileSync(types.filePath, exportedTypes)
}
