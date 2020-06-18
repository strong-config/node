import { normalize } from 'path'
import fs from 'fs'
import Ajv from 'ajv'
import { isNil } from 'ramda'
import * as sops from './utils/sops'
import { defaultOptions } from './options'
import {
  readConfigForEnv,
  readConfigFromPath,
  readSchemaFromConfigRoot,
} from './utils/read-file'

export const validateConfigForEnv = (
  runtimeEnvOrPath: string,
  configRoot: string = defaultOptions.configRoot
): true => {
  const configFile = fs.existsSync(normalize(runtimeEnvOrPath))
    ? readConfigFromPath(normalize(runtimeEnvOrPath))
    : readConfigForEnv(runtimeEnvOrPath, configRoot)

  const schema = readSchemaFromConfigRoot(configRoot)

  if (isNil(schema)) {
    throw new Error(
      '[💪 strong-config] ❌ No schema file found. Cannot validate without a schema.'
    )
  }

  const decryptedConfig = sops.decryptToObject(
    configFile.filePath,
    configFile.contents
  )

  /*
   * We auto-add the 'runtimeEnv' prop to the user's schema because we
   * hydrate every config object with a 'runtimeEnv' prop.
   *
   * So if the user were to strictly define their schema and forbid arbitrary
   * properties via the json-schema attribute 'additionalProperties: false',
   * then 'ajv' would find an unexpected property 'runtimeEnv' in the config
   * object and would (rightfully) fail the schema validation.
   */
  schema.properties
    ? (schema.properties['runtimeEnv'] = { type: 'string' })
    : (schema['properties'] = { runtimeEnv: { type: 'string' } })

  const ajv = new Ajv({ allErrors: true, useDefaults: true })

  if (!ajv.validate(schema, decryptedConfig)) {
    throw new Error(ajv.errorsText())
  }

  return true
}
