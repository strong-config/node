/* eslint-disable @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access */
import { inspect } from 'util'
// eslint-disable-next-line import/no-unresolved
import StrongConfig = require('@strong-config/node')

// eslint-disable-next-line @typescript-eslint/no-unsafe-call
const strongConfig = new StrongConfig({
  configRoot: 'example',
})

const config = strongConfig.getConfig()

console.log('\nLoaded Config:\n')
console.log(inspect(config, { colors: true, compact: false }))
console.log('\n')
