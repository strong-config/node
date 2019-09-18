export const configFileMissingError = (filename: string): string =>
  `None of ${filename}.json|yaml|yml exist. One of these files should exist`

export const configFileDuplicatesError = (filename: string): string =>
  `More than one of ${filename}.json|yaml|yml exist. Only one of these files should exist`

export const flowTypeGenerationInvalidSchemaError = (): string =>
  'Invalid schema passed to generateFlowTypeFromJsonSchema()'
