/* eslint-disable @typescript-eslint/unbound-method */
import fs from 'fs'
import { stderr, stdout } from 'stdout-stderr'
import * as generateTypesFromSchemaModule from '../utils/generate-types-from-schema'
import * as readFiles from '../utils/read-files'
import { defaultOptions } from '../options'
import { GenerateTypes } from './generate-types'

jest.mock('./validate')

describe('strong-config generate-types', () => {
  beforeAll(() => {
    jest.spyOn(console, 'error').mockImplementation()
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
    jest.spyOn(readFiles, 'loadSchema')
    const configRoot = '/i/dont/exist'

    await GenerateTypes.run(['--config-root', configRoot])

    expect(readFiles.loadSchema).toHaveBeenCalledWith(configRoot)
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

    expect(process.exit).toHaveBeenCalledWith(0)
  })

  describe('when given a config-root without schema', () => {
    it('fails and exits with code 1', async () => {
      await GenerateTypes.run(['--config-root', '/i/dont/exist'])

      expect(process.exit).toHaveBeenCalledWith(1)
    })
  })

  describe('when type generation fails for unknown reasons', () => {
    it('displays human-readable error message when type generation fails', async () => {
      jest
        .spyOn(generateTypesFromSchemaModule, 'generateTypesFromSchema')
        .mockImplementationOnce(() => {
          throw new Error('something went wrong during type generation ')
        })

      await GenerateTypes.run(['--config-root', 'example'])
      stderr.stop()

      expect(stderr.output).toContain("Couldn't generate types from schema")
    })
  })

  describe('shows help', () => {
    it('prints the help with --help', async () => {
      try {
        await GenerateTypes.run(['--help'])
      } catch {
        /*
         * NOTE: For some reason oclif throws when running the help command
         * so we need to catch the (non-)error for the test to pass
         */
        stdout.stop()
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
      } catch {
        stdout.stop()
      }

      expect(stdout.output).toContain('USAGE')
      expect(stdout.output).toContain('OPTIONS')
      expect(stdout.output).toContain('EXAMPLES')
    })
  })
})
