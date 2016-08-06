#!/usr/bin/env node

'use strict'

const rc = require('rc')('nogit')
const pkg = require('../package.json')
let cli = require('yargs')

cli.commandDir('add')
   .commandDir('checkout')
   .commandDir('clone')
   .commandDir('config')
   .commandDir('log')
   .commandDir('remote')
   .commandDir('rev-list')
   .commandDir('status')
   .help().argv
