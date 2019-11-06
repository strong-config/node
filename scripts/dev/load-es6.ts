import StrongConfig from '../../src'

const strongConfig = new StrongConfig({
  configPath: 'example/',
  schemaPath: 'example/schema.json',
})

const config = strongConfig.load()

console.log(JSON.stringify(config))
