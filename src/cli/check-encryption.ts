#!/usr/bin/env node
import path from 'path'
import { Command, flags as Flags } from '@oclif/command'
import fastGlob from 'fast-glob'
import ora from 'ora'
import { defaultOptions } from '../options'
import type { EncryptedConfig, JSONObject } from '../types'
import { loadConfigFromPath } from '../utils/load-files'
import { hasSecrets } from '../utils/has-secrets'

export class CheckEncryption extends Command {
  static description =
    'check that config file(s) with secrets are safely encrypted'

  static strict = false

  static flags = {
    help: Flags.help({
      char: 'h',
      description: 'show help',
    }),
    'config-root': Flags.string({
      char: 'c',
      description: 'your config folder containing your config files',
      default: defaultOptions.configRoot,
    }),
  }

  static args = [
    {
      name: 'config_file',
      description:
        '[optional] path to a specific config file to check. if omitted, all config files will be checked',
      required: false,
    },
  ]

  static usage = 'check-encryption [CONFIG_FILE]'

  static examples = [
    '$ check-encryption',
    '$ check',
    '$ check --config-root ./deeply/nested/config/folder',
    '$ check config/production.yaml',
    '$ check --help',
  ]

  static aliases = ['check']

  async checkAllConfigFiles(): Promise<void> {
    const spinner = ora('Checking all config files for encryption...').start()
    const { flags } = this.parse(CheckEncryption)

    const globPattern = `${flags['config-root']}/**/*.{yml,yaml}`
    const configFiles = await fastGlob(globPattern)

    if (configFiles.length === 0) {
      spinner.fail(`Found no config files in '${globPattern}'`)
      process.exit(1)
    }

    const checkResultsPerFile = configFiles.map((configPath) =>
      this.checkOneConfigFile(configPath)
    )

    if (checkResultsPerFile.includes(false)) {
      spinner.fail('Not all secrets are encrypted')
      process.exit(1)
    }

    spinner.succeed('Secrets in all config files are safely encrypted 💪')
  }

  checkOneConfigFile(rawPath: string): boolean {
    const configPath = path.normalize(rawPath)
    const spinner = ora(`Checking ${configPath} for encryption...`).start()
    const { flags } = this.parse(CheckEncryption)

    let configFile

    try {
      configFile = loadConfigFromPath(configPath, flags['config-root'])
    } catch {
      spinner.fail(
        `${configPath} doesn't exist.\nPlease either provide a valid path to a config file or don't pass any arguments to check all config files in '${flags['config-root']}'`
      )

      return false
    }

    if (this.isEncrypted(configFile.contents)) {
      spinner.succeed(`Secrets in ${configPath} are safely encrypted 💪`)

      return true
    } else if (!hasSecrets(configFile.contents)) {
      spinner.succeed(
        `No secrets found in ${configPath}, no encryption required.`
      )

      return true
    } else {
      spinner.fail(`Secrets in ${configPath} are NOT encrypted 🚨`)

      return false
    }
  }

  isEncrypted(configObject: JSONObject | EncryptedConfig): boolean {
    return Object.keys(configObject).includes('sops')
  }

  async run(): Promise<void> {
    const { argv } = this.parse(CheckEncryption)

    if (argv.length > 0) {
      for (const configPath of argv) {
        this.checkOneConfigFile(configPath) || process.exit(1)
      }

      process.exit(0)
    } else {
      await this.checkAllConfigFiles()
    }

    process.exit(0)
  }
}

export default CheckEncryption
