#!/usr/bin/env node

'use strict'

const rc = require('rc')('nogit')
const pkg = require('../package.json')
const path = require('path')
let cli = require('yargs')

cli.commandDir('remote')
   .commandDir('rev-list')
   .commandDir('log')
   .commandDir('clone')
   .commandDir('checkout')
   .commandDir('config')
   .help().argv

// program
//   .version(pkg.version)
//   .command('remote', __('remote.description'))
//   .command('status', __('status.description'), { isDefault: true })
//   .command('clone <repository> [cwd]', __('clone.description'))
//   .command('push', __('push.description'))
//   .command('pull', __('pull.description'))
//   .command('log [cwd]', __('log.description'))
//   .command('add <file>', __('add.description'))
//   .command('commit', __('commit.description'))
//   .command('rev-list', __('rev-list.description'))
//   .parse(process.argv)
