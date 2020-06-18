/* eslint-disable @typescript-eslint/unbound-method */
import Debug from 'debug'
import { stderr, stdout } from 'stdout-stderr'
import { defaultOptions } from '../options'
import * as validateModule from '../core/validate'
import { Validate } from './validate'

describe('strong-config validate', () => {
  let validateSpy: jest.SpyInstance
  const configFile = 'example/development.yaml'
  const configRoot = 'example'

  beforeAll(() => {
    jest.spyOn(process, 'exit').mockImplementation()
  })

  beforeEach(() => {
    jest.clearAllMocks()
    validateSpy = jest.spyOn(validateModule, 'validate')
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

  it('validates a given config against its schema', async () => {
    await Validate.run([configFile, '--config-root', configRoot])

    expect(validateSpy).toHaveBeenCalledWith(configFile, configRoot)
  })

  describe('valid input', () => {
    /*
     * it('accepts a relative path to a config file as input', async () => {
     *   const relativePaths = [
     *     'example/development.yaml',
     *     './example/development.yaml',
     *     '../node/example/development.yaml',
     *   ]
     */

    /*
     *   for (const path of relativePaths) {
     *     await Validate.run([path, '--config-root', configRoot])
     */

    /*
     *     expect(validateSpy).toHaveBeenCalledWith(path, configRoot)
     *     expect(validateSpy).toHaveReturnedWith(true)
     */

    /*
     *     expect(process.exit).toHaveBeenCalledWith(0)
     *     jest.clearAllMocks()
     *   }
     * })
     */

    /*
     * it('accepts an absolute path to a config file as input', async () => {
     *   const absolutePath = `${process.cwd()}/example/development.yaml`
     */

    //   await Validate.run([absolutePath, '--config-root', configRoot])

    /*
     *   expect(validateSpy).toHaveBeenCalledWith(absolutePath, configRoot)
     *   expect(validateSpy).toHaveReturnedWith(true)
     *   expect(process.exit).toHaveBeenCalledWith(0)
     * })
     */

    /*
     * it('accepts a runtimeEnv name as input', async () => {
     *   const runtimeEnv = 'development'
     */

    //   await Validate.run([runtimeEnv, '--config-root', configRoot])

    /*
     *   expect(validateSpy).toHaveBeenCalledWith(runtimeEnv, configRoot)
     *   expect(validateSpy).toHaveReturnedWith(true)
     *   expect(process.exit).toHaveBeenCalledWith(0)
     * })
     */

    /*
     * it('uses defaultOptions.configRoot in case no explicit configRoot flag gets passed', async () => {
     *   const runtimeEnv = 'development'
     */

    //   await Validate.run([runtimeEnv])

    /*
     *   expect(validateSpy).toHaveBeenCalledWith(
     *     runtimeEnv,
     *     defaultOptions.configRoot
     *   )
     *   expect(process.exit).toHaveBeenCalledWith(0)
     * })
     */

    describe('invalid input', () => {
      it('fails validation for non-existing files', async () => {
        await Validate.run(['i-dont-exist.yml'])
        stderr.stop()

        expect(stderr.output).toContain(
          'Config validation against schema failed'
        )
        expect(process.exit).toHaveBeenCalledWith(1)
      })

      it('displays a human-readable error message', async () => {
        const nonExistingFile = 'i-dont-exist.yml'

        await Validate.run([nonExistingFile])
        stderr.stop()

        expect(stderr.output).not.toContain(
          `Couldn't find config file ${defaultOptions.configRoot}/${nonExistingFile}`
        )
        expect(stderr.output).toContain(
          'Config validation against schema failed'
        )
        expect(process.exit).toHaveBeenCalledWith(1)
      })
    })
  })

  it('exits with code 1 when validation fails', async () => {
    validateSpy.mockImplementationOnce(() => {
      throw new Error('some validation error')
    })

    await Validate.run([configFile])

    expect(process.exit).toHaveBeenCalledWith(1)
  })

  describe('cli output', () => {
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
      validateSpy.mockImplementationOnce(() => {
        throw new Error('some validation error')
      })

      await Validate.run([configFile])
      stderr.stop()

      expect(stderr.output).toMatch('Config validation against schema failed')
    })
  })

  describe('--verbose', () => {
    it('displays the full error in verbose mode', async () => {
      const nonExistingFile = 'i-dont-exist.yml'

      await Validate.run([nonExistingFile, '--verbose'])
      stderr.stop()

      expect(stderr.output).toContain('Config validation against schema failed')
      expect(stderr.output).toContain(
        `Couldn't find config file ${defaultOptions.configRoot}/${nonExistingFile}`
      )
    })

    it('displays NO full errors per default', async () => {
      const nonExistingFile = 'i-dont-exist.yml'

      await Validate.run([nonExistingFile])
      stderr.stop()

      expect(stderr.output).toContain('Config validation against schema failed')
      expect(stderr.output).not.toContain(
        `Couldn't find config file ${defaultOptions.configRoot}/${nonExistingFile}`
      )
    })

    it('disables debug mode at the end to not influence other code', async () => {
      jest.spyOn(Debug, 'enable')
      jest.spyOn(Debug, 'disable')
      const nonExistingFile = 'i-dont-exist.yml'

      await Validate.run([nonExistingFile, '--verbose'])
      expect(Debug.enable).toHaveBeenCalledWith('strong-config:validate')
      expect(Debug.disable).toHaveBeenCalled()
    })
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
