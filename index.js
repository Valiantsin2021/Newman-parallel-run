#!/usr/bin/env node

const NewmanRunner = require('./src/newman-parallel.js')
const args = process.argv.slice(2)
function showHelp() {
  console.log(`
Usage: npx jtocsv [options]

Options:
-h, --help      Show help message
path: (Required) Path to the folder containing Postman collections.

path: (Required) Path to the folder containing Postman environments.

C=(name): (Required if no ALL arg provided or no env variables set) Name of the collection/product to filter the collections.

E=(name): (Optional) Name of the environment to use.

R=(name): (Optional) pass false if you do not need the reports to be generated.

D=(path): (Optional) Path to the data file.

ALL: (Required if no C=<name> argument provided or no env variables set) to run all the collections from the forlder

### Examples

Run all the collections that matching the MyCollection with no environment used:

newman-parallel /path/to/collections /path/to/environments C=MyCollection

Run collections for a specific name with a specific environment and/or data file:

# this will run collection that have MyCollection name using Bash/GitBash

newman-parallel /path/to/collections /path/to/environments C=MyCollection E=MyEnvironment

# this will run collection that have MyCollection and MyCollection2 name using Bash/GitBash

newman-parallel /path/to/collections /path/to/environments C=MyCollection,MyCollection2 E=MyEnvironment

# this will run collection that have MyCollection and MyCollection2 with MyEnvironment and using the datafile name using Bash/GitBash

newman-parallel /path/to/collections /path/to/environments C=MyCollection,MyCollection2 E=MyEnvironment D=< relative path to data file >

Run collections with a specific environment file(or without) depending on the environment variables specified:

# this will run collections that have XXX and YYY names using Bash/GitBash

export XXX=True
export YYY=True
newman-parallel /path/to/collections /path/to/environments E=MyEnvironment

# or without the environment flag passed in arguments

newman-parallel /path/to/collections /path/to/environments

Run all the collections with a ALL argument passed (with or without environment):

# this will run all collections without environment file

newman-parallel /path/to/collections /path/to/environments ALL

# this will run all collections with specified environment file

newman-parallel /path/to/collections /path/to/environments ALL E=MyEnvironment

### Notes

If no collection/product name and ALL arg provided, the script runs all collections in the specified folder.

If no environment name is provided, the script does not use any environment.

If no R=false arg provided the reports will be generated automatically.
`)
}
function handleArgs() {
  if (args.includes('-h') || args.includes('--help')) {
    showHelp()
    process.exit(0)
  }

  console.log('No arguments provided. Try -h or --help for usage information.')
}

handleArgs()
if (args.length < 2) {
  console.error(
    "\x1b[31mPlease provide path to the collections and environments files\nEx: './collections' './environments'\x1b[0m"
  )
  process.exit()
}
NewmanRunner.runCollections(args)
