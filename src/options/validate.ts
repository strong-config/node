import { validateJson } from '../utils/validate-json'
import { optionsSchema } from './schema'

import { JSONObject } from '../types'
import { Options } from '.'

export const validate = (options: Options): Options =>
  validateJson((options as unknown) as JSONObject, optionsSchema) && options
