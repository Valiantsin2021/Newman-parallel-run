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
  static NEWMAN_REPORT_OPTIONS = ['cli', 'htmlextra', 'junitfull', '@felipecrs/allure']

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
      return files.map((file) => `${folderPath}/${file}`)
    } catch (err) {
      console.error(`Failed to read folder ${folderPath} with error: ${err.message}`)
      throw err
    }
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
    /**
     * The name of the collection or product to filter the coollections list.
     * @type {string}
     */
    let product = process.env.COLLECTION || args.filter((arg) => arg.includes('C='))[0]
    /**
     * The name of the environment to run with the coollections list.
     * @type {string}
     */
    let env = process.env.ENV || args.filter((arg) => arg.includes('E='))[0]

    let collections, environment
    // Check the ALL argument passed in CLI
    let runAll = args.filter((arg) => /ALL/.test(arg)).length > 0
    // Extract from args collection name to check
    if (!!product) {
      product = product.split('=')[1]
    }
    // Extract from args env name to check
    if (!!env) {
      env = env.split('=')[1]
    }
    product
      ? // If the collection name in args - filter collections with the name provided
        (collections = (await NewmanRunner.readFolder(args[0])).filter((collection) => {
          const collectionName = collection.split('/').pop().replace('.postman_collection.json', '')
          runAll = false
          return collectionName.includes(product)
        }))
      : // Else check the env variables with the collection name are true
        (collections = (await NewmanRunner.readFolder(args[0])).filter((collection) => {
          const collectionName = collection.split('/').pop().replace('.postman_collection.json', '')
          return process.env[collectionName] === 'True'
        }))

    // If ALL arg present - run all the collections from the folder
    if (collections.length === 0 && runAll) {
      collections = await NewmanRunner.readFolder(args[0])
    } else if (collections.length === 0) {
      console.log('\x1b[31mNo collections specified to run\x1b[0m')
      return
    }
    NewmanRunner.counter = collections.length
    env ? (environment = (await NewmanRunner.readFolder(args[1])).filter((el) => el.includes(env)).join('')) : (environment = null)

    const collectionToRun = collections.map((collection) => {
      const file_name = collection.split('/').at(-1).replace('.postman_collection.json', `_${env}`)
      return {
        collection: collection,
        environment: environment,
        insecure: true,
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

    /**
     * Runs Newman collections in parallel.
     *
     * @param {function} done - Callback function to signal completion.
     * @throws {Error} Throws an error if there is an issue during the collection run.
     */
    const parallelCollectionRun = function (done) {
      for (let index = 0; index < collectionToRun.length; index++) {
        newman
          .run(collectionToRun[index], function (err) {
            if (err) {
              throw err
            }
            console.log(`\x1b[34m==> ${collections[index]} is finished \u235f\x1b[0m`)
          })
          .on('done', () => {
            global = globalCache
            NewmanRunner.counter -= 1
            if (NewmanRunner.counter === 0) {
              console.log(`\x1b[34m==> Generating Allure report \u235f\x1b[0m`)
              const command = 'npx allure generate --clean && npx allure-patch ./allure-report && rm -r ./allure-results'
              exec(command)
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
  console.error("\x1b[31mPlease provide path to the collections and environments files\nEx: './collections' './environments'\x1b[0m")
  process.exit()
}
module.exports = NewmanRunner
