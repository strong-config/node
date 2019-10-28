import { validateJson } from '../utils/validate-json'
import { parametersSchema } from './schema'

import { JSONObject } from '../types'
import { Parameters } from '.'

export const validate = (parameters: Parameters): Parameters =>
  validateJson((parameters as unknown) as JSONObject, parametersSchema) &&
  parameters
