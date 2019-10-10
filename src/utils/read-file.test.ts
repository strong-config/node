jest.mock('./find-files')
jest.mock('./get-file-from-path')
import { findConfigFiles, findFiles, File } from './find-files'
import { getFileFromPath } from './get-file-from-path'

const mockedFindConfigFiles = findConfigFiles as jest.MockedFunction<
  typeof findConfigFiles
>
const mockedFindFiles = findFiles as jest.MockedFunction<typeof findFiles>
const mockedGetFileFromPath = getFileFromPath as jest.MockedFunction<
  typeof getFileFromPath
>

const mockedConfigFilePaths = ['config/development.yml']
const mockedSchemaFilePaths = ['config/schema.json']
mockedFindConfigFiles.mockReturnValue(mockedConfigFilePaths)
mockedFindFiles.mockReturnValue(mockedSchemaFilePaths)
const mockedFile: File = {
  contents: {
    parsed: 'values',
  },
  filePath: mockedConfigFilePaths[0],
}
mockedGetFileFromPath.mockReturnValue(mockedFile)

import { readConfigFile, readSchemaFile } from './read-file'

describe('readConfigFile()', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('passes arguments to findConfigFiles', () => {
    readConfigFile('config', 'smth')

    expect(mockedFindConfigFiles).toHaveBeenCalledWith('config', 'smth')
  })

  it('throws when files array is empty', () => {
    mockedFindConfigFiles.mockReturnValueOnce([])

    expect(() => readConfigFile('config', 'smth')).toThrow(
      /One of these files must exist/
    )
  })

  it('throws when files array contains more than one match', () => {
    mockedFindConfigFiles.mockReturnValueOnce([
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

  it('returns undefined and does not throw Error when files array is empty', () => {
    mockedFindFiles.mockReturnValueOnce([])

    expect(readSchemaFile('schema')).toBeUndefined()
  })

  it('throws when files array contains more than one match', () => {
    mockedFindFiles.mockReturnValueOnce([
      ...mockedConfigFilePaths,
      'config/anotherschema.json',
    ])

    expect(() => readSchemaFile('schema')).toThrow(/Exactly one must exist/)
  })

  it('reads file when exactly one schema is found', () => {
    readSchemaFile('schema')

    expect(mockedGetFileFromPath).toHaveBeenCalledWith(mockedSchemaFilePaths[0])
  })

  it('returns result of getFileFromPath', () => {
    expect(readSchemaFile('schema')).toEqual(mockedFile)
  })
})
