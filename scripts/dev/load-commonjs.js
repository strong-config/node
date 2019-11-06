// eslint-disable-next-line @typescript-eslint/no-var-requires
const StrongConfig = require('../../lib')

const strongConfig = new StrongConfig({
  configPath: 'example/',
  schemaPath: 'example/schema.json',
})

const config = strongConfig.load()

console.log(JSON.stringify(config))
