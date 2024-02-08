#!/usr/bin/env node

const NewmanRunner = require('./src/newman-parallel.js')
const args = process.argv.slice(2)
NewmanRunner.runCollections(args)
