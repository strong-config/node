import StrongConfig from '../../src'

const strongConfig = new StrongConfig({
  configPath: 'example/',
  schemaPath: 'example/schema.json',
})

const validationResult = strongConfig.validate()

console.log(validationResult)
