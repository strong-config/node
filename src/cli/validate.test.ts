import { stderr, stdout } from 'stdout-stderr'
import { validate as validateUtil } from '../validate'
import { Validate } from './validate'
jest.mock('../validate')

const validateUtilMock = validateUtil as jest.MockedFunction<
  typeof validateUtil
>

const configFile = 'example/development.yaml'
const validationError = new Error('some validation error')
const processExitMock = jest.spyOn(process, 'exit').mockImplementation()

describe('strong-config validate', () => {
  beforeEach(() => {
    stdout.start()
    stderr.start()
  })

  afterAll(() => {
    stdout.stop()
    stderr.stop()
    processExitMock.mockRestore()
  })

  describe('shows help', () => {
    it('prints the help with --help', async () => {
      try {
        await Validate.run(['--help'])
        stdout.stop()
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
        stdout.stop()
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

  describe('handles validation', () => {
    beforeEach(() => {
      jest.clearAllMocks()
    })

    it('exits with code 0 when successful', async () => {
      await Validate.run([configFile])

      expect(processExitMock).toHaveBeenCalledWith(0)
    })

    it('exits with code 1 when validation fails', async () => {
      validateUtilMock.mockImplementationOnce(() => {
        throw validationError
      })

      await Validate.run([configFile])

      expect(processExitMock).toHaveBeenCalledWith(1)
    })

    it('validates against schema', async () => {
      await Validate.run([configFile])

      expect(validateUtilMock).toHaveBeenCalledTimes(1)
    })
  })

  describe('informs the user', () => {
    beforeEach(() => {
      jest.clearAllMocks()
    })

    it('informs user about the validation process', async () => {
      await Validate.run([configFile])
      stderr.stop()

      expect(stderr.output).toMatch('Validating...')
    })

    it('informs user about the validation result', async () => {
      await Validate.run([configFile])
      stderr.stop()

      expect(stderr.output).toMatch('Config is valid!')
    })

    it('informs user about validation errors', async () => {
      validateUtilMock.mockImplementationOnce(() => {
        throw validationError
      })

      await Validate.run([configFile])
      stderr.stop()

      expect(stderr.output).toMatch('Config validation against schema failed')
    })
  })
})
