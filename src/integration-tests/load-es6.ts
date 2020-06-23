import { inspect } from 'util'
import StrongConfig = require('../core')

const strongConfig = new StrongConfig({
  configRoot: 'example',
})

const config = strongConfig.getConfig()

console.log('\nLoaded Config:\n')
console.log(inspect(config, { colors: true, compact: false }))
console.log('\n')
