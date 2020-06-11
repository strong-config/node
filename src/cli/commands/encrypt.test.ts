jest.mock('./validate')
jest.mock('../../utils/sops')

import { stderr, stdout } from 'stdout-stderr'
import { Encrypt } from './encrypt'

import { validateCliWrapper } from './validate'
import { getSopsOptions, runSopsWithOptions } from 'utils/sops'

// Mocks
const runSopsWithOptionsMock = runSopsWithOptions as jest.MockedFunction<
  typeof runSopsWithOptions
>
const getSopsWithOptionsMock = getSopsOptions as jest.MockedFunction<
  typeof getSopsOptions
>
const validateCliWrapperMock = validateCliWrapper as jest.MockedFunction<
  typeof validateCliWrapper
>
const processExitMock = jest.spyOn(process, 'exit').mockImplementation()

const sopsOptionsMock = ['--some', '--flags']
getSopsWithOptionsMock.mockReturnValue(sopsOptionsMock)
const sopsError = new Error('some sops error')

// This file is created in the beforeAll handler
const configRoot = 'example'
const configFile = 'example/development.decrypted.yaml'

const keyId = '2E9644A658379349EFB77E895351CE7FC0AC6E94' // example/pgp/example-keypair.pgp
const keyProvider = 'pgp'
const requiredKeyFlags = ['-k', keyId, '-p', keyProvider]

describe('strong-config encrypt', () => {
  beforeEach(() => {
    stdout.start()
    stderr.start()
  })

  afterAll(() => {
    processExitMock.mockRestore()
    stdout.stop()
    stderr.stop()
  })

  describe('--help', () => {
    it('prints the help', async () => {
      try {
        await Encrypt.run(['--help'])
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
        await Encrypt.run([
          'some/config/file.yml',
          '--help',
          ...requiredKeyFlags,
        ])
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

  describe('handles encryption', () => {
    beforeEach(() => {
      jest.clearAllMocks()
    })

    it('exits with code 0 when successful', async () => {
      await Encrypt.run([configFile, ...requiredKeyFlags])

      expect(processExitMock).toHaveBeenCalledWith(0)
    })

    it('exits with code 1 when encryption fails', async () => {
      runSopsWithOptionsMock.mockImplementationOnce(() => {
        throw sopsError
      })

      await Encrypt.run([configFile, ...requiredKeyFlags])

      expect(processExitMock).toHaveBeenCalledWith(1)
    })

    it('encrypts by using sops', async () => {
      await Encrypt.run([configFile, ...requiredKeyFlags])

      expect(runSopsWithOptionsMock).toHaveBeenCalledWith([
        '--encrypt',
        ...sopsOptionsMock,
      ])
    })

    it('encrypts and validates when schema path is passed', async () => {
      await Encrypt.run([
        configFile,
        ...requiredKeyFlags,
        '--config-root',
        configRoot,
      ])

      expect(validateCliWrapperMock).toHaveBeenCalledWith(
        configFile,
        configRoot,
        false
      )
    })

    it('fails when no arguments are passed', async () => {
      await expect(Encrypt.run([configFile])).rejects.toThrowError(
        /--key-provider KEY-PROVIDER/
      )
    })

    it('fails when no key provider is passed with --key-provider/-p', async () => {
      await expect(Encrypt.run([configFile, '-k', keyId])).rejects.toThrowError(
        /--key-provider KEY-PROVIDER/
      )
    })

    it('fails when no key id is passed with --key-id/-k', async () => {
      await expect(
        Encrypt.run([configFile, '-p', keyProvider])
      ).rejects.toThrowError(/--key-id= must also be provided/)
    })
  })

  describe('informs the user', () => {
    beforeEach(() => {
      jest.clearAllMocks()
    })

    it('informs user about the encryption process', async () => {
      await Encrypt.run([configFile, ...requiredKeyFlags])
      stderr.stop()

      expect(stderr.output).toMatch('Encrypting...')
    })

    it('informs user about the encryption result', async () => {
      await Encrypt.run([configFile, ...requiredKeyFlags])
      stderr.stop()

      expect(stderr.output).toMatch(`Successfully encrypted ${configFile}!`)
    })

    it('informs user about encryption errors', async () => {
      runSopsWithOptionsMock.mockImplementationOnce(() => {
        throw sopsError
      })

      await Encrypt.run([configFile, ...requiredKeyFlags])
      stderr.stop()

      expect(stderr.output).toMatch('Failed to encrypt config file')
    })
  })
})
