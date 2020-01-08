/* eslint-disable @typescript-eslint/no-var-requires */
const { inspect } = require('util')
const StrongConfig = require('../../lib')

const strongConfig = new StrongConfig({
  configPath: 'example/',
  // The following line can be omitted or set to `null` to disable schema validation
  schemaPath: 'example/schema.json',
})

const config = strongConfig.load()

console.log('\nLoaded Config:\n')
console.log(inspect(config, { colors: true, compact: false }))
console.log('\n')
