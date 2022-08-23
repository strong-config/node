/* eslint-disable unicorn/no-process-exit */
/*
 * EXPLAINER
 * This script contains logic to NOT run in the context of this repo, otherwise
 * it would run everytime we 'yarn add' something in development. In the context
 * of other applications, installing the package via 'yarn add @strong-config/node'
 * will run this script to install the sops binary. Unless sops is already installed,
 * then it will opt out and exit early with code 0.
 */

// eslint-disable-next-line no-restricted-imports
import fetch from 'node-fetch'
import ora from 'ora'
import os from 'os'
import path from 'path'
import { promisify } from 'util'
import which from 'which'
import { pipeline } from 'stream'

/*
 * We're using the async implementations from 'fs-extra' for the spinner to work properly.
 * When using the standard sync implementations (e.g. chmodSync) then the spinner freezes.
 */
import fsExtra from 'fs-extra'
const { chmod, copyFile, createWriteStream, pathExists } = fsExtra

const streamPipeline = promisify(pipeline)

const REPO = 'mozilla/sops'
const VERSION = '3.5.0'
const BINARY = 'sops'
const DEST_PATH = `${process.env.INIT_CWD}/node_modules/.bin/${BINARY}`

const checkSops = async () => {
  // If sops is available in the runtime environment already, skip downloading and exit early
  if (which.sync('sops', { nothrow: true }) || (await pathExists(DEST_PATH))) {
    process.exit(0)
  }
}

const getFileExtension = () => {
  const type = os.type()
  const arch = os.arch()

  console.log(`Detected OS '${type} [${arch}]'`)

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

const downloadBinary = async (repo, binary, version) => {
  const extension = getFileExtension()
  const url = `https://github.com/${repo}/releases/download/v${version}/${binary}-v${version}.${extension}`
  const spinner = ora(`Downloading '${binary}' binary from ${url}...`).start()

  try {
    const response = await fetch(url)

    if (!response.ok) {
      throw new Error(
        `Binary download failed with unexpected response: ${response.statusText}`
      )
    }

    const downloadPath = `./node_modules/.bin/${
      // eslint-disable-next-line @typescript-eslint/restrict-plus-operands
      extension === 'exe' ? binary + '.exe' : binary
    }`
    await streamPipeline(response.body, createWriteStream(downloadPath))

    spinner.succeed(`✅ Downloaded binary to ${downloadPath}`)

    return downloadPath
  } catch (error) {
    spinner.fail('Failed to download binary')
    console.error(error)
    process.exit(1)
  }
}

const makeBinaryExecutable = async (_path) => {
  const spinner = ora(`Making ${BINARY} binary executable...`).start()

  try {
    await chmod(_path, 0o755)
    spinner.succeed(`✅ ${BINARY} binary is executable`)
  } catch (error) {
    spinner.fail('Failed to make binary executable')
    console.error(error)
  }
}

const copyFileToConsumingPackagesBinaryPath = async (sourcePath) => {
  const destinationPath = `${process.env.INIT_CWD}/node_modules/.bin/${BINARY}`

  // This is the case when running 'postinstall' from the strong-config project itself
  if (path.resolve(sourcePath) === path.resolve(destinationPath)) {
    return
  }

  const spinner = ora(
    `Copying ${BINARY} binary to consuming package's ./node_modules/.bin folder...`
  ).start()

  try {
    if (!process.env.INIT_CWD) {
      spinner.fail(
        'process.env.INIT_CWD is nil. This variable is usually available when running yarn or npm scripts 🤔.'
      )
      process.exit(1)
    } else {
      await copyFile(sourcePath, destinationPath)
      spinner.succeed(`✅ ${BINARY} binary to ${destinationPath}`)

      return
    }
  } catch (error) {
    spinner.fail(`Failed to copy ${BINARY} binary to ${process.env.INIT_CWD}`)
    console.error(error)
    process.exit(1)
  }
}

async function main() {
  await checkSops()
  const downloadPath = await downloadBinary(REPO, BINARY, VERSION)
  await makeBinaryExecutable(downloadPath)
  await copyFileToConsumingPackagesBinaryPath(downloadPath)
}

main()
