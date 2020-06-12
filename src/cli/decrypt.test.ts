jest.mock('./validate')
jest.mock('../utils/sops')

import { stderr, stdout } from 'stdout-stderr'
import { getSopsOptions, runSopsWithOptions } from '../utils/sops'
import { Decrypt } from './decrypt'
import { validateCliWrapper } from './validate'

// Mocks
const runSopsWithOptionsMock = runSopsWithOptions as jest.MockedFunction<
  typeof runSopsWithOptions
>
const getSopsOptionsMock = getSopsOptions as jest.MockedFunction<
  typeof getSopsOptions
>
const validateCliWrapperMock = validateCliWrapper as jest.MockedFunction<
  typeof validateCliWrapper
>
const sopsOptionsMock = ['--some', '--flags']
getSopsOptionsMock.mockReturnValue(sopsOptionsMock)
const sopsError = new Error('some sops error')
const configRoot = 'example'
const configFile = 'example/development.yaml'
const processExitMock = jest.spyOn(process, 'exit').mockImplementation()

describe('strong-config decrypt', () => {
  beforeEach(() => {
    stdout.start()
    stderr.start()
  })

  afterAll(() => {
    processExitMock.mockRestore()
    stderr.stop()
    stdout.stop()
  })

  describe('shows help', () => {
    it('prints the help with --help', async () => {
      try {
        await Decrypt.run(['--help'])
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
      expect(stdout.output).toContain('ARGUMENTS')
      expect(stdout.output).toContain('OPTIONS')
      expect(stdout.output).toContain('EXAMPLES')
    })

    it('always prints help with any command having --help', async () => {
      try {
        await Decrypt.run(['some/config/file.yaml', '--help'])
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
      expect(stdout.output).toContain('ARGUMENTS')
      expect(stdout.output).toContain('OPTIONS')
      expect(stdout.output).toContain('EXAMPLES')
    })
  })

  describe('handles decryption', () => {
    beforeEach(() => {
      jest.clearAllMocks()
    })

    it('exits with code 0 when successful', async () => {
      await Decrypt.run([configFile])

      expect(processExitMock).toHaveBeenCalledWith(0)
    })

    it('exits with code 1 when decryption fails', async () => {
      runSopsWithOptionsMock.mockImplementationOnce(() => {
        throw sopsError
      })

      await Decrypt.run([configFile])

      expect(processExitMock).toHaveBeenCalledWith(1)
    })

    it('decrypts by using sops', async () => {
      await Decrypt.run([configFile])

      expect(runSopsWithOptionsMock).toHaveBeenCalledWith([
        '--decrypt',
        ...sopsOptionsMock,
      ])
    })

    it('decrypts and validates when configRoot contains schema.json', async () => {
      await Decrypt.run([configFile, '--config-root', configRoot])

      expect(validateCliWrapperMock).toHaveBeenCalledWith(
        configFile,
        configRoot,
        false
      )
    })

    it('fails when no arguments are passed', async () => {
      await expect(Decrypt.run([])).rejects.toThrowError(
        /Missing 1 required arg/
      )
    })
  })

  describe('informs the user', () => {
    beforeEach(() => {
      jest.clearAllMocks()
    })

    it('informs user about the decryption process', async () => {
      await Decrypt.run([configFile])
      stderr.stop()

      expect(stderr.output).toMatch('Decrypting...')
    })

    it('informs user about the decryption result', async () => {
      await Decrypt.run([configFile])
      stderr.stop()

      expect(stderr.output).toMatch(`Successfully decrypted ${configFile}!`)
    })

    it('informs user about decryption errors', async () => {
      runSopsWithOptionsMock.mockImplementationOnce(() => {
        throw sopsError
      })

      await Decrypt.run([configFile])
      stderr.stop()

      expect(stderr.output).toMatch('Failed to decrypt config file')
    })
  })
})
