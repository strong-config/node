import { isNil } from 'ramda'
import { normalize } from 'path'
import { JSONSchema4 } from 'json-schema'

import * as sops from './utils/sops'
import { defaultOptions, ConfigFileExtensions } from './options'

// Utils
import { findConfigFilesAtPath } from './utils/find-files'
import { readSchemaFile } from './utils/read-file'
import { getFileFromPath } from './utils/get-file-from-path'
import validateJsonAgainstSchema from './utils/validate-json-against-schema'

export const validate = (
  fileName: string,
  configRoot: string = defaultOptions.configRoot
): true => {
  /* istanbul ignore next: no need to test that a node built-in works correctly */
  const normalizedConfigRoot = normalize(configRoot)
  const normalizedFileName = Object.values(ConfigFileExtensions).find((ext) =>
    fileName.endsWith(ext)
  )
    ? fileName
    : findConfigFilesAtPath(normalizedConfigRoot, fileName)[0]

  const configFile = getFileFromPath(normalizedFileName)
  const schemaFile = readSchemaFile(normalizedConfigRoot)

  const decryptedConfig = sops.decryptToObject(
    configFile.filePath,
    configFile.contents
  )

  if (isNil(schemaFile)) {
    throw new Error(
      '[💪 strong-config] ❌ No schema file found. Cannot validate without a schema.'
    )
  }

  let schema
  if (schemaFile.contents.title !== 'Schema for strong-config options') {
    /*
     * Here we add the 'runtimeEnv' prop to the user's schema because we also
     * hydrate every config object with a 'runtimeEnv' prop automatically.
     *
     * So if the user were to strictly define their schema and forbid arbitrary
     * properties via the json-schema attribute 'additionalProperties: false',
     * then 'ajv' would find an unexpected property 'runtimeEnv' in the config
     * object and would (rightfully) fail the schema validation.
     */
    const augmentedSchema: JSONSchema4 = schemaFile.contents
    augmentedSchema.properties
      ? (augmentedSchema.properties['runtimeEnv'] = { type: 'string' })
      : (augmentedSchema['properties'] = { runtimeEnv: { type: 'string' } })

    schema = augmentedSchema
  } else {
    schema = schemaFile.contents
  }

  return validateJsonAgainstSchema(decryptedConfig, schema)
}

export default validate
