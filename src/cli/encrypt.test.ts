/* eslint-disable @typescript-eslint/unbound-method */
import { stderr, stdout } from 'stdout-stderr'
import { runSopsWithOptions } from '../utils/sops'
import { loadSchema } from '../utils/load-files'
import { Encrypt } from './encrypt'
import * as validateCommand from './validate'

jest.mock('../utils/sops', () => {
  return {
    runSopsWithOptions: jest.fn(),
    getSopsOptions: jest.fn(() => ['--some', '--flags']),
  }
})

const runSopsWithOptionsMock = runSopsWithOptions as jest.Mock<
  ReturnType<typeof runSopsWithOptions>
>

describe('strong-config encrypt', () => {
  const configRoot = 'example'
  const configFile = 'example/development.decrypted.yaml'
  const schema = loadSchema(configRoot)
  const sopsError = new Error('some sops error')
  const keyId = '2E9644A658379349EFB77E895351CE7FC0AC6E94' // => ./example/pgp/example-keypair.pgp
  const keyProvider = 'pgp'
  const requiredKeyFlags = ['-k', keyId, '-p', keyProvider]

  beforeAll(() => {
    jest.spyOn(console, 'error').mockImplementation()
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

  it('exits with code 0 when successful', async () => {
    await Encrypt.run([configFile, ...requiredKeyFlags])

    expect(process.exit).toHaveBeenCalledWith(0)
  })

  it('exits with code 1 when encryption fails', async () => {
    runSopsWithOptionsMock.mockImplementationOnce(() => {
      throw sopsError
    })

    await Encrypt.run([configFile, ...requiredKeyFlags])

    expect(process.exit).toHaveBeenCalledWith(1)
  })

  it('encrypts by using sops', async () => {
    await Encrypt.run([configFile, ...requiredKeyFlags])

    expect(runSopsWithOptions).toHaveBeenCalledWith([
      '--encrypt',
      '--some',
      '--flags',
    ])
  })

  describe('given a config-root with a schema file', () => {
    it('validates config against schema BEFORE encrypting', async () => {
      jest.spyOn(validateCommand, 'validateOneConfigFile')

      await Encrypt.run([
        configFile,
        ...requiredKeyFlags,
        '--config-root',
        configRoot,
      ])

      expect(validateCommand.validateOneConfigFile).toHaveBeenCalledWith(
        configFile,
        configRoot,
        schema
      )

      expect(validateCommand.validateOneConfigFile).toHaveBeenCalledBefore(
        runSopsWithOptionsMock
      )
    })
  })

  describe('when config file is already encrypted', () => {
    it('displays a useful error message', async () => {
      runSopsWithOptionsMock.mockImplementationOnce(() => {
        const error = new Error(
          'original non-userfriendly error message from sops :: already encrypted'
        )
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        error.exitCode = 203 // this is sops' error-code
        throw error
      })

      await Encrypt.run([configFile, ...requiredKeyFlags])

      expect(console.error).toHaveBeenCalledWith(
        expect.stringContaining('is already encrypted')
      )
    })
  })

  describe('when using GCP as a KMS and an error happens on GCP-side', () => {
    it('displays a useful error message', async () => {
      runSopsWithOptionsMock.mockImplementationOnce(() => {
        const error = new Error(
          'original non-userfriendly error message from sops :: some GCP problem'
        )
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        error.stderr =
          'potentially long and complicated too read error string containing the word "GCP"'
        throw error
      })

      await Encrypt.run([configFile, ...requiredKeyFlags])

      expect(console.error).toHaveBeenCalledWith(
        expect.stringContaining('Google Cloud KMS Error')
      )
    })
  })

  describe('cli output', () => {
    it('displays the encryption process', async () => {
      await Encrypt.run([configFile, ...requiredKeyFlags])
      stderr.stop()

      expect(stderr.output).toMatch('Encrypting...')
    })

    it('displays the encryption result', async () => {
      await Encrypt.run([configFile, ...requiredKeyFlags])
      stderr.stop()

      expect(stderr.output).toMatch(`Successfully encrypted ${configFile}!`)
    })

    it('displays encryption errors', async () => {
      runSopsWithOptionsMock.mockImplementationOnce(() => {
        throw sopsError
      })

      await Encrypt.run([configFile, ...requiredKeyFlags])
      stderr.stop()

      expect(stderr.output).toMatch('Failed to encrypt config file')
    })
  })
})
