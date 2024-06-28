const async = require('async')
const newman = require('newman')
const fs = require('fs').promises
const path = require('path')
const { exec } = require('child_process')
const globalCache = global
/**
 * Class representing a Newman Runner.
 */
class NewmanRunner {
  /**
   * The counter to check the remaining collections to run.
   * @type {number}
   * @static
   */
  static counter
  /**
   * The path to the Allure results directory.
   * @type {string}
   * @static
   */
  static ALLURE_REPORT_PATH = `./allure-results`

  /**
   * The path to the Newman reports directory.
   * @type {string}
   * @static
   */
  static NEWMAN_REPORT_PATH = './report/'

  /**
   * Options for Newman reporters.
   * @type {string[]}
   * @static
   */
  static NEWMAN_REPORT_OPTIONS = [
    'cli',
    'htmlextra',
    'junitfull',
    '@felipecrs/allure'
  ]

  /**
   * Reads files from a specified folder.
   * @param {string} folderPath - The path to the folder.
   * @returns {Promise<string[]>} A promise that resolves with an array of file paths.
   * @throws {Error} Throws an error if there is an issue reading the folder.
   * @static
   * @async
   */
  static async readFolder(folderPath) {
    try {
      const files = await fs.readdir(path.resolve(folderPath))
      return files.map(file => `${folderPath}/${file}`)
    } catch (err) {
      console.error(
        `Failed to read folder ${folderPath} with error: ${err.message}`
      )
      throw err
    }
  }
  /**
   * Parses arguments to extract collection and environment names.
   * @param {string[]} args - Command line arguments.
   * @returns {{product: string|undefined, env: string|undefined, data: string|undefined, runAll:boolean}} - Collection and environment names.
   */
  static parseArgs(args) {
    // Extract collection and environment names from arguments
    let product = args.filter(arg => arg.includes('C='))[0] ?? ''
    let envName = args.filter(arg => arg.includes('E='))[0] ?? ''
    let data = args.filter(arg => arg.includes('D='))[0] ?? ''

    // Check the ALL argument passed in CLI
    let runAll = args.filter(arg => /ALL/.test(arg)).length > 0
    // If collection name is provided in arguments, extract it
    if (product && product.includes('=')) {
      product = product.split('=')[1] ?? product
    }
    if (product.includes(',')) {
      product = product.split(',')
    }
    // If data folder is provided in argument - extract it
    if (data && data.includes('=')) {
      data = data.split('=')[1]
    }
    // If environment name is provided in arguments, extract it
    if (envName?.includes('=')) {
      envName = envName.split('=')[1]
    } else {
      envName = process.env.ENV || ''
    }
    return { product: product, env: envName, data: data, runAll: runAll }
  }
  /**
   * @param {string} folderpath pathfolders from CLI arguments
   * @param {string|undefined} env name of the environment parsed from the CLI arguments
   * @returns {Promise<string>} environment file path
   */
  static async getEnvironment(folderpath, env) {
    let environment
    env
      ? (environment = (await NewmanRunner.readFolder(folderpath))
          .filter(el => el.includes(env))
          .join(''))
      : (environment = undefined)
    // @ts-ignore
    return environment
  }
  /**
   * Runs Newman collections asynchronously in parallel.
   * @param {string[]} args - The command-line arguments
   * 1. path to collections,
   * 2. path to environments,
   * 3. name of the collection,
   * 4. name of the environment.
   * @param {number} PARALLEL_RUN_COUNT - The number of parallel runs.
   * @returns {Promise<void>} A promise that resolves when the collections are run.
   * @static
   * @async
   * @example
   * <node command> <path to collections> <path to envs> <name of the collection> <name of the env>
   */
  static async runCollections(args, PARALLEL_RUN_COUNT = 1) {
    let { product, env, data, runAll } = NewmanRunner.parseArgs(args)
    const environment = await NewmanRunner.getEnvironment(args[1], env)
    /**
     * Filters collections based on provided criteria.
     * @param {string} folderPath - Path of the folder containing collections.
     * @param {string|null} product - Name of the collection to filter (optional).
     * @returns {Promise<string[]>} - Filtered list of collections.
     */
    async function filterCollections(folderPath, product) {
      let collections = await NewmanRunner.readFolder(folderPath)
      collections = collections.filter(collection => {
        // @ts-ignore
        const collectionName = collection
          .split('/')
          .pop()
          .replace('.postman_collection.json', '')
        if (typeof product === 'string') {
          runAll = false
          return collectionName.includes(product)
        } else if (Array.isArray(product)) {
          runAll = false
          return product.includes(collectionName)
        } else {
          return process.env[collectionName] === 'True'
        }
      })
      return collections
    }

    let collections
    if (product) {
      collections = await filterCollections(args[0], product)
    } else {
      collections = await filterCollections(args[0], null)
    }

    // If ALL arg present - run all the collections from the folder
    if (collections.length === 0 && runAll) {
      collections = await NewmanRunner.readFolder(args[0])
    } else if (collections.length === 0) {
      console.log(
        '\x1b[31mNo collections specified to run\nProvide CLI args: "C=<collection name>" or "ALL" and optionally "E=<environment name>"\x1b[0m'
      )
      return
    }
    let collectionsToRun
    try {
      collectionsToRun = collections.map(collection => {
        // @ts-ignore
        const file_name = collection
          .split('/')
          .at(-1)
          .replace('.postman_collection.json', `_${env}`)
        return {
          collection: collection,
          environment: environment,
          insecure: true,
          iterationData: data,
          reporters: NewmanRunner.NEWMAN_REPORT_OPTIONS,
          reporter: {
            htmlextra: {
              export: `${NewmanRunner.NEWMAN_REPORT_PATH}${file_name}.html`
            },
            junitfull: {
              export: `${NewmanRunner.NEWMAN_REPORT_PATH}${file_name}.xml`
            },
            '@felipecrs/allure': {
              collectionAsParentSuite: true,
              export: NewmanRunner.ALLURE_REPORT_PATH
            }
          }
        }
      })
      NewmanRunner.counter = collectionsToRun.length
    } catch (err) {
      console.error(`Error parsing collection names from folder ${args[0]}`)
      console.log(`Files in folder: ${collections}`)
      process.exit()
    }

    /**
     * Runs Newman collections in parallel.
     *
     * @param {function} done - Callback function to signal completion.
     * @throws {Error} Throws an error if there is an issue during the collection run.
     */
    const parallelCollectionRun = function (done) {
      for (let index = 0; index < collectionsToRun.length; index++) {
        newman
          .run(collectionsToRun[index], function (err) {
            if (err) {
              throw err
            }
            console.log(
              `\x1b[34m==> ${collections[index]} is finished \u235f\x1b[0m`
            )
          })
          .on('done', () => {
            global = globalCache
            NewmanRunner.counter -= 1
            if (NewmanRunner.counter === 0) {
              console.log(`\x1b[34m==> Generating Allure report \u235f\x1b[0m`)
              const createHistory =
                'cp -r allure-report/history allure-results || echo "no history folder found"'
              const generateReport =
                'npx allure generate --clean && npx allure-patch ./allure-report && rm -r ./allure-results'
              exec(createHistory, (error, stdout, stderr) => {
                console.log(stdout)
                console.error(stderr)
                if (error) {
                  console.error(error)
                }
              })
              exec(generateReport, (error, stdout, stderr) => {
                console.log(stdout)
                console.error(stderr)
                if (error) {
                  console.error(error)
                }
              })
            }
          })
      }
      done()
    }

    let commands = []
    for (let index = 0; index < PARALLEL_RUN_COUNT; index++) {
      commands.push(parallelCollectionRun)
    }

    try {
      await async.parallel(commands)
    } catch (err) {
      console.error(err)
    }
  }
}

const args = process.argv.slice(2)
if (args.length < 2) {
  console.error(
    "\x1b[31mPlease provide path to the collections and environments files\nEx: './collections' './environments'\x1b[0m"
  )
  process.exit()
}
module.exports = NewmanRunner
