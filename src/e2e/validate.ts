/* eslint-disable @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-assignment */
// eslint-disable-next-line import/no-unresolved
import StrongConfig = require('@strong-config/node')
import type { Schema } from '../types'

const strongConfig = new StrongConfig({
  configRoot: 'example/',
})

const config = strongConfig.getConfig()
const schema = strongConfig.getSchema() as Schema

let validationResult, validationError

try {
  validationResult = strongConfig.validate(config, schema)
} catch (error) {
  if (error instanceof Error) {
    validationResult = false
    validationError = error.message
  } else {
    throw error
  }
}

console.log('\nValidation result: ')

if (validationResult) {
  console.log('✅', validationResult)
} else {
  console.log('❌', validationResult)
  console.log(validationError)
}

console.log('')