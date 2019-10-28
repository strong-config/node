import Ajv from 'ajv'

import { JSONObject, Schema } from '../types'

const ajv = new Ajv({ useDefaults: true })

export const validateJson = (jsonObject: JSONObject, schema: Schema): true => {
  const validate = ajv.compile(schema)

  if (!validate(jsonObject)) {
    throw new Error(ajv.errorsText())
  }

  return true
}
