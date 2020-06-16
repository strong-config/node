import { stderr, stdout } from 'stdout-stderr'
import { defaultOptions } from '../options'
import { validate as validateUtil } from '../validate'
import { Validate } from './validate'
jest.mock('../validate')

describe('strong-config validate', () => {
  const validateUtilMock = validateUtil as jest.MockedFunction<
    typeof validateUtil
  >
  const validationError = new Error('some validation error')
  const configFile = 'example/development.yaml'

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
    stdout.stop()
    stderr.stop()
  })

  afterAll(() => {
    jest.restoreAllMocks()
  })

  it('validates against schema', async () => {
    await Validate.run([configFile])

    expect(validateUtil).toHaveBeenCalledWith(
      configFile,
      defaultOptions.configRoot
    )
  })

  it('exits with code 0 when successful', async () => {
    await Validate.run([configFile])

    // eslint-disable-next-line @typescript-eslint/unbound-method
    expect(process.exit).toHaveBeenCalledWith(0)
  })

  it('exits with code 1 when validation fails', async () => {
    validateUtilMock.mockImplementationOnce(() => {
      throw validationError
    })

    await Validate.run([configFile])

    // eslint-disable-next-line @typescript-eslint/unbound-method
    expect(process.exit).toHaveBeenCalledWith(1)
  })

  it('displays the validation process', async () => {
    await Validate.run([configFile])
    stderr.stop()

    expect(stderr.output).toMatch('Validating...')
  })

  it('displays the validation result', async () => {
    await Validate.run([configFile])
    stderr.stop()

    expect(stderr.output).toMatch('Config is valid!')
  })

  it('displays validation errors', async () => {
    validateUtilMock.mockImplementationOnce(() => {
      throw validationError
    })

    await Validate.run([configFile])
    stderr.stop()

    expect(stderr.output).toMatch('Config validation against schema failed')
  })

  describe('--help', () => {
    it('prints the help with --help', async () => {
      try {
        await Validate.run(['--help'])
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
      expect(stdout.output).toContain('ARGUMENTS')
      expect(stdout.output).toContain('OPTIONS')
      expect(stdout.output).toContain('EXAMPLES')
    })

    it('always prints help with any command having --help', async () => {
      try {
        await Validate.run([configFile, '--help'])
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
      expect(stdout.output).toContain('ARGUMENTS')
      expect(stdout.output).toContain('OPTIONS')
      expect(stdout.output).toContain('EXAMPLES')
    })
  })
})
