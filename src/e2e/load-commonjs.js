// We want to use the actual compiled JS here to make sure the final npm package works
const { inspect } = require('util')
const StrongConfig = require('@strong-config/node')

const strongConfig = new StrongConfig()

const config = strongConfig.getConfig()

console.log('\nLoaded Config:\n')
console.log(inspect(config, { colors: true, compact: false }))
console.log('\n')
