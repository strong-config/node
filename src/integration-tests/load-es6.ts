import { inspect } from 'util'
import chalk from 'chalk'

// Needed for commonjs-compatibility
// eslint-disable-next-line @typescript-eslint/no-require-imports
import StrongConfig = require('../core')

/*
 * LOAD WITHOUT BASE CONFIG
 */
console.log(
  chalk.bold('\nIntegration Test: Load config without base config [ES6]')
)

const strongConfig = new StrongConfig({
  configRoot: 'example',
})

const config = strongConfig.getConfig()

console.log(
  `\n✅ Loaded '${chalk.bold(process.env.NODE_ENV || 'undefined')}' config:\n`
)
console.log(inspect(config, { colors: true, compact: false }))
console.log('\n')

/*
 * LOAD WITH BASE CONFIG
 */
console.log(
  chalk.bold('Integration Test: Load config extended from base config [ES6]')
)
const strongConfigWithBaseConfig = new StrongConfig({
  configRoot: 'example-with-base-config',
})

const mergedConfig = strongConfigWithBaseConfig.getConfig()

console.log(
  `\n✅ Loaded '${chalk.bold(
    process.env.NODE_ENV || 'undefined'
  )}' config extended from base config:\n`
)
console.log(inspect(mergedConfig, { colors: true, compact: false }))
console.log('\n')

/*
 * ERROR CASES
 */
console.log(
  chalk.bold('Integration Test: Base config can not contain secrets [ES6]')
)

try {
  new StrongConfig({
    configRoot: 'example-with-base-config-containing-secrets',
  })
} catch (error) {
  if (
    error.message !==
    "Secret detected in example-with-base-config-containing-secrets/base.yml config. Base config files can not contain secrets because when using different encryption keys per environment, it's unclear which key should be used to encrypt the base config."
  ) {
    throw new Error(
      'Instantiating strong-config with a base config that contains secrets should fail, but is has not 🤔'
    )
  }
}

console.log(`\n✅ Failed as expected\n`)

console.log(
  chalk.bold(
    'Integration Test: Base config and runtimeEnv cannot have the same name [ES6]'
  )
)

try {
  new StrongConfig({
    configRoot: 'example-with-base-config',
    baseConfig: 'development.yml',
  })
} catch (error) {
  if (
    error.message !==
    `Base config name 'development.yml' must be different from the environment-name 'development'. Base config and env-specific config can't be the same file.`
  ) {
    throw new Error(
      "Instantiating strong-config with a base config whose name is identical to the runtimeEnv (e.g. baseConfig: 'development.yml', process.env.NODE_ENV: 'development') should fail, but it hasn't 🤔"
    )
  }
}

console.log(`\n✅ Failed as expected\n`)
