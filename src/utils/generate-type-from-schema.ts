import { compileFromFile } from 'json-schema-to-typescript'
import { readFileSync, writeFileSync } from 'fs'
import { prop } from 'ramda'
import { callbackify } from 'util'

import { TypeOptions } from '../options'

/*
 * json-schema-to-typescript uses a `toSafeString(string)` function to obtain a normalized string.
 * This pascalCase mimics this functionality and should address most cases.
 * => https://github.com/bcherny/json-schema-to-typescript/blob/f41945f19b68918e9c13885f345cb708e1d9898a/src/utils.ts#L163)
 */
export const pascalCase = (input: string): string =>
  input
    .split(/[^\dA-Za-z]+/g)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join('')

/*
 * Why callbackify a promise?
 * This is a necessary tradeoff to keep the load() function synchronous.
 * We are making this tradeoff in order to keep the burden on consuming
 * applications minimal to change their code for strong-config.
 *
 * If we kept this as a promise, then load() would become asynchronous which
 * would mean consuming applications would have to wrap all their code that uses
 * strong-config in 'async' blocks, which they may not want to do
 */
const compileFromFileSync = callbackify(compileFromFile)

export const generateTypeFromSchema = (
  configRoot: string,
  types: TypeOptions,
  callback: (err?: Error) => void
): void => {
  const schemaPath = `${configRoot}/schema.json`

  compileFromFileSync(
    schemaPath,
    {
      style: { semi: false },
    },
    // eslint-disable-next-line unicorn/prevent-abbreviations
    (err, baseTypes) => {
      if (err) {
        return callback(err)
      }

      const schemaString = readFileSync(schemaPath).toString()

      let parsedSchemaString

      try {
        parsedSchemaString = JSON.parse(schemaString) as Record<string, unknown>
      } catch (error) {
        const prettyError = new Error(
          `Failed to JSON.parse(schemaString):\n${schemaString}`
        )
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access -- error.stack should always be defined
        prettyError.stack = error.stack

        return callback(prettyError)
      }

      const title = prop('title', parsedSchemaString)

      if (title === undefined) {
        return callback(
          new Error('Expected title attribute in top-level schema definition.')
        )
      }

      if (typeof title !== 'string') {
        return callback(
          new Error(
            `Title attribute in top-level schema definition must be a string but is of type '${typeof title}'`
          )
        )
      }

      if (title.toLowerCase() === 'config') {
        return callback(
          new Error(
            'Title attribute of top-level schema definition must not be named Config or config'
          )
        )
      }

      const configInterfaceAsString = `
export interface ${types.rootTypeName} extends ${pascalCase(title)} {
  runtimeEnv: string
}`
      const exportedTypes = baseTypes.concat(configInterfaceAsString)

      writeFileSync(`${configRoot}/${types.fileName}`, exportedTypes)

      return callback()
    }
  )
}
