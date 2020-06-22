/* eslint-disable @typescript-eslint/unbound-method */
import { stderr, stdout } from 'stdout-stderr'
import { runSopsWithOptions } from '../utils/sops'
import { Decrypt } from './decrypt'
import * as validateCommand from './validate'

jest.mock('../utils/sops', () => {
  return {
    runSopsWithOptions: jest.fn(),
    getSopsOptions: jest.fn(() => ['--some', '--flags']),
  }
})

const runSopsWithOptionsMock = runSopsWithOptions as jest.Mock<
  ReturnType<typeof runSopsWithOptions>
>

describe('strong-config decrypt', () => {
  const configRoot = 'example'
  const configFile = 'example/development.yaml'
  const sopsError = new Error('some sops error')

  beforeAll(() => {
    jest.spyOn(console, 'error').mockImplementation()
    jest.spyOn(process, 'exit').mockImplementation()
  })

  beforeEach(() => {
    jest.clearAllMocks()
    // Mocking stdout/stderr also for tests that don't check it to not pollute the jest output with status messages
    stdout.start()
    stderr.start()
  })

  afterEach(() => {
    stderr.stop()
    stdout.stop()
  })

  afterAll(() => {
    jest.restoreAllMocks()
  })

  it('exits with code 0 when successful', async () => {
    await Decrypt.run([configFile])

    expect(process.exit).toHaveBeenCalledWith(0)
  })

  it('exits with code 1 when decryption fails', async () => {
    runSopsWithOptionsMock.mockImplementationOnce(() => {
      throw sopsError
    })

    await Decrypt.run([configFile])

    expect(process.exit).toHaveBeenCalledWith(1)
  })

  it('decrypts by using sops', async () => {
    await Decrypt.run([configFile])

    expect(runSopsWithOptionsMock).toHaveBeenCalledWith([
      '--decrypt',
      '--some',
      '--flags',
    ])
  })

  describe('given a config-root with a schema file', () => {
    it('validates config against schema AFTER decrypting', async () => {
      jest.spyOn(validateCommand, 'validate')

      await Decrypt.run([configFile, '--config-root', configRoot])

      expect(validateCommand.validate).toHaveBeenCalledWith(
        configFile,
        configRoot
      )

      expect(validateCommand.validate).toHaveBeenCalledAfter(
        runSopsWithOptionsMock
      )
    })
  })

  describe('when config file is already decrypted', () => {
    it('displays a useful error message', async () => {
      runSopsWithOptionsMock.mockImplementationOnce(() => {
        const error = new Error(
          'original non-userfriendly error message from sops :: already decrypted'
        )
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        error.exitCode = 1 // this is sops' error-code
        throw error
      })

      await Decrypt.run(['unencrypted.yml', '--config-root', configRoot])

      expect(console.error).toHaveBeenCalledWith(
        expect.stringContaining('is already decrypted')
      )
    })
  })

  describe('cli output', () => {
    it('displays the decryption process', async () => {
      await Decrypt.run([configFile])
      stderr.stop()

      expect(stderr.output).toMatch('Decrypting...')
    })

    it('displays the decryption result', async () => {
      await Decrypt.run([configFile])
      stderr.stop()

      expect(stderr.output).toMatch(`Successfully decrypted ${configFile}!`)
    })

    it('displays decryption errors', async () => {
      runSopsWithOptionsMock.mockImplementationOnce(() => {
        throw sopsError
      })

      await Decrypt.run([configFile])
      stderr.stop()

      expect(stderr.output).toMatch('Failed to decrypt config file')
    })
  })

  describe('--help', () => {
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
})
