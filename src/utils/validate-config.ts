import Ajv from 'ajv'

export const validateConfig = (config: any, schema: any): true => {
  const ajv = new Ajv({ useDefaults: true })

  if (!ajv.validate(schema, config)) {
    throw new Error(ajv.errorsText())
  }

  return true
}
