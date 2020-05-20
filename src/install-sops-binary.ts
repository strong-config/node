import { startSpinner, succeedSpinner, failSpinner } from './cli/spinner'
import fetch from 'node-fetch'
import * as util from 'util'
import { chmodSync, copyFileSync, createWriteStream } from 'fs'
import * as os from 'os'
import { pipeline } from 'stream'

const streamPipeline = util.promisify(pipeline)

const REPO = 'mozilla/sops'
const VERSION = '3.5.0'
const BINARY = 'sops'

const getFileExtension = (): string => {
  const type = os.type()
  const arch = os.arch()

  console.log(`Detected OS ${type} [${arch}]`)

  switch (type) {
    case 'Darwin':
      return 'darwin'
    case 'Windows_NT':
      return 'exe'
    case 'Linux':
      return 'linux'
    default:
      console.error(`Unsupported OS: ${type} :: ${arch}`)
      process.exit(1)
  }
}

const downloadBinary = async (
  repo: string,
  binary: string,
  version: string
): Promise<string> => {
  const ext = getFileExtension()
  const url = `https://github.com/${repo}/releases/download/v${version}/${binary}-v${version}.${ext}`

  startSpinner(`Downloading '${binary}' binary from ${url}...`)

  try {
    const response = await fetch(url)
    if (!response.ok)
      throw new Error(
        `Binary download failed with unexpected response: ${response.statusText}`
      )

    const downloadPath = `./node_modules/.bin/${binary}`
    await streamPipeline(response.body, createWriteStream(downloadPath))

    succeedSpinner(`✅ Downloaded binary to ${downloadPath}`)

    return downloadPath
  } catch (error) {
    failSpinner('Failed to download binary', error)
    process.exit(1)
  }
}

const makeBinaryExecutable = (path: string): void => {
  startSpinner(`Making ${BINARY} binary executable...`)

  try {
    chmodSync(path, 0o755)
    succeedSpinner(`✅ ${BINARY} binary is executable`)
  } catch (error) {
    failSpinner('Failed to make binary executable', error)
  }
}

const copyFileToConsumingPackagesBinaryPath = (path: string): void => {
  try {
    startSpinner(
      `Copying ${BINARY} binary to consuming package's ./node_modules/.bin folder...`
    )
    if (process?.env?.INIT_CWD) {
      copyFileSync(path, `${process.env.INIT_CWD}/node_modules/.bin/${BINARY}`)
      succeedSpinner(`✅ Copied ${BINARY} binary to ${process.env.INIT_CWD}`)
    } else {
      throw new Error(
        'process.env.INIT_CWD is nil. This variable is usually available when running yarn or npm scripts 🤔.'
      )
    }
  } catch (error) {
    console.log(error)

    failSpinner(
      `Failed to copy ${BINARY} binary to ${process.env.INIT_CWD}`,
      error
    )
  }
}

async function main(): Promise<void> {
  const downloadPath = await downloadBinary(REPO, BINARY, VERSION)
  makeBinaryExecutable(downloadPath)
  copyFileToConsumingPackagesBinaryPath(downloadPath)
}

main()
