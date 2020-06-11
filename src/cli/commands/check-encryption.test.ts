import { stderr } from 'stdout-stderr'
import { CheckEncryption } from './check-encryption'
import * as x from 'utils/get-file-from-path'
import { getFileFromPath } from 'utils/get-file-from-path'

describe('strong-config check-encryption', () => {
  // Fixtures
  const encryptedConfigPath = 'example/development.yaml'
  const unencryptedConfigPath = 'example/unencrypted.yml'
  const allConfigFiles = [encryptedConfigPath, unencryptedConfigPath]

  // Mocks
  const processExitMock = jest.spyOn(process, 'exit').mockImplementation()

  beforeEach(() => {
    stderr.start()
    processExitMock.mockReset()
  })

  afterAll(() => {
    processExitMock.mockRestore()
  })

  describe('for ONE file', () => {
    it('should read the config file', async () => {
      const getFileSpy = jest.spyOn(x, 'getFileFromPath')
      await CheckEncryption.run([encryptedConfigPath])

      expect(getFileSpy).toHaveBeenCalledWith(encryptedConfigPath)
      getFileSpy.mockRestore()
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
        expect(processExitMock).toHaveBeenCalledWith(0)
      })
    })

    describe('given a path to an UNENCRYPTED config file', () => {
      it('should exit with code 1 and error message', async () => {
        await CheckEncryption.run([unencryptedConfigPath])
        stderr.stop()

        expect(stderr.output).toMatch(
          new RegExp(`✖.*${unencryptedConfigPath}.*NOT encrypted`)
        )
        expect(processExitMock).toHaveBeenCalledWith(0)
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
        expect(processExitMock).toHaveBeenCalledWith(1)
      })
    })

    describe('when in verbose mode', () => {
      const stringifySpy = jest.spyOn(JSON, 'stringify')

      beforeEach(() => {
        stringifySpy.mockReset()
      })

      afterAll(() => {
        stringifySpy.mockRestore()
      })

      it('should print out the contents of encrypted config files to the terminal', async () => {
        const encryptedConfigFile = getFileFromPath(encryptedConfigPath)
        await CheckEncryption.run([encryptedConfigPath, '-v'])

        expect(stringifySpy).toHaveBeenCalledWith(
          encryptedConfigFile.contents,
          undefined,
          2
        )
      })

      it('should print out the contents of unencrypted config files to the terminal', async () => {
        const unencryptedConfigFile = getFileFromPath(unencryptedConfigPath)
        await CheckEncryption.run([unencryptedConfigPath, '-v'])

        expect(stringifySpy).toHaveBeenCalledWith(
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

        checkOneConfigFileSpy.mockRestore()
      })

      it('should exit with code 1 and error message when not all config files are encrypted', async () => {
        await CheckEncryption.run(['--config-root', './example'])
        stderr.stop()

        expect(stderr.output).toMatch(
          '✖ Secrets in ./example/unencrypted.yml are NOT encrypted'
        )
        expect(stderr.output).toMatch('✖ Not all secrets are encrypted')
        expect(processExitMock).toHaveBeenCalledWith(1)
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
        expect(processExitMock).toHaveBeenCalledWith(1)
      })
    })
  })
})
