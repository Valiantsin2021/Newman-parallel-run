# Newman Parallel

Newman Parallel is an npm package that executes Postman collections in parallel, saving time by running them concurrently. It supports reading collections and environments from separate folders and provides flexibility through command-line arguments.

The package has integrated Newman, Allure (allure-results generated automatically), HTMLextra reporter, and Junit for CI.

HTMLextra and Junit reports will e generated in report folder. Allure report will be generated to allure-report folder after all the collections have ran.

For Allure report the command "npx allure generate --clean && npx allure-patch ./allure-report && rm -rf ./allure-report" will ran automatically after all the collections have ran. It will generate the Allure html report as a single page app to be sent via email, webhook or published as a static webpage.

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

- name: (Optional) Name of the collection/product to filter the collections.

- name: (Optional) Name of the environment to use.
  
- ALL: (Optional) to run all the collections from the forlder

### Environment variables

- the process logic will check the environment variables if there is no Name of the collection/product passed in arguments
- If environment variable equal to the name of the collection's filename is set to true, the framework will run the collection/s that match.
  
### Examples

Run all the collections that matching the MyCollection with no environment used:

```bash
newman-parallel /path/to/collections /path/to/environments C=MyCollection
```

Run collections for a specific name with a specific environment:

```bash
newman-parallel /path/to/collections /path/to/environments C=MyCollection E=MyEnvironment
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
If you want to generate allure report you have to have installed as devDependencies the allure-commandline and allure-patch

```bash
npm i -D allure-commandline allure-patch
```

 and after that you can use the command

```bash
newman-parallel /path/to/collections /path/to/environments ALL && npx allure generate --clean && npx allure-patch ./allure-report
# it will generate the allure html report as a single page app
```

### Contributing

Contributions are welcome! 
