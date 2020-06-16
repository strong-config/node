import { stderr, stdout } from 'stdout-stderr'
import { runSopsWithOptions } from '../utils/sops'
import { Decrypt } from './decrypt'
import { validateCliWrapper } from './validate'

jest.mock('./validate')
jest.mock('../utils/sops', () => {
  return {
    runSopsWithOptions: jest.fn(),
    getSopsOptions: jest.fn(() => ['--some', '--flags']),
  }
})

const runSopsWithOptionsMock = runSopsWithOptions as jest.MockedFunction<
  typeof runSopsWithOptions
>
const sopsError = new Error('some sops error')
const configRoot = 'example'
const configFile = 'example/development.yaml'

describe('strong-config decrypt', () => {
  beforeAll(() => {
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

    // eslint-disable-next-line @typescript-eslint/unbound-method
    expect(process.exit).toHaveBeenCalledWith(0)
  })

  it('exits with code 1 when decryption fails', async () => {
    runSopsWithOptionsMock.mockImplementationOnce(() => {
      throw sopsError
    })

    await Decrypt.run([configFile])

    // eslint-disable-next-line @typescript-eslint/unbound-method
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

  it('decrypts and validates when configRoot contains schema.json', async () => {
    await Decrypt.run([configFile, '--config-root', configRoot])

    expect(validateCliWrapper).toHaveBeenCalledWith(
      configFile,
      configRoot,
      false
    )
  })

  it('fails when no arguments are passed', async () => {
    await expect(Decrypt.run([])).rejects.toThrowError(/Missing 1 required arg/)
  })

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
})
