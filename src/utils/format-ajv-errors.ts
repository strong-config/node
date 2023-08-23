export const formatAjvErrors = (errorText: string): string =>
  '  - '.concat(errorText.replaceAll(/,\s/g, '\n  - ').replaceAll('data', 'config'))

export default formatAjvErrors
