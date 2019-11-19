jest.mock('./find-files')
jest.mock('./get-file-from-path')
import { findConfigFilesAtPath, isJson } from './find-files'
import { getFileFromPath } from './get-file-from-path'

const mockedfindConfigFilesAtPath = findConfigFilesAtPath as jest.MockedFunction<
  typeof findConfigFilesAtPath
>
const mockedIsJson = isJson as jest.MockedFunction<typeof isJson>
const mockedGetFileFromPath = getFileFromPath as jest.MockedFunction<
  typeof getFileFromPath
>

const mockedConfigFilePaths = ['config/development.yml']
const mockedSchemaFilePaths = ['config/schema.json']
mockedfindConfigFilesAtPath.mockReturnValue(mockedConfigFilePaths)
const mockedFile: File = {
  contents: {
    parsed: 'values',
  },
  filePath: mockedConfigFilePaths[0],
}
mockedGetFileFromPath.mockReturnValue(mockedFile)
mockedIsJson.mockReturnValue(true)

import { readConfigFile, readSchemaFile, File } from './read-file'

describe('readConfigFile()', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('passes arguments to findConfigFilesAtPath', () => {
    readConfigFile('config', 'smth')

    expect(mockedfindConfigFilesAtPath).toHaveBeenCalledWith('config', 'smth')
  })

  it('throws when files array is empty', () => {
    mockedfindConfigFilesAtPath.mockReturnValueOnce([])

    expect(() => readConfigFile('config', 'smth')).toThrow(
      /One of these files must exist/
    )
  })

  it('throws when files array contains more than one match', () => {
    mockedfindConfigFilesAtPath.mockReturnValueOnce([
      ...mockedConfigFilePaths,
      'config/anotherfile.yaml',
    ])

    expect(() => readConfigFile('config', 'development')).toThrow(
      /Exactly one must exist/
    )
  })

  it('reads file when exactly one config is found', () => {
    readConfigFile('dev/config', 'development')

    expect(mockedGetFileFromPath).toHaveBeenCalledWith(mockedConfigFilePaths[0])
  })

  it('returns result of getFileFromPath', () => {
    expect(readConfigFile('dev/config', 'development')).toEqual(mockedFile)
  })
})

describe('readSchemaFile()', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('returns null when input is not a JSON file', () => {
    mockedIsJson.mockReturnValueOnce(false)

    expect(readSchemaFile('not-a-json-file.yaml')).toBeNull()
  })

  it('reads file by calling getFileFromPath', () => {
    readSchemaFile(mockedSchemaFilePaths[0])

    expect(mockedGetFileFromPath).toHaveBeenCalledWith(mockedSchemaFilePaths[0])
  })

  it('returns result of getFileFromPath', () => {
    expect(readSchemaFile(mockedSchemaFilePaths[0])).toEqual(mockedFile)
  })
})
