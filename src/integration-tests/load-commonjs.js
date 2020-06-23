/* eslint-disable @typescript-eslint/no-var-requires */
const { inspect } = require('util')

// We want to use the actual compiled JS here to make sure the final npm package works
const StrongConfig = require('../../lib/core')

const strongConfig = new StrongConfig({
  configRoot: 'example/',
})

const config = strongConfig.getConfig()

console.log('\nLoaded Config:\n')
console.log(inspect(config, { colors: true, compact: false }))
console.log('\n')
