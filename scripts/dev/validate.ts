import StrongConfig = require('../../src/core')

const strongConfig = new StrongConfig({
  configRoot: 'example/',
})

let validationResult, validationError

try {
  validationResult = strongConfig.validate()
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
