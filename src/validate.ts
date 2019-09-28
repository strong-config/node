import R from 'ramda'

export const validate = (schema: Schema): true => {
  if (R.isNil(schema)) {
    throw new Error('Config does not match the specified schema')
  }

  return true
}
