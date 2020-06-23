/*
 * EXPLAINER
 * This script contains logic to NOT run in the context of this repo, otherwise it would run everytime we 'yarn add' something in development.
 * In the context of other applications, installing the package via 'yarn add @strong-config/node' will run this script to install the sops binary.
 * Unless sops is already installed, then it will opt out and exit early with code 0.
 */

/* eslint-disable @typescript-eslint/no-var-requires */
const fetch = require('node-fetch')
const ora = require('ora')
const os = require('os')
const path = require('path')
const util = require('util')
const which = require('which')
const { pipeline } = require('stream')

// We're using the async implementations from 'fs-extra' for the spinner to work properly.
// When using the standard sync implementations (e.g. chmodSync) then the spinner freezes.
const { chmod, copyFile, createWriteStream, pathExists } = require('fs-extra')

const streamPipeline = util.promisify(pipeline)

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
  const ext = getFileExtension()
  const url = `https://github.com/${repo}/releases/download/v${version}/${binary}-v${version}.${ext}`
  const spinner = ora(`Downloading '${binary}' binary from ${url}...`).start()

  try {
    const response = await fetch(url)
    if (!response.ok)
      throw new Error(
        `Binary download failed with unexpected response: ${response.statusText}`
      )

    const downloadPath = `./node_modules/.bin/${
      ext === 'exe' ? binary + '.exe' : binary
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

const makeBinaryExecutable = async (path) => {
  const spinner = ora(`Making ${BINARY} binary executable...`).start()

  try {
    await chmod(path, 0o755)
    spinner.succeed(`✅ ${BINARY} binary is executable`)
  } catch (error) {
    spinner.fail('Failed to make binary executable')
    console.error(error)
  }
}

const copyFileToConsumingPackagesBinaryPath = async (srcPath) => {
  const destPath = `${process.env.INIT_CWD}/node_modules/.bin/${BINARY}`

  // This is the case when running 'postinstall' from the strong-config project itself
  if (path.resolve(srcPath) === path.resolve(destPath)) {
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
      await copyFile(srcPath, destPath)
      spinner.succeed(`✅ ${BINARY} binary to ${destPath}`)
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
