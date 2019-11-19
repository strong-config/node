jest.mock('../../validate')

import stdMocks from 'std-mocks'

import { validate as validateUtil } from '../../validate'
const mockedValidateUtil = validateUtil as jest.MockedFunction<
  typeof validateUtil
>

import Validate from './validate'

const configPath = 'example/development.yaml'
const schemaPath = 'example/schema.json'

const mockedExit = jest.spyOn(process, 'exit').mockImplementation()

describe('strong-config validate', () => {
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
        await Validate.run([configPath, schemaPath, '--help'])
      } catch (error) {}

      expect(stdMocks.flush().stdout).toEqual(expectedHelpOutput)
    })

    it('always prints help with any command having --help', async () => {
      try {
        await Validate.run(['--help'])
      } catch (error) {}

      expect(stdMocks.flush().stdout).toEqual(expectedHelpOutput)
    })
  })

  describe('handles validation', () => {
    beforeAll(() => {
      stdMocks.use()
    })

    beforeEach(() => {
      jest.clearAllMocks()
      stdMocks.flush()
    })

    afterEach(() => {
      stdMocks.restore()
    })

    it('exits with code 0 when successful', async () => {
      await Validate.run([configPath, schemaPath])

      expect(mockedExit).toHaveBeenCalledWith(0)
    })

    it('validates against schema', async () => {
      await Validate.run([configPath, schemaPath])

      expect(mockedValidateUtil).toHaveBeenCalledTimes(1)
    })

    // TODO: Investigate why this isn't writing to mocked stderr as it does with the decryption output
    test.todo('shows the validation status')
  })
})
