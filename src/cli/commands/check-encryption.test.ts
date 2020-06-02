jest.mock('../spinner')

import { stdout } from 'stdout-stderr'
import * as x from '../../utils/get-file-from-path'
import { getFileFromPath } from './../../utils/get-file-from-path'
import * as spinner from '../spinner'
import CheckEncryption, * as y from './check-encryption'

describe('strong-config check-encryption', () => {
  // Fixtures
  const encryptedConfigPath = 'example/development.yaml'
  const unencryptedConfigPath = 'example/unencrypted.yml'
  const allConfigFiles = [encryptedConfigPath, unencryptedConfigPath]

  // Mocks
  const mockedExit = jest.spyOn(process, 'exit').mockImplementation()
  const failSpinnerSpy = jest.spyOn(spinner, 'failSpinner')
  const succeedSpinnerSpy = jest.spyOn(spinner, 'succeedSpinner')

  beforeAll(() => {
    stdout.start()
  })

  beforeEach(() => {
    mockedExit.mockReset()
    succeedSpinnerSpy.mockReset()
    failSpinnerSpy.mockReset()
  })

  afterAll(() => {
    mockedExit.mockRestore()
    failSpinnerSpy.mockRestore()
    succeedSpinnerSpy.mockRestore()
    stdout.stop()
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

        expect(succeedSpinnerSpy).toHaveBeenCalledTimes(1)
        expect(mockedExit).toHaveBeenCalledWith(0)
      })
    })

    describe('given a path to an UNENCRYPTED config file', () => {
      it('should exit with code 1 and error message', async () => {
        await CheckEncryption.run([unencryptedConfigPath])

        expect(failSpinnerSpy).toHaveBeenCalledTimes(1)
        expect(mockedExit).toHaveBeenCalledWith(0)
      })
    })

    describe('given an invalid path', () => {
      it('should exit with code 1 and error message', async () => {
        await CheckEncryption.run(['non/existant/path'])

        expect(failSpinnerSpy).toHaveBeenCalledTimes(1)
        expect(mockedExit).toHaveBeenCalledWith(1)
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
          null,
          2
        )
      })

      it('should print out the contents of unencrypted config files to the terminal', async () => {
        const stringifySpy = jest.spyOn(JSON, 'stringify')
        const unencryptedConfigFile = getFileFromPath(unencryptedConfigPath)
        await CheckEncryption.run([unencryptedConfigPath, '-v'])
        expect(stringifySpy).toHaveBeenCalledWith(
          unencryptedConfigFile.contents,
          null,
          2
        )
      })
    })
  })

  describe('for ALL files', () => {
    describe('given a folder with multiple config files', () => {
      it('should find all *.yaml and *.yml files in the configRoot dir', async () => {
        const checkOneConfigFileSpy = jest.spyOn(y, 'checkOneConfigFile')
        const flags = { 'config-root': 'example', verbose: false }
        await CheckEncryption.run(['--config-root', flags['config-root']])

        expect(checkOneConfigFileSpy).toHaveBeenCalledTimes(
          allConfigFiles.length
        )
        expect(checkOneConfigFileSpy).toHaveBeenNthCalledWith(
          1,
          allConfigFiles[0],
          flags
        )
        expect(checkOneConfigFileSpy).toHaveBeenNthCalledWith(
          2,
          allConfigFiles[1],
          flags
        )

        checkOneConfigFileSpy.mockRestore()
      })

      it('should exit with code 1 and error message when not all config files are encrypted', async () => {
        await CheckEncryption.run(['--config-root', './example'])
        expect(failSpinnerSpy).toHaveBeenNthCalledWith(
          1,
          'Secrets in ./example/unencrypted.yml are NOT encrypted',
          new Error(),
          undefined
        )
        expect(failSpinnerSpy).toHaveBeenNthCalledWith(
          2,
          'Not all secrets are encrypted',
          new Error()
        )
        expect(mockedExit).toHaveBeenCalledWith(1)
      })
    })

    describe('given a folder with NO config files', () => {
      it('should exit with code 1 and error message', async () => {
        await CheckEncryption.run(['--config-root', './i/dont/exist'])

        expect(failSpinnerSpy).toHaveBeenCalledTimes(1)
        expect(mockedExit).toHaveBeenCalledWith(1)
      })
    })
  })
})
