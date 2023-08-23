#!/usr/bin/env node
import { Command, Flags } from '@oclif/core'
import ora from 'ora'
import { generateTypesFromSchema } from '../utils/generate-types-from-schema'
import { loadSchema } from '../utils/load-files'
import { defaultOptions } from '../options'

export class GenerateTypes extends Command {
  static description = 'generate typescript types based on a JSON schema'

  static flags = {
    'config-root': Flags.string({
      char: 'c',
      description: 'your config folder containing your schema.json',
      default: defaultOptions.configRoot,
    }),
    help: Flags.help({
      char: 'h',
    }),
    'types-path': Flags.string({
      char: 'p',
      description:
        'the path to the folder into which the config.d.ts type declaration will be generated',
    }),
  }

  static examples = [
    '<%= config.bin %> <%= command.id %>',
    '<%= config.bin %> <%= command.id %> --config-root ./some/sub/folder/config',
    '<%= config.bin %> <%= command.id %> -c ./some/sub/folder/config',
  ]

  async run(): Promise<void> {
    const { flags } = await this.parse(GenerateTypes)
    const spinner = ora('Generating types...').start()

    if (loadSchema(flags['config-root'])) {
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
    } else {
      spinner.fail(
        "Didn't find schema file. Without a schema.json file inside your config directory we can't generate types."
      )

      process.exit(1)
    }
  }
}

export default GenerateTypes
