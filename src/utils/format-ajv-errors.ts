export const formatAjvErrors = (errorText: string): string =>
  '  - '.concat(errorText.replace(/,\s/g, '\n  - ').replace(/data/g, 'config'))
