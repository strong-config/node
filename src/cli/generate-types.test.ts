jest.mock('./validate')

import fs from 'fs'
import { stderr, stdout } from 'stdout-stderr'
import * as generateTypesFromSchemaModule from '../generate-types-from-schema'
import * as readFileModule from '../utils/read-file'
import { defaultOptions } from '../options'
import { GenerateTypes } from './generate-types'

describe('strong-config generate-types', () => {
  beforeAll(() => {
    jest.spyOn(fs, 'writeFileSync').mockImplementation()
    jest.spyOn(process, 'exit').mockImplementation()
  })

  beforeEach(() => {
    jest.clearAllMocks()
    // Mocking stdout/stderr also for tests that don't check it to not pollute the jest output with status messages
    stdout.start()
    stderr.start()
  })

  afterEach(() => {
    stdout.stop()
    stderr.stop()
  })

  afterAll(() => {
    jest.restoreAllMocks()
  })

  it('checks if a valid schema file exists', async () => {
    jest.spyOn(readFileModule, 'readSchemaFile')
    const configRoot = '/i/dont/exist'

    await GenerateTypes.run(['--config-root', configRoot])

    expect(readFileModule.readSchemaFile).toHaveBeenCalledWith(configRoot)
  })

  it('generates types', async () => {
    const configRoot = 'example'
    jest.spyOn(generateTypesFromSchemaModule, 'generateTypesFromSchema')

    await GenerateTypes.run(['--config-root', configRoot])

    expect(
      generateTypesFromSchemaModule.generateTypesFromSchema
    ).toHaveBeenCalledWith(configRoot, defaultOptions.types)
  })

  it('exits with code 0 when type generation was successful', async () => {
    const configRoot = 'example'

    await GenerateTypes.run(['--config-root', configRoot])

    // eslint-disable-next-line @typescript-eslint/unbound-method
    expect(process.exit).toHaveBeenCalledWith(0)
  })

  it('exits with code 1 when type generation failed', async () => {
    await GenerateTypes.run(['--config-root', '/i/dont/exist'])

    // eslint-disable-next-line @typescript-eslint/unbound-method
    expect(process.exit).toHaveBeenCalledWith(1)
  })

  describe('shows help', () => {
    it('prints the help with --help', async () => {
      try {
        await GenerateTypes.run(['--help'])
      } catch (error) {
        /*
         * NOTE: For some reason oclif throws when running the help command
         * so we need to catch the (non-)error for the test to pass
         */
        stdout.stop()

        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access -- no idea how to teach typescript that 'error' is not of type 'any'
        if (error.oclif?.exit !== 0) {
          console.error(error)
        }
      }

      expect(stdout.output).toContain('USAGE')
      expect(stdout.output).toContain('OPTIONS')
      expect(stdout.output).toContain('EXAMPLES')
    })

    it('always prints help with any command having --help', async () => {
      try {
        await GenerateTypes.run(['some/config/file.yaml', '--help'])
        /*
         * NOTE: For some reason oclif throws when running the help command
         * so we need to catch the (non-)error for the test to pass
         */
      } catch (error) {
        stdout.stop()

        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access -- no idea how to teach typescript that 'error' is not of type 'any'
        if (error.oclif?.exit !== 0) {
          console.error(error)
        }
      }

      expect(stdout.output).toContain('USAGE')
      expect(stdout.output).toContain('OPTIONS')
      expect(stdout.output).toContain('EXAMPLES')
    })
  })
})
