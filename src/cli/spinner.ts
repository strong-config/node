import ora, { Ora } from 'ora'

// This setup requires that any failSpinner/succeedSpinner is preceeded by a call to startSpinner
let oraInstance: Ora

export const startSpinner = (message: string): void => {
  oraInstance = ora(message).start()
}

export const failSpinner = (
  message: string,
  error: Error,
  isVerbose: boolean
): void => {
  oraInstance.fail(message)

  if (isVerbose) {
    console.error(error)
  }
}

export const succeedSpinner = (message: string): void => {
  oraInstance.stopAndPersist({ symbol: '💪 ', text: message })
}
