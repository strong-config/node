import chalk from 'chalk'
import ora from 'ora'
import sh from 'shelljs'

function run(command: string, options = { silent: true }): Promise<unknown> {
  return new Promise((resolve, reject): void => {
    sh.exec(command, options, function(exitCode, stdout, stderr) {
      exitCode !== 0 ? reject(stderr) : resolve(stdout.trim())
    })
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

async function runTests(): Promise<void> {
  const spinner = ora('Running tests...').start()

  try {
    await run('CI=true yarn test --coverage')
    spinner.succeed(chalk.bold('Tests: 👍'))
  } catch (error) {
    spinner.fail(chalk.bold('Tests: 👎'))
    throw new Error(error)
  }
}

async function runBuild(): Promise<void> {
  const spinner = ora('Building...').start()

  try {
    await run('CI=true yarn build')
    spinner.succeed(chalk.bold('Build: 👍'))
  } catch (error) {
    spinner.fail(chalk.bold('Build: 👎'))
    throw new Error(error)
  }
}

async function runDevScripts(): Promise<void> {
  const spinner = ora('Running dev scripts...').start()

  try {
    await run('yarn dev:load:es6')
    await run('yarn dev:load:commonjs')
    await run('yarn dev:validate')
    spinner.succeed(chalk.bold('Dev scripts: 👍'))
  } catch (error) {
    spinner.fail(chalk.bold('Dev scripts: 👎'))
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
  await runTests()
  await runBuild()
  await runDevScripts()
  await printTodos()
}

main()
  .then(() => {
    console.log(`\n${chalk.bold('🙌 Project looks healthy 🙌')}\n`)

    return
  })
  .catch(error => {
    console.error(
      `\n${chalk.bold('❌ Project not healthy ❌')}\n\n${chalk.red(error)}`
    )
    process.exit(1)
  })
