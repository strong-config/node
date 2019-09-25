import fs from 'fs'
import glob from 'glob'
import yaml from 'js-yaml'
import R from 'ramda'

enum FileExtension {
  JSON = 'json',
  YAML = 'yaml',
  YML = 'yml',
}
type File = {
  contents: {
    properties: {
      runtimeEnvironment: string
    }
    required: string[]
    sops: Record<string, any>
  }
  filePath: string
}

class NoFileError extends Error {
  constructor(message: string) {
    super(message)
    Object.setPrototypeOf(this, NoFileError.prototype)
  }
}

const getFileExtensionPattern = (): string =>
  `{${Object.values(FileExtension).join(',')}}`

const findConfigFiles = (
  basePath: string,
  filenameWithoutExtension: string
): string[] => {
  const globPattern = `${basePath}/${filenameWithoutExtension}.${getFileExtensionPattern()}`

  return glob.sync(globPattern, {})
}

const getFileExtensionFromPath = R.compose<
  string,
  string,
  string[],
  string,
  FileExtension
>(
  ext => FileExtension[ext.toUpperCase() as keyof typeof FileExtension],
  R.last,
  R.split('.'),
  R.head
)

const parseConfig = (configFile: string): File => {
  const fileExtension = getFileExtensionFromPath(configFile)
  const fileContent = fs.readFileSync(configFile).toString()

  return {
    contents:
      fileExtension === FileExtension.JSON
        ? JSON.parse(fileContent)
        : yaml.load(fileContent),
    filePath: configFile,
  }
}

export const readConfigFile = (filename: string | undefined): File => {
  if (R.isNil(filename)) {
    throw new Error('Config file name must not be nil')
  }

  const path = `${process.cwd()}/config`
  const files = findConfigFiles(path, filename)

  if (!R.is(Array, files) || R.isEmpty(files)) {
    throw new NoFileError(
      `None of ${filename}.${getFileExtensionPattern()} found. One of these files must exist.`
    )
  } else if (files.length > 1) {
    throw new Error(
      `More than one of ${filename}.${getFileExtensionPattern()} found. Exactly one must exist.`
    )
  }

  return parseConfig(files[0])
}

export const readSchemaFile = (filename = 'schema'): File | undefined => {
  let schema

  try {
    schema = readConfigFile(filename)
  } catch (error) {
    // Support no schemas
    if (error instanceof NoFileError) {
      return undefined
    }

    throw error
  }

  return schema
}
