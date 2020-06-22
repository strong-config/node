#!/usr/bin/env node
import { Command, flags as Flags } from '@oclif/command'
import ora from 'ora'
import { generateTypesFromSchema } from '../utils/generate-types-from-schema'
import { loadSchema } from '../utils/read-files'
import { defaultOptions } from '../options'

export class GenerateTypes extends Command {
  static description = 'generate typescript types based on schema.json'

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
  }

  static usage = 'generate-types [--help]'

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
          defaultOptions.types
        )
      } catch (error) {
        spinner.fail("Couldn't generate types from schema")
        console.error(error)
      }

      spinner.succeed(
        `Successfully generated types to '${flags['config-root']}/${defaultOptions.types.fileName}' 💪`
      )
      process.exit(0)
    }
  }
}
