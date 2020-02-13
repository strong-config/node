import validateJsonAgainstSchema from '../utils/validate-json-against-schema'
import { optionsSchema } from './schema'

import { JSONObject } from '../types'
import { Options } from '.'

export const validateOptions = (options: Options): Options =>
  validateJsonAgainstSchema(
    (options as unknown) as JSONObject,
    optionsSchema
  ) && options

export default validateOptions
