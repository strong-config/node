import Ajv from 'ajv'
import { JSONObject, Schema } from '../types'

const ajv = new Ajv({ allErrors: true, useDefaults: true })

export const validateJsonAgainstSchema = (
  jsonObject: JSONObject,
  schema: Schema
): true => {
  const valid = ajv.validate(schema, jsonObject)

  if (!valid) {
    throw new Error(ajv.errorsText())
  }

  return true
}
