/* eslint-disable @typescript-eslint/unbound-method */
import { stderr, stdout } from 'stdout-stderr'
import Ajv from 'ajv'
import { formatAjvErrors } from '../utils/format-ajv-errors'
import * as readFiles from '../utils/load-files'
import * as sops from '../utils/sops'
import { encryptedConfigFile, decryptedConfig } from '../fixtures'
import { defaultOptions } from '../options'
import { Validate } from './validate'
import * as validateCommand from './validate'

describe('strong-config validate', () => {
  const encryptedConfigPath = 'example/development.yaml'
  const invalidConfigPath = 'example/invalid.yml'
  const unencryptedConfigPath = 'example/unencrypted.yml'
  const unencryptedWithNestedSecretsConfigPath =
    'example/unencrypted-with-nested-secrets.yml'
  const noSecretsConfigPath = 'example/no-secrets.yml'

  const allConfigFiles = [
    encryptedConfigPath,
    invalidConfigPath,
    unencryptedConfigPath,
    unencryptedWithNestedSecretsConfigPath,
    noSecretsConfigPath,
  ]

  const someConfigFiles = [encryptedConfigPath, noSecretsConfigPath]

  const runtimeEnv = 'development'
  const configRoot = 'example'
  const schema = readFiles.loadSchema(configRoot)

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

  describe('for ONE file', () => {
    it('validates a given config against its schema', async () => {
      await Validate.run([encryptedConfigPath, '--config-root', configRoot])

      expect(loadConfigFromPath).toHaveBeenCalledWith(encryptedConfigPath)
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

    it('displays the validation process', async () => {
      await Validate.run([encryptedConfigPath, '--config-root', configRoot])
      stderr.stop()
      stdout.stop()

      expect(stderr.output).toMatch(`Validating ${encryptedConfigPath}...`)
      expect(stderr.output).toMatch(`Loading config: ${encryptedConfigPath}`)
      expect(stderr.output).toMatch(`Loading schema from: ${configRoot}`)
      expect(stderr.output).toMatch('Validating config against schema...')
      expect(stderr.output).toMatch(`${encryptedConfigPath} is valid!`)
    })

    describe('error handling', () => {
      describe('with non-existing config files', () => {
        const nonExistingFile = 'i-dont-exist.yml'
        const originalError = new Error("Couldn't find config file")

        beforeEach(() => {
          loadConfigFromPath.mockImplementationOnce(() => {
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
            `${nonExistingFile} => Error during validation`
          )
          expect(process.exit).toHaveBeenCalledWith(1)
        })

        it('displays original error', async () => {
          await Validate.run([nonExistingFile])
          stdout.stop()

          expect(console.error).toHaveBeenCalledWith(originalError, '\n')
          expect(process.exit).toHaveBeenCalledWith(1)
        })
      })

      describe("when schema can't be found in configRoot", () => {
        beforeEach(() => {
          // eslint-disable-next-line unicorn/no-useless-undefined
          loadSchema.mockReturnValue(undefined)
        })

        afterAll(() => {
          loadSchema.mockRestore()
        })

        it('fails', async () => {
          await Validate.run([encryptedConfigPath])
          expect(process.exit).toHaveBeenCalledWith(1)
        })

        it('displays human-readable error message', async () => {
          await Validate.run([encryptedConfigPath])
          stderr.stop()
          expect(stderr.output).toMatch(
            `No schema found in your config root ./${defaultOptions.configRoot}/schema.json`
          )
        })

        it('displays original error', async () => {
          const ajvError = new Error('schema must be object or boolean')
          await Validate.run([encryptedConfigPath])

          expect(console.error).toHaveBeenCalledWith(ajvError, '\n')
        })
      })

      describe('when validation fails', () => {
        const ajvErrors = 'data should NOT have additional properties'

        beforeEach(() => {
          ajvValidate.mockReturnValueOnce(false)
          jest.spyOn(Ajv.prototype, 'errorsText').mockReturnValueOnce(ajvErrors)
        })

        it('displays detailed validation errors from ajv', async () => {
          await Validate.run([encryptedConfigPath])
          stderr.stop()

          expect(stderr.output).toMatch(
            `${encryptedConfigPath} is invalid:\n${formatAjvErrors(
              ajvErrors
            )}\n`
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
          await Validate.run([encryptedConfigPath, '--help'])
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

  describe('for MULTIPLE (but not all) files', () => {
    it('should validate all config files passed as arguments', async () => {
      const validateOneConfigFileSpy = jest.spyOn(
        validateCommand,
        'validateOneConfigFile'
      )
      await Validate.run([
        '--config-root',
        configRoot,
        encryptedConfigPath,
        unencryptedConfigPath,
      ])

      expect(validateOneConfigFileSpy).toHaveBeenCalledTimes(
        someConfigFiles.length
      )
      expect(validateOneConfigFileSpy).toHaveBeenNthCalledWith(
        1,
        encryptedConfigPath,
        schema
      )

      expect(validateOneConfigFileSpy).toHaveBeenNthCalledWith(
        2,
        unencryptedConfigPath,
        schema
      )
    })

    it('should exit with code 1 and error message when not all config files are valid', async () => {
      const ajvErrors = 'data should NOT have additional properties'
      ajvValidate.mockReturnValueOnce(false)
      jest.spyOn(Ajv.prototype, 'errorsText').mockReturnValueOnce(ajvErrors)

      await Validate.run([
        '--config-root',
        configRoot,
        invalidConfigPath,
        encryptedConfigPath,
      ])
      stderr.stop()

      expect(stderr.output).toContain(`${invalidConfigPath} is invalid`)
      expect(process.exit).toHaveBeenCalledWith(1)
    })
  })

  describe('for ALL files', () => {
    describe('given a folder with multiple config files', () => {
      it('should find all *.yaml and *.yml files in the configRoot dir', async () => {
        const validateOneConfigFileSpy = jest.spyOn(
          validateCommand,
          'validateOneConfigFile'
        )
        await Validate.run(['--config-root', configRoot])

        expect(validateOneConfigFileSpy).toHaveBeenCalledTimes(
          allConfigFiles.length
        )
        expect(validateOneConfigFileSpy).toHaveBeenNthCalledWith(
          1,
          allConfigFiles[0],
          schema
        )
        expect(validateOneConfigFileSpy).toHaveBeenNthCalledWith(
          2,
          allConfigFiles[1],
          schema
        )
      })

      it('should exit with code 1 and error message when not all config files are valid', async () => {
        const ajvErrors = 'data should NOT have additional properties'
        ajvValidate.mockReturnValueOnce(false)
        jest.spyOn(Ajv.prototype, 'errorsText').mockReturnValueOnce(ajvErrors)

        await Validate.run(['--config-root', 'example'])
        stderr.stop()

        expect(stderr.output).toMatch('✖ Validation failed')
        expect(process.exit).toHaveBeenCalledWith(1)
      })
    })

    describe('given a folder with NO config files', () => {
      it('should exit with code 1 and error message', async () => {
        const invalidConfigRoot = './i/dont/exist'
        await Validate.run(['--config-root', invalidConfigRoot])
        stderr.stop()

        expect(stderr.output).toMatch(
          new RegExp(`✖.*Found no config files in.*${invalidConfigRoot}`)
        )
        expect(process.exit).toHaveBeenCalledWith(1)
      })
    })
  })
})
