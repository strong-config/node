/* eslint-disable @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-assignment */
import StrongConfig = require('@strong-config/node')
import chalk from 'chalk'
import type { Schema } from '../types'

console.log(chalk.bold('\nE2E Test: Validate config without base config'))

const strongConfig = new StrongConfig()

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

console.log(chalk.bold('E2E Test: Validate config with base config'))

const strongConfigWithBaseConfig = new StrongConfig()

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
