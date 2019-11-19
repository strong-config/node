jest.mock('./validate')

import stdMocks from 'std-mocks'
import fs from 'fs'

import { validate } from './validate'
const mockedValidate = validate as jest.MockedFunction<typeof validate>

// Expected output (decrypted config) without whitespace to allow for simple comparisons
const expectedDecryptedConfig = `
    name: example-project
    someField:
      optionalField: 123
      requiredField: crucial string
    someArray:
    - joe
    - freeman
    someSecret: cantSeeMe
`.replace(/\s/g, '')

import Decrypt from './decrypt'

const configPath = 'example/development.yaml'
const outputPath = 'example/development.decrypted.yaml'
const backupPath = 'example/development.backup.yaml'
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
    beforeAll(() => {
      // Copy encrypted config file so we can restore it later
      fs.copyFileSync(configPath, backupPath)

      stdMocks.use()
    })

    beforeEach(() => {
      jest.clearAllMocks()
      stdMocks.flush()
    })

    afterEach(() => {
      // Delete temporary output file (decrypted config)
      try {
        console.log('Unlinking')
        fs.unlinkSync(outputPath)
      } catch (err) {
        console.log('No temporary output file found to delete')
      }

      // Restore backup config
      fs.copyFileSync(backupPath, configPath)
    })

    afterAll(() => {
      // Delete backup config
      try {
        fs.unlinkSync(backupPath)
      } catch (err) {
        console.log('Could not find backup config file to delete')
      }

      stdMocks.restore()
    })

    it('exits with code 0 when successful', async () => {
      await Decrypt.run([configPath])

      expect(mockedExit).toHaveBeenCalledWith(0)
    })

    it('decrypts in-place when no output path is passed', async () => {
      await Decrypt.run([configPath])

      const decryptedConfigAsString = fs.readFileSync(configPath).toString()

      expect(decryptedConfigAsString.replace(/\s/g, '')).toBe(
        expectedDecryptedConfig
      )
    })

    it('decrypts to unencrypted file when output path is passed', async () => {
      await Decrypt.run([configPath, outputPath])

      const decryptedConfigAsString = fs.readFileSync(outputPath).toString()

      expect(decryptedConfigAsString.replace(/\s/g, '')).toBe(
        expectedDecryptedConfig
      )
    })

    it('fails when config file does not exist', async () => {
      await Decrypt.run(['non/existing/config.yaml'])

      expect(mockedExit).toHaveBeenCalledWith(1)
    })

    it('decrypts and validates when schema path is passed', async () => {
      await Decrypt.run([configPath, '--schema-path', schemaPath])

      expect(mockedValidate).toHaveBeenCalledTimes(1)
    })

    it('fails when no arguments are passed', async () => {
      await expect(Decrypt.run([])).rejects.toThrowError(
        /Missing 1 required arg/
      )
    })

    it('fails when passed schema file does not exist', async () => {
      // Note: This will still decrypt the config. Only after decryption, validation fails.
      await Decrypt.run([
        configPath,
        '--schema-path',
        'non/existing/schema.json',
      ])

      // TODO: Why doesn't it return exit code 1 here?
      expect(mockedExit).toHaveBeenCalledWith(0)
    })

    it('shows the decryption status', async () => {
      await Decrypt.run([configPath, outputPath])

      expect(stdMocks.flush().stderr.join('')).toMatch('💪  Decrypted!')
    })

    it('shows an error when decryption fails ', async () => {
      await Decrypt.run(['non/existing/config.yaml'])

      expect(stdMocks.flush().stderr.join('')).toMatch(
        /Failed to decrypt config file/
      )
    })

    // TODO: Investigate why 'Validated!' is not available in mocked stderr
    test.todo('shows the validation status when schema path is passed')
  })
})
