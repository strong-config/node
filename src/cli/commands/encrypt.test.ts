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

import Encrypt from './encrypt'

// This file is created in the beforeAll handler
const configPath = 'example/development.decrypted.yaml'
const schemaPath = 'example/schema.json'

const keyId = '2E9644A658379349EFB77E895351CE7FC0AC6E94' // example/pgp/example-keypair.pgp
const keyProvider = 'pgp'
const requiredKeyFlags = ['-k', keyId, '-p', keyProvider]

const mockedExit = jest.spyOn(process, 'exit').mockImplementation()

describe('strong-config encrypt', () => {
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
        await Encrypt.run(['--help'])
      } catch (error) {}

      expect(stdMocks.flush().stdout).toEqual(expectedHelpOutput)
    })

    it('always prints help with any command having --help', async () => {
      try {
        await Encrypt.run([
          'some/config/file.yml',
          '--help',
          '--schema-path',
          'path/to/schema.json',
          ...requiredKeyFlags,
        ])
      } catch (error) {}

      expect(stdMocks.flush().stdout).toEqual(expectedHelpOutput)
    })
  })

  describe('handles encryption', () => {
    beforeEach(() => {
      jest.clearAllMocks()
    })

    it('exits with code 0 when successful', async () => {
      await Encrypt.run([configPath, ...requiredKeyFlags])

      expect(mockedExit).toHaveBeenCalledWith(0)
    })

    it('exits with code 1 when encryption fails', async () => {
      mockedRunSopsWithOptions.mockImplementationOnce(() => {
        throw sopsError
      })

      await Encrypt.run([configPath, ...requiredKeyFlags])

      expect(mockedExit).toHaveBeenCalledWith(1)
    })

    it('encrypts by using sops', async () => {
      await Encrypt.run([configPath, ...requiredKeyFlags])

      expect(mockedRunSopsWithOptions).toHaveBeenCalledWith([
        '--encrypt',
        ...mockedSopsOptions,
      ])
    })

    it('encrypts and validates when schema path is passed', async () => {
      await Encrypt.run([
        configPath,
        ...requiredKeyFlags,
        '--schema-path',
        schemaPath,
      ])

      expect(mockedValidate).toHaveBeenCalledWith(
        configPath,
        schemaPath,
        VerbosityLevel.Verbose
      )
    })

    it('fails when no arguments are passed', async () => {
      await expect(Encrypt.run([configPath])).rejects.toThrowError(
        /--key-provider KEY-PROVIDER/
      )
    })

    it('fails when no key provider is passed with --key-provider/-p', async () => {
      await expect(Encrypt.run([configPath, '-k', keyId])).rejects.toThrowError(
        /--key-provider KEY-PROVIDER/
      )
    })

    it('fails when no key id is passed with --key-id/-k', async () => {
      await expect(
        Encrypt.run([configPath, '-p', keyProvider])
      ).rejects.toThrowError(/--key-id= must also be provided/)
    })
  })

  describe('informs the user', () => {
    beforeEach(() => {
      jest.clearAllMocks()
    })

    it('informs user about the encryption process', async () => {
      await Encrypt.run([configPath, ...requiredKeyFlags])

      expect(mockedStartSpinner).toHaveBeenCalledWith('Encrypting...')
    })

    it('informs user about the encryption result', async () => {
      await Encrypt.run([configPath, ...requiredKeyFlags])

      expect(mockedSuceedSpinner).toHaveBeenCalledWith('Encrypted!')
    })

    it('informs user about encryption errors', async () => {
      mockedRunSopsWithOptions.mockImplementationOnce(() => {
        throw sopsError
      })

      await Encrypt.run([configPath, ...requiredKeyFlags])

      expect(mockedFailSpinner).toHaveBeenCalledWith(
        'Failed to encrypt config file',
        expect.any(Error),
        VerbosityLevel.Verbose
      )
    })
  })
})
