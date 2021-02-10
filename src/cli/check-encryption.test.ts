// This is safe to disable as we're in a test file
/* eslint-disable security/detect-non-literal-regexp */
import { stderr, stdout } from 'stdout-stderr'
import * as readFiles from '../utils/load-files'
import { CheckEncryption } from './check-encryption'

describe('strong-config check-encryption', () => {
  const encryptedConfigPath = 'example/development.yaml'
  const invalidConfigPath = 'example/invalid.yml'
  const unencryptedConfigPath = 'example/unencrypted.yml'
  const unencryptedWithNestedSecretsConfigPath =
    'example/unencrypted-with-nested-secrets.yml'
  const noSecretsConfigPath = 'example/no-secrets.yml'

  const allConfigFiles = [
    encryptedConfigPath,
    invalidConfigPath,
    noSecretsConfigPath,
    unencryptedConfigPath,
    unencryptedWithNestedSecretsConfigPath,
  ]

  const configRoot = 'example'

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

  describe('for ONE file', () => {
    it('should read the config file', async () => {
      jest.spyOn(readFiles, 'loadConfigFromPath')
      await CheckEncryption.run([encryptedConfigPath])

      expect(readFiles.loadConfigFromPath).toHaveBeenCalledWith(
        encryptedConfigPath
      )
    })

    describe('given a path to an ENCRYPTED config file', () => {
      it('should exit with code 0 and success message', async () => {
        await CheckEncryption.run([encryptedConfigPath])
        stderr.stop()

        expect(stderr.output).toMatch(
          new RegExp(`Checking ${encryptedConfigPath} for encryption`)
        )
        expect(stderr.output).toMatch(
          new RegExp(`✔.*${encryptedConfigPath}.*safely encrypted`)
        )
        // eslint-disable-next-line @typescript-eslint/unbound-method
        expect(process.exit).toHaveBeenCalledWith(0)
      })
    })

    describe('given a path to an UNENCRYPTED config file that contains secrets', () => {
      it('should exit with code 1 and error message', async () => {
        await CheckEncryption.run([unencryptedConfigPath])
        stderr.stop()

        expect(stderr.output).toMatch(
          new RegExp(`✖.*${unencryptedConfigPath}.*NOT encrypted`)
        )
        // eslint-disable-next-line @typescript-eslint/unbound-method
        expect(process.exit).toHaveBeenCalledWith(0)
      })

      it('should also fail for nested secrets', async () => {
        await CheckEncryption.run([unencryptedWithNestedSecretsConfigPath])
        stderr.stop()

        expect(stderr.output).toMatch(
          new RegExp(
            `✖.*${unencryptedWithNestedSecretsConfigPath}.*NOT encrypted`
          )
        )
        // eslint-disable-next-line @typescript-eslint/unbound-method
        expect(process.exit).toHaveBeenCalledWith(0)
      })
    })

    describe('given a path to an UNENCRYPTED config file that does NOT contain secrets', () => {
      it('should exit with code 0 because there is nothing that needs encryption', async () => {
        await CheckEncryption.run([noSecretsConfigPath])
        stderr.stop()

        expect(stderr.output).toMatch(
          new RegExp(`Checking ${noSecretsConfigPath} for encryption`)
        )
        expect(stderr.output).toMatch(
          new RegExp(`✔ No secrets found in ${noSecretsConfigPath}`)
        )

        // eslint-disable-next-line @typescript-eslint/unbound-method
        expect(process.exit).toHaveBeenCalledWith(0)
      })
    })

    describe('given an invalid path', () => {
      it('should exit with code 1 and error message', async () => {
        const invalidPath = 'non/existant/path'
        await CheckEncryption.run([invalidPath])
        stderr.stop()

        expect(stderr.output).toMatch(
          new RegExp(`✖.*${invalidPath}.*doesn't exist`)
        )
        // eslint-disable-next-line @typescript-eslint/unbound-method
        expect(process.exit).toHaveBeenCalledWith(1)
      })
    })
  })

  describe('for MULTIPLE (but not all) files', () => {
    it('should validate all config files passed as arguments', async () => {
      const checkOneConfigFileSpy = jest.spyOn(
        CheckEncryption.prototype,
        'checkOneConfigFile'
      )
      await CheckEncryption.run([
        '--config-root',
        configRoot,
        encryptedConfigPath,
        unencryptedConfigPath,
      ])

      expect(checkOneConfigFileSpy).toHaveBeenCalledTimes(2)
      expect(checkOneConfigFileSpy).toHaveBeenNthCalledWith(
        1,
        encryptedConfigPath
      )

      expect(checkOneConfigFileSpy).toHaveBeenNthCalledWith(
        2,
        unencryptedConfigPath
      )
    })

    it('should exit with code 1 and error message when not all config files are valid', async () => {
      await CheckEncryption.run([
        '--config-root',
        configRoot,
        encryptedConfigPath,
        unencryptedConfigPath,
      ])
      stderr.stop()

      expect(stderr.output).toContain(
        `Secrets in ${unencryptedConfigPath} are NOT encrypted`
      )
      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(process.exit).toHaveBeenCalledWith(1)
    })
  })

  describe('for ALL files', () => {
    describe('given a folder with multiple config files', () => {
      it('should find all *.yaml and *.yml files in the configRoot dir', async () => {
        const checkOneConfigFileSpy = jest.spyOn(
          CheckEncryption.prototype,
          'checkOneConfigFile'
        )
        const flags = { 'config-root': 'example' }
        await CheckEncryption.run(['--config-root', flags['config-root']])

        expect(checkOneConfigFileSpy).toHaveBeenCalledTimes(
          allConfigFiles.length
        )
        expect(checkOneConfigFileSpy).toHaveBeenNthCalledWith(
          1,
          allConfigFiles[0]
        )
        expect(checkOneConfigFileSpy).toHaveBeenNthCalledWith(
          2,
          allConfigFiles[1]
        )
        expect(checkOneConfigFileSpy).toHaveBeenNthCalledWith(
          3,
          allConfigFiles[2]
        )
      })

      it('should exit with code 1 and error message when not all config files are encrypted', async () => {
        await CheckEncryption.run(['--config-root', './example'])
        stderr.stop()

        expect(stderr.output).toMatch(
          '✖ Secrets in example/unencrypted.yml are NOT encrypted'
        )
        expect(stderr.output).toMatch('✖ Not all secrets are encrypted')
        // eslint-disable-next-line @typescript-eslint/unbound-method
        expect(process.exit).toHaveBeenCalledWith(1)
      })
    })

    describe('given a folder with NO config files', () => {
      it('should exit with code 1 and error message', async () => {
        const invalidConfigRoot = './i/dont/exist'
        await CheckEncryption.run(['--config-root', invalidConfigRoot])
        stderr.stop()

        expect(stderr.output).toMatch(
          new RegExp(`✖.*Found no config files in.*${invalidConfigRoot}`)
        )
        // eslint-disable-next-line @typescript-eslint/unbound-method
        expect(process.exit).toHaveBeenCalledWith(1)
      })
    })
  })
})
