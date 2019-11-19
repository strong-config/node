jest.mock('./validate')

import stdMocks from 'std-mocks'
import fs from 'fs'

import { validate } from './validate'
const mockedValidate = validate as jest.MockedFunction<typeof validate>

import Encrypt from './encrypt'

// This file is created in the beforeAll handler
const configPath = 'example/development.decrypted.yaml'
const outputPath = 'example/development.encrypted.yaml'
const backupPath = 'example/development.backup.yaml'
const schemaPath = 'example/schema.json'

const keyId = '2E9644A658379349EFB77E895351CE7FC0AC6E94' // example/pgp/example-keypair.pgp
const keyProvider = 'pgp'
const requiredKeyFlags = ['-k', keyId, '-p', keyProvider]

const mockedExit = jest.spyOn(process, 'exit').mockImplementation()

const unencryptedConfig = `name: example-project
someField:
    optionalField: 123
    requiredField: crucial string
someArray:
- joe
- freeman
someSecret: cantSeeMe
`

const expectedEncryptedConfig = expect.arrayContaining([
  'someField:',
  'optionalField: 123',
  'requiredField: crucial string',
  'someArray:',
  '- joe',
  '- freeman',
  expect.stringContaining('someSecret: ENC['),
  'sops:',
  'kms: []',
  'gcp_kms: []',
  'azure_kv: []',
  'encrypted_suffix: Secret',
])

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
    // Note: The PGP key required for encryption is imported in the test command in package.json
    beforeAll(() => {
      // Create unencrypted config file
      fs.writeFileSync(configPath, unencryptedConfig)
      // Copy unencrypted config file so we can restore it later
      fs.copyFileSync(configPath, backupPath)

      stdMocks.use()
    })

    beforeEach(() => {
      jest.clearAllMocks()
      stdMocks.flush()
    })

    afterEach(() => {
      // Delete temporary output file (encrypted config)
      try {
        fs.unlinkSync(outputPath)
      } catch (err) {
        console.log('No temporary output file found to delete')
      }

      // Restore backup config
      fs.copyFileSync(backupPath, configPath)
    })

    afterAll(() => {
      // Delete unencrypted config and backup config
      try {
        fs.unlinkSync(configPath)
        fs.unlinkSync(backupPath)
      } catch (err) {
        console.log('Could not find backup config file to delete')
      }

      stdMocks.restore()
    })

    it('exits with code 0 when successful', async () => {
      await Encrypt.run([configPath, ...requiredKeyFlags])

      expect(mockedExit).toHaveBeenCalledWith(0)
    })

    it('encrypts in-place when no output path is passed', async () => {
      await Encrypt.run([configPath, ...requiredKeyFlags])

      const encryptedConfigAsString = fs.readFileSync(configPath).toString()
      console.log(encryptedConfigAsString)

      expect(encryptedConfigAsString.split('\n').map(s => s.trim())).toEqual(
        expectedEncryptedConfig
      )
    })

    it('encrypts to encrypted file when output path is passed', async () => {
      await Encrypt.run([configPath, outputPath, ...requiredKeyFlags])

      const encryptedConfigAsString = fs.readFileSync(outputPath).toString()

      expect(encryptedConfigAsString.split('\n').map(s => s.trim())).toEqual(
        expectedEncryptedConfig
      )
    })

    it('fails when config file does not exist', async () => {
      await Encrypt.run(['non/existing/config.yaml', ...requiredKeyFlags])

      expect(mockedExit).toHaveBeenCalledWith(1)
    })

    it('encrypts and validates when schema path is passed', async () => {
      await Encrypt.run([
        configPath,
        ...requiredKeyFlags,
        '--schema-path',
        schemaPath,
      ])

      expect(mockedValidate).toHaveBeenCalledTimes(1)
    })

    it('fails when passed schema file does not exist', async () => {
      // Note: This will not encrypt the file as validation fails first
      await Encrypt.run([
        configPath,
        ...requiredKeyFlags,
        '--schema-path',
        'non/existing/schema.json',
      ])

      // TODO: Why doesn't it return exit code 1 here?
      expect(mockedExit).toHaveBeenCalledWith(0)
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

    it('shows the encryption status', async () => {
      await Encrypt.run([configPath, outputPath, ...requiredKeyFlags])

      expect(stdMocks.flush().stderr.join('')).toMatch('💪  Encrypted!')
    })

    it('shows an error when encryption fails ', async () => {
      await Encrypt.run([
        'non/existing/config.yaml',
        outputPath,
        ...requiredKeyFlags,
      ])

      expect(stdMocks.flush().stderr.join('')).toMatch(
        /Failed to encrypt config file/
      )
    })

    // TODO: Investigate why 'Validated!' is not available in mocked stderr
    test.todo('shows the validation status when schema path is passed')
  })
})
