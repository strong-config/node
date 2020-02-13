import StrongConfig from '../../src'

const strongConfig = new StrongConfig({
  configRoot: 'example/',
})

let validationResult, validationError

try {
  validationResult = strongConfig.validate()
} catch (error) {
  validationResult = false
  validationError = error.message
}

console.log('\nValidation result: ')
if (validationResult) {
  console.log('✅ ', validationResult)
} else {
  console.log('❌ ', validationResult)
  console.log(validationError)
}
console.log('')
