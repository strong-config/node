#!/usr/bin/env node
import { Command, flags as Flags } from '@oclif/command'
import Ajv from 'ajv'
import addFormats from 'ajv-formats'
import fastGlob from 'fast-glob'
import ora from 'ora'
import { formatAjvErrors } from '../utils/format-ajv-errors'
import { defaultOptions } from '../options'
import { loadSchema, loadConfigFromPath } from '../utils/load-files'
import * as sops from '../utils/sops'
import { DecryptedConfig, Schema } from '../types'

export const validateOneConfigFile = (
  configPath: string,
  configRoot: string,
  schema: Schema
): boolean => {
  const spinner = ora(`Validating ${configPath}...`).start()
  const ajv = new Ajv({ allErrors: true, useDefaults: true })
  addFormats(ajv)

  try {
    spinner.text = `Loading config: ${configPath}`
    spinner.render()
    const configFile = loadConfigFromPath(configPath, configRoot)

    spinner.text = `Decrypting config with sops...`
    spinner.render()
    const decryptedConfig: DecryptedConfig = sops.decryptToObject(
      configFile.filePath,
      configFile.contents
    )

    spinner.text = 'Validating config against schema...'
    spinner.render()

    if (!ajv.validate(schema, decryptedConfig)) {
      spinner.fail(
        `${configPath} is invalid:\n${formatAjvErrors(ajv.errorsText())}\n`
      )

      return false
    } else {
      spinner.succeed(`${configPath} is valid!`)

      return true
    }
  } catch (error) {
    spinner.fail(`${configPath} => Error during validation:`)
    console.error(error, '\n')

    return false
  }
}

export class Validate extends Command {
  static description = 'validate config file(s) against a JSON schema'

  static strict = false

  static flags = {
    'config-root': Flags.string({
      char: 'c',
      description: 'your config folder containing your config files and schema',
      default: defaultOptions.configRoot,
    }),
    help: Flags.help({
      char: 'h',
      description: 'show help',
    }),
  }

  static args = [
    {
      name: 'config_file',
      description:
        '[optional] path to a specific config file to validate. if omitted, all config files will be validated',
      required: false,
    },
  ]

  static usage = 'validate [CONFIG_FILE]'

  static examples = [
    '$ validate',
    '$ validate config/development.yaml',
    '$ validate --config-root ./nested/config-folder',
    '$ validate --help',
  ]

  async validateAllConfigFiles(
    configRoot: string,
    schema: Schema
  ): Promise<boolean> {
    const spinner = ora(
      `Validating all config files in ${configRoot}...`
    ).start()

    const globPattern = `${configRoot}/**/*.{yml,yaml}`
    const configFiles = await fastGlob(globPattern)

    if (configFiles.length === 0) {
      spinner.fail(`Found no config files in '${globPattern}'`)
      process.exit(1)
    }

    const validationResults = configFiles.map((configPath) =>
      validateOneConfigFile(configPath, configRoot, schema)
    )

    if (validationResults.includes(false)) {
      console.log('\n')
      spinner.fail('Validation failed')

      return false
    } else {
      spinner.stop()

      return true
    }
  }

  async run(): Promise<void> {
    const { argv, flags } = this.parse(Validate)
    const configRoot = flags['config-root']
    const spinner = ora(`Loading schema from: ${configRoot}`).start()
    const schema = loadSchema(configRoot)

    if (!schema) {
      spinner.fail(
        `No schema found in your config root ./${configRoot}/schema.json\nCan't validate config without a schema because there's nothing to validate against :)\nPlease create a 'schema.json' in your config folder\n`
      )
      process.exit(1)
    }

    if (argv.length > 0) {
      for (const configPath of argv) {
        validateOneConfigFile(configPath, configRoot, schema) || process.exit(1)
      }

      process.exit(0)
    } else {
      ;(await this.validateAllConfigFiles(configRoot, schema))
        ? process.exit(0)
        : process.exit(1)
    }

    process.exit(0)
  }
}
