#!/usr/bin/env node

'use strict'

const rc = require('rc')('.nogit', { locale: 'de' })
const pkg = require('../package.json')
const i18n = require('i18n')
const path = require('path')
const program = require('commander')

i18n.configure({
  locales: [ 'en', 'de', 'fr' ],
  directory: path.resolve(__dirname, '..', 'locale'),
  defaultLocale: rc.locale,
  register: global
})

// binaries
const status = require('./status')
const clone  = require('./clone')
const add    = require('./add')
const log    = require('./log')

program
  .command('status')
  .description(__('status_description'))
  .action(status)

program
  .command('clone <repository> [cwd]')
  .description(__('clone_description'))
  .action(clone)

program
  .command('push')
  .description(__('push_description'))
  // .action(push)

program
  .command('pull')
  .description(__('pull_description'))
  // .action(pull)

program
  .command('log [cwd]')
  .description(__('log_description'))
  .action(log)

program
  .command('add <file>')
  .option('-A, --all', __('all_option'))
  .description(__('add_description'))
  .action(add)

program
  .version(pkg.version)
  .parse(process.argv)
