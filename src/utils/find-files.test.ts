jest.mock('glob')
jest.mock('path')
jest.mock('./read-file')
import glob from 'glob'
import path from 'path'
import { getFileExtensionPattern } from './read-file'
const mockedGlob = glob as jest.Mocked<typeof glob>
const mockedPath = path as jest.Mocked<typeof path>
const mockedGetFileExtensionPattern = getFileExtensionPattern as jest.MockedFunction<
  typeof getFileExtensionPattern
>

const mockedFileNames = ['/dev/config/development.yml', 'schema.json']
const mockedResolvedPath = '/dev'
mockedGlob.sync = jest.fn().mockReturnValue(mockedFileNames)
mockedPath.resolve = jest.fn().mockReturnValue(mockedResolvedPath)
mockedGetFileExtensionPattern.mockReturnValue('json')

import { findConfigFiles, findFiles, isSchema } from './find-files'

describe('findFiles()', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('invokes glob.sync', () => {
    findFiles('some/path')

    expect(mockedGlob.sync).toHaveBeenCalledTimes(1)
  })

  it('returns result of glob.sync', () => {
    expect(findFiles('some/path')).toEqual(mockedFileNames)
  })

  it('invokes glob.sync with correct default glob', () => {
    findFiles('some/path')

    expect(mockedGlob.sync).toHaveBeenCalledWith('**/*.*', expect.any(Object))
  })

  it('builds non-default glob correctly', () => {
    findFiles('some/path', 'schema', 'json')

    expect(mockedGlob.sync).toHaveBeenCalledWith(
      'schema.json',
      expect.any(Object)
    )
  })

  it('invokes glob.sync with correct options', () => {
    findFiles('some/path')

    expect(mockedGlob.sync).toHaveBeenCalledWith(expect.any(String), {
      cwd: mockedResolvedPath,
      absolute: true,
    })
  })
})

describe('isSchema()', () => {
  it('returns false for paths where the filename does not start with schema', () => {
    expect(isSchema('/dev/config/development.yaml')).toBe(false)
  })

  it('returns true for paths where the filename starts withs schema', () => {
    expect(isSchema('/dev/config/schema.json')).toBe(true)
  })
})

describe('findConfigFiles()', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('invokes glob.sync', () => {
    findConfigFiles('some/path')

    expect(mockedGlob.sync).toHaveBeenCalledTimes(1)
  })

  it('returns result of glob.sync but filters out files named schema', () => {
    expect(findConfigFiles('some/path')).toEqual([mockedFileNames[0]])
  })

  it('invokes glob.sync with correct default glob', () => {
    findConfigFiles('some/path')

    expect(mockedGlob.sync).toHaveBeenCalledWith(
      '**/*.json',
      expect.any(Object)
    )
  })

  it('builds glob correctly when fileName is passed', () => {
    findConfigFiles('some/path', 'schema')

    expect(mockedGlob.sync).toHaveBeenCalledWith(
      'schema.json',
      expect.any(Object)
    )
  })
})
