jest.mock('./validate')
jest.mock('../utils/sops')

import fs from 'fs'
import { stderr, stdout } from 'stdout-stderr'
import * as x from '../utils/generate-types-from-schema' // hacky syntax to allow for easy mocking
import * as y from '../utils/read-file' // hacky syntax to allow for easy mocking
import { defaultOptions } from '../options'
import { GenerateTypes } from './generate-types'

describe('strong-config generate-types', () => {
  beforeEach(() => {
    stdout.start()
    stderr.start()
  })

  afterAll(() => {
    stdout.stop()
    stderr.stop()
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

  describe('type generation', () => {
    let processExitMock: jest.SpyInstance
    let writeFileSyncMock: jest.SpyInstance

    beforeEach(() => {
      processExitMock = jest.spyOn(process, 'exit').mockImplementation()
      writeFileSyncMock = jest.spyOn(fs, 'writeFileSync').mockImplementation()
    })

    afterEach(() => {
      processExitMock.mockRestore()
      writeFileSyncMock.mockRestore()
    })

    it('checks if a valid schema file exists', async () => {
      const configRoot = '/i/dont/exist'
      const readSchemaFileSpy = jest.spyOn(y, 'readSchemaFile')
      await GenerateTypes.run(['--config-root', configRoot])

      expect(readSchemaFileSpy).toHaveBeenCalledWith(configRoot)
    })

    it('calls `generateTypeFromSchema()` to generate types', async () => {
      const configRoot = 'example'
      const generateTypeFromSchemaSpy = jest.spyOn(x, 'generateTypesFromSchema')
      await GenerateTypes.run(['--config-root', configRoot])

      expect(generateTypeFromSchemaSpy).toHaveBeenCalledWith(
        configRoot,
        defaultOptions.types
      )
    })

    it('exits with code 0 when type generation was successful', async () => {
      const configRoot = 'example'
      await GenerateTypes.run(['--config-root', configRoot])

      expect(processExitMock).toHaveBeenCalledWith(0)
    })

    it('exits with code 1 when type generation failed', async () => {
      await GenerateTypes.run(['--config-root', '/i/dont/exist'])

      expect(processExitMock).toHaveBeenCalledWith(1)
    })
  })
})
