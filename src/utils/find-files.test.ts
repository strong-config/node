import glob from 'glob'
import { findConfigFilesAtPath, findFiles, isSchema } from './find-files'

const resolvedPathMock = '/dev'
jest.mock('path', () => ({
  resolve: jest.fn(() => resolvedPathMock),
}))

const fileNamesMock = ['/dev/config/development.yml', 'schema.json']
jest.mock('glob', () => ({
  sync: jest.fn(() => fileNamesMock),
}))

jest.mock('./read-file', () => ({
  getFileExtensionPattern: jest.fn(() => 'json'),
}))

describe('findFiles()', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('returns result of glob.sync', () => {
    expect(findFiles('some/path')).toEqual(fileNamesMock)
    expect(glob.sync).toHaveBeenCalledTimes(1)
  })

  it('invokes glob.sync with correct default glob', () => {
    findFiles('some/path')

    expect(glob.sync).toHaveBeenCalledWith('**/*.*', expect.any(Object))
  })

  it('appends file extensions to glob if globFileName arg does not end in .{json,yaml,yml)', () => {
    findFiles('some/path', 'schema', 'json')

    expect(glob.sync).toHaveBeenCalledWith('schema.json', expect.any(Object))
  })

  it('does NOT append file extensions to glob if globFileName arg ends in .{json,yaml,yml)', () => {
    findFiles('some/path', 'schema.json')

    expect(glob.sync).toHaveBeenCalledWith('schema.json', expect.any(Object))
  })

  it('invokes glob.sync with correct options', () => {
    findFiles('some/path')

    expect(glob.sync).toHaveBeenCalledWith(expect.any(String), {
      cwd: resolvedPathMock,
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

describe('findConfigFilesAtPath()', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('invokes glob.sync', () => {
    findConfigFilesAtPath('some/path')

    expect(glob.sync).toHaveBeenCalledTimes(1)
  })

  it('returns result of glob.sync but filters out files named schema', () => {
    expect(findConfigFilesAtPath('some/path')).toEqual([fileNamesMock[0]])
  })

  it('invokes glob.sync with correct default glob', () => {
    findConfigFilesAtPath('some/path')

    expect(glob.sync).toHaveBeenCalledWith(
      '**/*.{json,yaml,yml}',
      expect.any(Object)
    )
  })

  it('builds glob correctly when fileName is passed', () => {
    findConfigFilesAtPath('some/path', 'config')

    expect(glob.sync).toHaveBeenCalledWith(
      'config.{json,yaml,yml}',
      expect.any(Object)
    )
  })
})
