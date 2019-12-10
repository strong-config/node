jest.mock('../../validate')
jest.mock('../spinner')

import stdMocks from 'std-mocks'

import { validate as validateUtil } from '../../validate'
import {
  startSpinner,
  failSpinner,
  succeedSpinner,
  getVerbosityLevel,
  VerbosityLevel,
} from '../spinner'

const mockedValidateUtil = validateUtil as jest.MockedFunction<
  typeof validateUtil
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

import Validate from './validate'

const configPath = 'example/development.yaml'
const schemaPath = 'example/schema.json'

const validationError = new Error('some validation error')

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
    beforeEach(() => {
      jest.clearAllMocks()
    })

    it('exits with code 0 when successful', async () => {
      await Validate.run([configPath, schemaPath])

      expect(mockedExit).toHaveBeenCalledWith(0)
    })

    it('exits with code 1 when validation fails', async () => {
      mockedValidateUtil.mockImplementationOnce(() => {
        throw validationError
      })

      await Validate.run([configPath, schemaPath])

      expect(mockedExit).toHaveBeenCalledWith(1)
    })

    it('validates against schema', async () => {
      await Validate.run([configPath, schemaPath])

      expect(mockedValidateUtil).toHaveBeenCalledTimes(1)
    })
  })

  describe('informs the user', () => {
    beforeEach(() => {
      jest.clearAllMocks()
    })

    it('informs user about the validation process', async () => {
      await Validate.run([configPath, schemaPath])

      expect(mockedStartSpinner).toHaveBeenCalledWith('Validating...')
    })

    it('informs user about the validation result', async () => {
      await Validate.run([configPath, schemaPath])

      expect(mockedSuceedSpinner).toHaveBeenCalledWith('Validated!')
    })

    it('informs user about validation errors', async () => {
      mockedValidateUtil.mockImplementationOnce(() => {
        throw validationError
      })

      await Validate.run([configPath, schemaPath])

      expect(mockedFailSpinner).toHaveBeenCalledWith(
        'Config validation against schema failed',
        expect.any(Error),
        VerbosityLevel.Verbose
      )
    })
  })
})
