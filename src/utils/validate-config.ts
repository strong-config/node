import Ajv from 'ajv'

const ajv = new Ajv({ useDefaults: true })

export const validateConfig = (config: any, schema: any): true => {
  const validate = ajv.compile(schema)

  if (!validate(config)) {
    throw new Error(ajv.errorsText())
  }

  return true
}
