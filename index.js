#!/usr/bin/env node

const NewmanRunner = require('./src/newman-parallel.js')

  if (process.argv.length <= 2) {
    console.log("\x1b[31mPlease provide path to the collections and environment folders\nEx: './collections ./environments'\x1b[0m")
  } else {
    var args = process.argv.slice(2)
    NewmanRunner.runCollections(args)
  }
