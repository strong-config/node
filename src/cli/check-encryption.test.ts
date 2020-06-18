import { stderr, stdout } from 'stdout-stderr'
import * as readFiles from '../utils/read-file'
import { CheckEncryption } from './check-encryption'

describe('strong-config check-encryption', () => {
  const encryptedConfigPath = 'example/development.yaml'
  const invalidConfigPath = 'example/invalid.yml'
  const unencryptedConfigPath = 'example/unencrypted.yml'

  const allConfigFiles = [
    encryptedConfigPath,
    invalidConfigPath,
    unencryptedConfigPath,
  ]

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
      jest.spyOn(readFiles, 'readConfigFromPath')
      await CheckEncryption.run([encryptedConfigPath])

      expect(readFiles.readConfigFromPath).toHaveBeenCalledWith(
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

    describe('given a path to an UNENCRYPTED config file', () => {
      it('should exit with code 1 and error message', async () => {
        await CheckEncryption.run([unencryptedConfigPath])
        stderr.stop()

        expect(stderr.output).toMatch(
          new RegExp(`✖.*${unencryptedConfigPath}.*NOT encrypted`)
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

    describe('when in verbose mode', () => {
      beforeAll(() => {
        jest.spyOn(JSON, 'stringify')
      })

      beforeEach(() => {
        jest.clearAllMocks()
      })

      it('should print out the contents of encrypted config files to the terminal', async () => {
        const encryptedConfigFile = readFiles.readConfigFromPath(
          encryptedConfigPath
        )
        await CheckEncryption.run([encryptedConfigPath, '-v'])

        expect(JSON.stringify).toHaveBeenCalledWith(
          encryptedConfigFile.contents,
          undefined,
          2
        )
      })

      it('should print out the contents of unencrypted config files to the terminal', async () => {
        const unencryptedConfigFile = readFiles.readConfigFromPath(
          unencryptedConfigPath
        )
        await CheckEncryption.run([unencryptedConfigPath, '-v'])

        expect(JSON.stringify).toHaveBeenCalledWith(
          unencryptedConfigFile.contents,
          undefined,
          2
        )
      })
    })
  })

  describe('for ALL files', () => {
    describe('given a folder with multiple config files', () => {
      it('should find all *.yaml and *.yml files in the configRoot dir', async () => {
        const checkOneConfigFileSpy = jest.spyOn(
          CheckEncryption.prototype,
          'checkOneConfigFile'
        )
        const flags = { 'config-root': 'example', verbose: false }
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
      })

      it('should exit with code 1 and error message when not all config files are encrypted', async () => {
        await CheckEncryption.run(['--config-root', './example'])
        stderr.stop()

        expect(stderr.output).toMatch(
          '✖ Secrets in ./example/unencrypted.yml are NOT encrypted'
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
