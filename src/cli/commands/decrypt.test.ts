jest.mock('./validate')
jest.mock('../spinner')
jest.mock('../../utils/sops')

import stdMocks from 'std-mocks'

import { validate } from './validate'
import {
  startSpinner,
  failSpinner,
  succeedSpinner,
  getVerbosityLevel,
  VerbosityLevel,
} from '../spinner'
import { getSopsOptions, runSopsWithOptions } from '../../utils/sops'

const mockedRunSopsWithOptions = runSopsWithOptions as jest.MockedFunction<
  typeof runSopsWithOptions
>
const mockedGetSopsOptions = getSopsOptions as jest.MockedFunction<
  typeof getSopsOptions
>

const mockedValidate = validate as jest.MockedFunction<typeof validate>

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

import Decrypt from './decrypt'

const configPath = 'example/development.yaml'
const outputPath = 'example/development.decrypted.yaml'
const schemaPath = 'example/schema.json'

const mockedExit = jest.spyOn(process, 'exit').mockImplementation()

describe('strong-config decrypt', () => {
  afterAll(() => {
    mockedExit.mockRestore()
  })

  describe('shows help', () => {
    const expectedHelpOutput = expect.arrayContaining([
      expect.stringMatching(/ARGUMENTS/),
      expect.stringMatching(/USAGE/),
      expect.stringMatching(/OPTIONS/),
    ])

    beforeAll(() => {
      stdMocks.use()
    })

    afterAll(() => {
      stdMocks.restore()
    })

    beforeEach(() => {
      stdMocks.flush()
    })

    it('prints the help with --help', async () => {
      try {
        await Decrypt.run([configPath, outputPath, '--help'])
      } catch (error) {}

      expect(stdMocks.flush().stdout).toEqual(expectedHelpOutput)
    })

    it('always prints help with any command having --help', async () => {
      try {
        await Decrypt.run(['--help'])
      } catch (error) {}

      expect(stdMocks.flush().stdout).toEqual(expectedHelpOutput)
    })
  })

  describe('handles decryption', () => {
    beforeEach(() => {
      jest.clearAllMocks()
    })

    it('exits with code 0 when successful', async () => {
      await Decrypt.run([configPath])

      expect(mockedExit).toHaveBeenCalledWith(0)
    })

    it('exits with code 1 when decryption fails', async () => {
      mockedRunSopsWithOptions.mockImplementationOnce(() => {
        throw sopsError
      })

      await Decrypt.run([configPath])

      expect(mockedExit).toHaveBeenCalledWith(1)
    })

    it('decrypts by using sops', async () => {
      await Decrypt.run([configPath])

      expect(mockedRunSopsWithOptions).toHaveBeenCalledWith([
        '--decrypt',
        ...mockedSopsOptions,
      ])
    })

    it('decrypts and validates when schema path is passed', async () => {
      await Decrypt.run([configPath, '--schema-path', schemaPath])

      expect(mockedValidate).toHaveBeenCalledWith(
        configPath,
        schemaPath,
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
      await Decrypt.run([configPath])

      expect(mockedStartSpinner).toHaveBeenCalledWith('Decrypting...')
    })

    it('informs user about the decryption result', async () => {
      await Decrypt.run([configPath])

      expect(mockedSuceedSpinner).toHaveBeenCalledWith(
        `Successfully decrypted ${configPath}!`
      )
    })

    it('informs user about decryption errors', async () => {
      mockedRunSopsWithOptions.mockImplementationOnce(() => {
        throw sopsError
      })

      await Decrypt.run([configPath])

      expect(mockedFailSpinner).toHaveBeenCalledWith(
        'Failed to decrypt config file',
        expect.any(Error),
        VerbosityLevel.Verbose
      )
    })
  })
})
