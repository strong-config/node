import ora, { Ora } from 'ora'

// This setup requires that any failSpinner/succeedSpinner is preceeded by a call to startSpinner
let oraInstance: Ora

export const startSpinner = (message: string): void => {
  oraInstance = ora(message).start()
}

export enum VerbosityLevel {
  Default = 0,
  Verbose = 1,
  Debug = 2,
}

export const failSpinner = (
  message: string,
  error: Error,
  verbosityLevel: VerbosityLevel = 0
): void => {
  oraInstance.fail(message)

  if (verbosityLevel === VerbosityLevel.Verbose) {
    console.error(error.message)
  }

  if (verbosityLevel === VerbosityLevel.Debug) {
    console.error(error.stack)
  }
}

export const succeedSpinner = (message: string): void => {
  oraInstance.stopAndPersist({ symbol: '💪 ', text: message })
}

export const getVerbosityLevel = (verboseFlag: boolean): VerbosityLevel => {
  return verboseFlag ? VerbosityLevel.Verbose : VerbosityLevel.Default
}
