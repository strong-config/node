#!/usr/bin/env node
import { Command, flags as Flags } from '@oclif/command'
import ora from 'ora'
import { generateTypesFromSchema } from '../utils/generate-types-from-schema'
import { loadSchema } from '../utils/load-files'
import { defaultOptions } from '../options'

export class GenerateTypes extends Command {
  static description = 'generate typescript types based on a JSON schema'

  static strict = true

  static flags = {
    help: Flags.help({
      char: 'h',
      description: 'show help',
    }),
    'config-root': Flags.string({
      char: 'c',
      description: 'your config folder containing your schema.json',
      default: defaultOptions.configRoot,
    }),
    'types-path': Flags.string({
      char: 'p',
      description:
        'the path to the folder into which the config.d.ts type declaration will be generated',
    }),
  }

  static usage = 'generate-types'

  static examples = [
    '$ generate-types',
    '$ generate-types --config-root ./some/sub/folder/config',
    '$ generate-types -c ./some/sub/folder/config',
  ]

  async run(): Promise<void> {
    const { flags } = this.parse(GenerateTypes)
    const spinner = ora('Generating types...').start()

    if (!loadSchema(flags['config-root'])) {
      spinner.fail(
        "Didn't find schema file. Without a schema.json file inside your config directory we can't generate types."
      )

      process.exit(1)
    } else {
      try {
        await generateTypesFromSchema(
          flags['config-root'],
          flags['types-path'] || flags['config-root']
        )
      } catch (error) {
        spinner.fail("Couldn't generate types from schema")
        console.error(error)
      }

      spinner.succeed(
        `Successfully generated types to '${flags['config-root']}/config.d.ts' 💪`
      )
      process.exit(0)
    }
  }
}

export default GenerateTypes
