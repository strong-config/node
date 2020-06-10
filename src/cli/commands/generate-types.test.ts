jest.mock('./validate')
jest.mock('../spinner')
jest.mock('../../utils/sops')

import { stdout } from 'stdout-stderr'
import fs from 'fs'
import * as x from '../../utils/generate-type-from-schema'
import * as y from '../../utils/read-file'
import { defaultOptions } from './../../options'
import GenerateTypes from './generate-types'
import { getVerbosityLevel, VerbosityLevel } from '../spinner'

// Mocks
const mockedGetVerbosityLevel = getVerbosityLevel as jest.MockedFunction<
  typeof getVerbosityLevel
>

mockedGetVerbosityLevel.mockReturnValue(VerbosityLevel.Verbose)

describe('strong-config generate-types', () => {
  describe('shows help', () => {
    it('prints the help with --help', async () => {
      try {
        stdout.start()
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
        stdout.start()
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
    let mockedExit: jest.SpyInstance
    let mockedWriteFileSync: jest.SpyInstance

    beforeEach(() => {
      jest.clearAllMocks()
      mockedExit = jest.spyOn(process, 'exit').mockImplementation()
      mockedWriteFileSync = jest.spyOn(fs, 'writeFileSync').mockImplementation()
    })

    afterEach(() => {
      mockedExit.mockRestore()
      mockedWriteFileSync.mockRestore()
    })

    it('checks if a valid schema file exists', async () => {
      const configRoot = '/i/dont/exist'
      const readSchemaFileSpy = jest.spyOn(y, 'readSchemaFile')
      await GenerateTypes.run(['--config-root', configRoot])

      expect(readSchemaFileSpy).toHaveBeenCalledWith(configRoot)
    })

    it('calls `generateTypeFromSchema()` to generate types', async () => {
      const configRoot = 'example'
      const generateTypeFromSchemaSpy = jest.spyOn(x, 'generateTypeFromSchema')
      await GenerateTypes.run(['--config-root', configRoot])

      expect(generateTypeFromSchemaSpy).toHaveBeenCalledWith(
        configRoot,
        defaultOptions.types,
        expect.any(Function)
      )
    })

    it('exits with code 0 when type generation was successful', async () => {
      const configRoot = 'example'
      await GenerateTypes.run(['--config-root', configRoot])

      expect(mockedExit).toHaveBeenCalledWith(0)
    })

    it('exits with code 1 when type generation failed', async () => {
      await GenerateTypes.run(['--config-root', '/i/dont/exist'])

      expect(mockedExit).toHaveBeenCalledWith(1)
    })
  })
})
