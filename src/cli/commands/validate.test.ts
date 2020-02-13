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

const configFile = 'example/development.yaml'

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

    beforeEach(() => {
      stdMocks.flush()
    })

    afterAll(() => {
      stdMocks.restore()
    })

    // TODO: The stdMocks aren't working correctly. For some reason although there is output generated in the CLI, nothing gets captured in stdMocks
    it.skip('prints the help with --help', async () => {
      try {
        await Validate.run(['--help'])
      } catch (error) {}

      expect(stdMocks.flush().stdout).toEqual(expectedHelpOutput)
    })

    // TODO: The stdMocks aren't working correctly. For some reason although there is output generated in the CLI, nothing gets captured in stdMocks
    it.skip('always prints help with any command having --help', async () => {
      try {
        await Validate.run([configFile, '--help'])
      } catch (error) {}

      expect(stdMocks.flush().stdout).toEqual(expectedHelpOutput)
    })
  })

  describe('handles validation', () => {
    beforeEach(() => {
      jest.clearAllMocks()
    })

    it('exits with code 0 when successful', async () => {
      await Validate.run([configFile])

      expect(mockedExit).toHaveBeenCalledWith(0)
    })

    it('exits with code 1 when validation fails', async () => {
      mockedValidateUtil.mockImplementationOnce(() => {
        throw validationError
      })

      await Validate.run([configFile])

      expect(mockedExit).toHaveBeenCalledWith(1)
    })

    it('validates against schema', async () => {
      await Validate.run([configFile])

      expect(mockedValidateUtil).toHaveBeenCalledTimes(1)
    })
  })

  describe('informs the user', () => {
    beforeEach(() => {
      jest.clearAllMocks()
    })

    it('informs user about the validation process', async () => {
      await Validate.run([configFile])

      expect(mockedStartSpinner).toHaveBeenCalledWith('Validating...')
    })

    it('informs user about the validation result', async () => {
      await Validate.run([configFile])

      expect(mockedSuceedSpinner).toHaveBeenCalledWith('Config is valid!')
    })

    it('informs user about validation errors', async () => {
      mockedValidateUtil.mockImplementationOnce(() => {
        throw validationError
      })

      await Validate.run([configFile])

      expect(mockedFailSpinner).toHaveBeenCalledWith(
        'Config validation against schema failed',
        expect.any(Error),
        VerbosityLevel.Verbose
      )
    })
  })
})
