/* eslint-disable @typescript-eslint/unbound-method */
import { stderr, stdout } from 'stdout-stderr'
import Ajv from 'ajv'
import * as readFiles from '../utils/load-files'
import * as sops from '../utils/sops'
import { encryptedConfigFile, schema, decryptedConfig } from '../fixtures'
import { defaultOptions } from '../options'
import { Validate } from './validate'

describe('strong-config validate', () => {
  const runtimeEnv = 'development'
  const configRoot = 'example'
  const fullConfigPath = `${configRoot}/${runtimeEnv}.yaml`

  const loadConfigFromPath = jest.spyOn(readFiles, 'loadConfigFromPath')
  const loadSchema = jest.spyOn(readFiles, 'loadSchema')
  const decryptToObject = jest.spyOn(sops, 'decryptToObject')
  const ajvValidate = jest.spyOn(Ajv.prototype, 'validate')
  const processExit = jest.spyOn(process, 'exit')

  beforeAll(() => {
    // Otherwise the test process itself would be terminated
    processExit.mockImplementation()
    jest.spyOn(console, 'error').mockImplementation()
  })

  beforeEach(() => {
    jest.clearAllMocks()
    loadSchema.mockReturnValue(schema)
    loadConfigFromPath.mockReturnValue(encryptedConfigFile)
    decryptToObject.mockReturnValue(decryptedConfig)

    // Mocking stdout/stderr to not pollute the jest output with status messages
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
    await Validate.run([fullConfigPath, '--config-root', configRoot])

    expect(readConfig).toHaveBeenCalledWith(fullConfigPath, configRoot)
    expect(sops.decryptToObject).toHaveBeenCalledWith(
      encryptedConfigFile.filePath,
      encryptedConfigFile.contents
    )
    expect(loadSchema).toHaveBeenCalledWith(configRoot)
    expect(ajvValidate).toHaveBeenCalledWith(schema, decryptedConfig)
    expect(ajvValidate).toHaveReturnedWith(true)
    expect(process.exit).toHaveBeenCalledWith(0)
  })

  it('accepts a relative path to a config file as input', async () => {
    const relativePaths = [
      'example/development.yaml',
      './example/development.yaml',
      '../node/example/development.yaml',
    ]

    for (const path of relativePaths) {
      ajvValidate.mockClear()
      processExit.mockClear()
      await Validate.run([path, '--config-root', configRoot])

      expect(ajvValidate).toHaveBeenCalledWith(schema, decryptedConfig)
      expect(ajvValidate).toHaveReturnedWith(true)
      expect(process.exit).toHaveBeenCalledWith(0)
    }
  })

  it('accepts an absolute path to a config file as input', async () => {
    const absolutePath = `${process.cwd()}/example/development.yaml`

    await Validate.run([absolutePath, '--config-root', configRoot])

    expect(ajvValidate).toHaveBeenCalledWith(schema, decryptedConfig)
    expect(ajvValidate).toHaveReturnedWith(true)

    expect(process.exit).toHaveBeenCalledWith(0)
  })

  it('accepts a runtimeEnv name as input', async () => {
    await Validate.run([runtimeEnv, '--config-root', configRoot])

    expect(ajvValidate).toHaveBeenCalledWith(schema, decryptedConfig)
    expect(ajvValidate).toHaveReturnedWith(true)

    expect(process.exit).toHaveBeenCalledWith(0)
  })

  it('uses defaultOptions.configRoot in case no explicit configRoot flag gets passed', async () => {
    await Validate.run([runtimeEnv])

    expect(readConfig).toHaveBeenCalledWith(
      runtimeEnv,
      defaultOptions.configRoot
    )
    expect(process.exit).toHaveBeenCalledWith(0)
  })

  it('displays the validation process', async () => {
    await Validate.run([fullConfigPath, '--config-root', configRoot])
    stderr.stop()
    stdout.stop()

    expect(stderr.output).toMatch('Validating...')
    expect(stderr.output).toMatch(`Loading config: ${fullConfigPath}`)
    expect(stderr.output).toMatch(`Loading schema from: ${configRoot}`)
    expect(stderr.output).toMatch('Validating config against schema...')
    expect(stderr.output).toMatch('Config is valid!')
  })

  describe('error handling', () => {
    describe('with non-existing config files', () => {
      const nonExistingFile = 'i-dont-exist.yml'
      const originalError = new Error("Couldn't find config file")

      beforeEach(() => {
        readConfig.mockImplementationOnce(() => {
          throw originalError
        })
      })

      it('fails', async () => {
        await Validate.run(['i-dont-exist.yml'])
        stderr.stop()

        expect(process.exit).toHaveBeenCalledWith(1)
      })

      it('displays a human-readable error message', async () => {
        await Validate.run([nonExistingFile])
        stderr.stop()

        expect(stderr.output).toContain(
          'Config validation against schema failed'
        )
        expect(process.exit).toHaveBeenCalledWith(1)
      })

      it('displays original error', async () => {
        await Validate.run([nonExistingFile])
        stdout.stop()

        expect(console.error).toHaveBeenCalledWith(originalError)
        expect(process.exit).toHaveBeenCalledWith(1)
      })
    })

    describe("when schema can't be found in configRoot", () => {
      beforeEach(() => {
        // eslint-disable-next-line unicorn/no-useless-undefined
        loadSchema.mockReturnValue(undefined)
      })

      it('fails', async () => {
        await Validate.run([fullConfigPath])
        expect(process.exit).toHaveBeenCalledWith(1)
      })

      it('displays human-readable error message', async () => {
        await Validate.run([fullConfigPath])
        stderr.stop()
        expect(stderr.output).toMatch('No schema file found')
      })

      it('displays original error', async () => {
        const ajvError = new Error('schema should be object or boolean')
        await Validate.run([fullConfigPath])

        expect(console.error).toHaveBeenCalledWith(ajvError)
      })
    })

    describe('when validation fails', () => {
      const ajvErrors = ['data should NOT have additional properties']

      beforeEach(() => {
        ajvValidate.mockReturnValueOnce(false)
        jest.spyOn(Ajv.prototype, 'errorsText').mockReturnValueOnce(ajvErrors)
      })

      it('fails', async () => {
        await Validate.run([fullConfigPath])
        stderr.stop()

        expect(stderr.output).toMatch(
          `Config validation against schema failed:\n${ajvErrors.join(',')}`
        )
      })
    })
  })

  describe('--help', () => {
    it('prints the help with --help', async () => {
      try {
        await Validate.run(['--help'])
      } catch {
        /*
         * NOTE: For some reason oclif throws when running the help command
         * so we need to catch the (non-)error for the test to pass
         */
        stdout.stop()
      }

      expect(stdout.output).toContain('USAGE')
      expect(stdout.output).toContain('ARGUMENTS')
      expect(stdout.output).toContain('OPTIONS')
      expect(stdout.output).toContain('EXAMPLES')
    })

    it('always prints help with any command having --help', async () => {
      try {
        await Validate.run([fullConfigPath, '--help'])
      } catch {
        /*
         * NOTE: For some reason oclif throws when running the help command
         * so we need to catch the (non-)error for the test to pass
         */
        stdout.stop()
      }

      expect(stdout.output).toContain('USAGE')
      expect(stdout.output).toContain('ARGUMENTS')
      expect(stdout.output).toContain('OPTIONS')
      expect(stdout.output).toContain('EXAMPLES')
    })
  })
})
