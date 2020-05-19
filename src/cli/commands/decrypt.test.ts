jest.mock('./validate')
jest.mock('../spinner')
jest.mock('../../utils/sops')

import Decrypt from './decrypt'
import { stdout } from 'stdout-stderr'

import { validateCliWrapper } from './validate'
import {
  startSpinner,
  failSpinner,
  succeedSpinner,
  getVerbosityLevel,
  VerbosityLevel,
} from '../spinner'
import { getSopsOptions, runSopsWithOptions } from '../../utils/sops'

// Mocks
const mockedRunSopsWithOptions = runSopsWithOptions as jest.MockedFunction<
  typeof runSopsWithOptions
>
const mockedGetSopsOptions = getSopsOptions as jest.MockedFunction<
  typeof getSopsOptions
>

const mockedValidate = validateCliWrapper as jest.MockedFunction<
  typeof validateCliWrapper
>

const mockedStartSpinner = startSpinner as jest.MockedFunction<
  typeof startSpinner
>
const mockedFailSpinner = failSpinner as jest.MockedFunction<typeof failSpinner>
const mockedSuceedSpinner = succeedSpinner as jest.MockedFunction<
  typeof succeedSpinner
>
const mockedGetVerbosityLevel = getVerbosityLevel as jest.MockedFunction<
  typeof getVerbosityLevel
>

mockedGetVerbosityLevel.mockReturnValue(VerbosityLevel.Verbose)

const mockedSopsOptions = ['--some', '--flags']
mockedGetSopsOptions.mockReturnValue(mockedSopsOptions)
const sopsError = new Error('some sops error')

const configRoot = 'example'
const configFile = 'example/development.yaml'

const mockedExit = jest.spyOn(process, 'exit').mockImplementation()

describe('strong-config decrypt', () => {
  afterAll(() => {
    mockedExit.mockRestore()
  })

  describe('shows help', () => {
    it('prints the help with --help', async () => {
      try {
        stdout.start()
        await Decrypt.run(['--help'])
        stdout.stop()
      } catch (error) {}

      expect(stdout.output).toContain('USAGE')
      expect(stdout.output).toContain('ARGUMENTS')
      expect(stdout.output).toContain('OPTIONS')
      expect(stdout.output).toContain('EXAMPLES')
    })

    it('always prints help with any command having --help', async () => {
      try {
        stdout.start()
        await Decrypt.run(['some/config/file.yaml', '--help'])
        stdout.stop()
      } catch (error) {}

      expect(stdout.output).toContain('USAGE')
      expect(stdout.output).toContain('ARGUMENTS')
      expect(stdout.output).toContain('OPTIONS')
      expect(stdout.output).toContain('EXAMPLES')
    })
  })

  describe('handles decryption', () => {
    beforeEach(() => {
      jest.clearAllMocks()
    })

    it('exits with code 0 when successful', async () => {
      await Decrypt.run([configFile])

      expect(mockedExit).toHaveBeenCalledWith(0)
    })

    it('exits with code 1 when decryption fails', async () => {
      mockedRunSopsWithOptions.mockImplementationOnce(() => {
        throw sopsError
      })

      await Decrypt.run([configFile])

      expect(mockedExit).toHaveBeenCalledWith(1)
    })

    it('decrypts by using sops', async () => {
      await Decrypt.run([configFile])

      expect(mockedRunSopsWithOptions).toHaveBeenCalledWith([
        '--decrypt',
        ...mockedSopsOptions,
      ])
    })

    it('decrypts and validates when configRoot contains schema.json', async () => {
      await Decrypt.run([configFile, '--config-root', configRoot])

      expect(mockedValidate).toHaveBeenCalledWith(
        configFile,
        configRoot,
        VerbosityLevel.Verbose
      )
    })

    it('fails when no arguments are passed', async () => {
      await expect(Decrypt.run([])).rejects.toThrowError(
        /Missing 1 required arg/
      )
    })
  })

  describe('informs the user', () => {
    beforeEach(() => {
      jest.clearAllMocks()
    })

    it('informs user about the decryption process', async () => {
      await Decrypt.run([configFile])

      expect(mockedStartSpinner).toHaveBeenCalledWith('Decrypting...')
    })

    it('informs user about the decryption result', async () => {
      await Decrypt.run([configFile])

      expect(mockedSuceedSpinner).toHaveBeenCalledWith(
        `Successfully decrypted ${configFile}!`
      )
    })

    it('informs user about decryption errors', async () => {
      mockedRunSopsWithOptions.mockImplementationOnce(() => {
        throw sopsError
      })

      await Decrypt.run([configFile])

      expect(mockedFailSpinner).toHaveBeenCalledWith(
        'Failed to decrypt config file',
        expect.any(Error),
        VerbosityLevel.Verbose
      )
    })
  })
})
