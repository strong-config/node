import chalk from 'chalk'
import type { Schema } from '../types'

// Needed for commonjs compatibility
// eslint-disable-next-line @typescript-eslint/no-require-imports
import StrongConfig = require('../core')

console.log(chalk.bold('\nIntegration Test: Validation without base config'))

const strongConfig = new StrongConfig({
  configRoot: 'example',
})

const config = strongConfig.getConfig()
let schema = strongConfig.getSchema() as Schema

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

console.log(chalk.bold('Integration Test: Validation with base config'))

const strongConfigWithBaseConfig = new StrongConfig({
  configRoot: 'example-with-base-config',
})

const mergedConfig = strongConfigWithBaseConfig.getConfig()
schema = strongConfigWithBaseConfig.getSchema() as Schema

try {
  validationResult = strongConfigWithBaseConfig.validate(mergedConfig, schema)
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
