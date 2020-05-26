import { generateTypeFromSchema } from './../../utils/generate-type-from-schema'
import { Command, flags } from '@oclif/command'

import {
  startSpinner,
  failSpinner,
  succeedSpinner,
  getVerbosityLevel,
} from '../spinner'
import { readSchemaFile } from '../../utils/read-file'
import { defaultOptions } from '../../options'

export default class GenerateTypes extends Command {
  static description = 'generate typescript types based on schema.json'

  static strict = true

  static flags = {
    help: flags.help({
      char: 'h',
      description: 'show help',
    }),
    'config-root': flags.string({
      char: 'c',
      description: 'your config folder containing your schema.json',
      default: defaultOptions.configRoot,
    }),
    verbose: flags.boolean({
      char: 'v',
      description: 'print stack traces in case of errors',
      default: false,
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
    startSpinner('Generating types...')

    if (!readSchemaFile(flags['config-root'])) {
      failSpinner(
        "Didn't find schema file. Without a schema.json file inside your config directory we can't generate types.",
        new Error('Schema file not found'),
        getVerbosityLevel(flags.verbose)
      )

      process.exit(1)
    } else {
      if (defaultOptions.types) {
        await generateTypeFromSchema(flags['config-root'], defaultOptions.types)
        succeedSpinner(
          `Successfully generated types to '${flags['config-root']}/${defaultOptions.types.fileName}'`
        )
      }

      process.exit(0)
    }
  }
}
