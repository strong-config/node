/* eslint-disable @typescript-eslint/explicit-function-return-type */
import chalk from 'chalk'
import ora from 'ora'
import shell, { ExecCallback } from 'shelljs'

const run = (command: string, options = { silent: true }): Promise<string> => {
  return new Promise((resolve, reject) => {
    const callback: ExecCallback = (exitCode, stdout, stderr) =>
      exitCode !== 0 ? reject(stderr) : resolve(stdout.trim())

    shell.exec(command, options, callback)
  })
}

async function runLinters(): Promise<void> {
  const spinner = ora('Running linters...').start()

  try {
    await run('yarn lint')
    spinner.succeed(chalk.bold('Linters: 👍'))
  } catch (error) {
    spinner.fail(chalk.bold('Linters: 👎\n'))

    // Need to re-run this to show the user what the error was
    await run('yarn lint', { silent: false })
    throw new Error(error)
  }
}

async function runBuildForProduction(): Promise<void> {
  const spinner = ora('Building for production...').start()

  try {
    await run('CI=true yarn build')
    spinner.succeed(chalk.bold('Prod build: 👍'))
  } catch (error) {
    spinner.fail(chalk.bold('Prod build: 👎'))
    throw new Error(error)
  }
}

async function printTodos(): Promise<void> {
  const spinner = ora('️Searching for open TODOs and FIXMEs...').start()

  let todos

  try {
    todos = await run('yarn todo')
    spinner.info(`${chalk.bold('Todos:')}\n\n${todos}`)
  } catch (error) {
    spinner.fail(chalk.bold('Todos: 👎'))
    throw new Error(error)
  }
}

async function main(): Promise<void> {
  ora('Checking overall project health...').info()

  await runLinters()
  await runBuildForProduction()
  await printTodos()
}

main()
  .then(() => {
    console.log(`\n${chalk.bold('🙌 Project looks healthy 🙌')}\n`)

    return null
  })
  .catch(error => {
    console.error(
      `\n${chalk.bold('❌ Project not healthy ❌')}\n\n${chalk.red(error)}`
    )
    process.exit(1)
  })
