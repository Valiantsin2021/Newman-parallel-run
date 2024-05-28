# Newman Parallel

[![CI](https://github.com/Valiantsin2021/Newman-parallel-run/actions/workflows/ci.yml/badge.svg)](https://github.com/Valiantsin2021/Newman-parallel-run/actions/workflows/ci.yml)

Newman Parallel is an npm package that executes Postman collections in parallel, saving time by running them concurrently. It supports reading collections and environments from separate folders and provides flexibility through command-line arguments.

The package has integrated Newman, Allure (allure-results generated automatically), HTMLextra reporter, and Junit for CI.

HTMLextra and Junit reports will e generated in report folder. Allure report will be generated to allure-report folder after all the collections have ran.

For Allure report the command "npx allure generate --clean && npx allure-patch ./allure-report && rm -rf ./allure-report" will run automatically after all the collections run finished. It will generate the Allure html report, patch it as a single page app to be sent via email, webhook or published as a static webpage.

#### Allure report with history will be generated only if you use GitBash/Bash. If you run the tests with Powershell - the history will not be generated automatically.

## Installation

```bash
npm install -g newman-parallel
```

### Usage

```bash
newman-parallel [options]
```

### Command-Line Options

#### 

- path: (Required) Path to the folder containing Postman collections.

- path: (Required) Path to the folder containing Postman environments.

- C=(name): (Required if no ALL arg provided or no env variables set) Name of the collection/product to filter the collections.

- E=(name): (Optional) Name of the environment to use.
  
- ALL: (Required if no C=<name> argument provided or no env variables set) to run all the collections from the forlder

### Environment variables

- the process logic will check the environment variables if there is no Name of the collection/product passed in arguments
- If environment variable equal to the name of the collection's filename is set to true, the framework will run the collection/s that match.
- If the environment variable ENV is set to name of the enfironment file, the framework will use this environment file (in such case you do not need to pass arg E=<name>, otherwise it will have priority over the ENV var)
  
### Examples

Run all the collections that matching the MyCollection with no environment used:

```bash
newman-parallel /path/to/collections /path/to/environments C=MyCollection
```

Run collections for a specific name with a specific environment:

```bash
# this will run collection that have MyCollection name using Bash/GitBash

newman-parallel /path/to/collections /path/to/environments C=MyCollection E=MyEnvironment

# this will run collection that have MyCollection and MyCollection2 name using Bash/GitBash

newman-parallel /path/to/collections /path/to/environments C=MyCollection,MyCollection2 E=MyEnvironment
```

Run collections with a specific environment file(or without) depending on the environment variables specified:

```bash
# this will run collections that have XXX and YYY names using Bash/GitBash

export XXX=True
export YYY=True
newman-parallel /path/to/collections /path/to/environments E=MyEnvironment

# or without the environment flag passed in arguments
newman-parallel /path/to/collections /path/to/environments
```

Run all the collections with a ALL argument passed (with or without environment):

```bash
# this will run all collections without environment file
newman-parallel /path/to/collections /path/to/environments ALL
# this will run all collections with specified environment file
newman-parallel /path/to/collections /path/to/environments ALL E=MyEnvironment

```
### Notes

If no collection/product name and ALL arg provided, the script runs all collections in the specified folder.

If no environment name is provided, the script does not use any environment.


### Contributing

Contributions are welcome! 
