#!/usr/bin/env node
import * as fs from 'fs'
import * as path from 'path'
import chalk from 'chalk'
import ora from 'ora'
import { exec } from 'shelljs'

function run(command: string, options = { silent: true }): Promise<unknown> {
  return new Promise((resolve, reject): void => {
    exec(command, options, function (exitCode, stdout, stderr) {
      exitCode !== 0 ? reject(stderr) : resolve(stdout.trim())
    })
  })
}

async function runLinters(): Promise<void> {
  const spinner = ora('Running linters...').start()

  try {
    await run('yarn lint')
    spinner.succeed(chalk.bold('Linters'))
  } catch (error) {
    spinner.fail(chalk.bold('Linters'))

    // Need to re-run this to show the user what the error was
    await run('yarn lint', { silent: false })
    throw new Error(error)
  }
}

async function runUnitTests(): Promise<void> {
  const spinner = ora('Running unit tests...').start()

  try {
    await run('yarn test --coverage')
    spinner.succeed(chalk.bold('Tests'))
  } catch (error) {
    spinner.fail(chalk.bold('Tests'))
    throw new Error(error)
  }
}

async function runBuild(): Promise<void> {
  const spinner = ora().start()

  try {
    spinner.text = 'Cleaning previous build files...'
    await run('yarn build:clean')

    spinner.text = 'Building...'
    await run('yarn build')

    spinner.text = 'Checking generated TypeScript declarations...'

    if (!fs.existsSync(path.resolve('./lib/core/index.d.ts'))) {
      throw new Error(
        "Couldn't find TypeScript declaration files in build output.\nMake sure that `declaration: true` is set in `tsconfig.json`"
      )
    }

    spinner.text = 'Checking generated sourcemaps...'

    if (!fs.existsSync(path.resolve('./lib/core/index.d.ts.map'))) {
      throw new Error(
        "Couldn't find sourcemaps for TypeScript declaration files in build output.\nMake sure that `declarationMap: true` is set in `tsconfig.json`"
      )
    }

    spinner.text = 'Checking that tests are excluded from build output...'

    if (fs.existsSync(path.resolve('./lib/core/index.test.ts'))) {
      throw new Error(
        "Detected test files in build files. Make sure to exclude `src/**/*.test.ts` from the build output via TypeScript's `exclude` option"
      )
    }

    spinner.succeed(chalk.bold('Build'))
  } catch (error) {
    spinner.fail(chalk.bold('Build'))
    throw new Error(error)
  }
}

async function runIntegrationTests(): Promise<void> {
  const spinner = ora('Running Integration Tests...').start()

  try {
    spinner.text = 'Running Integration Tests: Core Library'
    await run('yarn test:core')

    spinner.text = 'Running Integration Tests: CLI'
    await run('yarn test:cli')

    spinner.succeed(chalk.bold('Integration Tests'))
  } catch (error) {
    spinner.fail(chalk.bold('Integration Tests'))
    throw new Error(error)
  }
}

async function runReleaseScripts(): Promise<void> {
  const spinner = ora('Running Release Scripts...').start()

  try {
    spinner.text = 'Running Release Scripts: yarn release --dry-run'
    await run('yarn release --dry-run')

    spinner.text = 'Running Release Scripts: yarn prepack'
    await run('yarn prepack')

    spinner.text =
      'Removing generated manifest again to not interfere with local development'
    await run('rimraf oclif.manifest.json')

    spinner.succeed(chalk.bold('Release Scripts'))
  } catch (error) {
    spinner.fail(chalk.bold('Release Scripts'))
    throw new Error(error)
  }
}

async function printTodos(): Promise<void> {
  const spinner = ora('️Searching for open TODOs and FIXMEs...').start()

  let todos

  try {
    todos = (await run('yarn report:todo')) as string
  } catch (error) {
    spinner.fail(chalk.bold('Todos'))
    throw new Error(error)
  }

  if (todos.match(/No todos\/fixmes found/g)) {
    spinner.succeed(chalk.bold('No TODOs or FIXMEs'))
  } else {
    spinner.info(`${chalk.bold('Todos:')}\n\n${todos}`)
  }
}

async function main(): Promise<void> {
  ora('Checking overall project health...\n').info()

  await runLinters()
  await runUnitTests()
  await runBuild()
  await runIntegrationTests()
  await runReleaseScripts()
  await printTodos()
}

main()
  .then(() => {
    console.log(`\n${chalk.bold('💪 Project looks healthy 💪')}\n`)

    return
  })
  .catch((error) => {
    console.error(
      `\n${chalk.bold('❌ Project not healthy ❌')}\n\n${chalk.red(error)}`
    )
    process.exit(1)
  })
