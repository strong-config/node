import { inspect } from 'util'
import StrongConfig from '../../src'

const strongConfig = new StrongConfig({
  configPath: 'example/',
  schemaPath: 'example/schema.json',
})

const config = strongConfig.load()

console.log('\nLoaded Config:\n')
console.log(inspect(config, { colors: true, compact: false }))
console.log('\n')
