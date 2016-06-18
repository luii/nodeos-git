#!/usr/bin/env node

'use strict'

const rc = require('rc')('.nogit', { locale: 'de' })
const pkg = require('../package.json')
const i18n = require('i18n')
const path = require('path')
const program = require('commander')

i18n.configure({
  locales: [ 'en', 'de' ],
  directory: path.resolve(__dirname, '..', 'locale'),
  defaultLocale: rc.locale,
  register: global
})

// binaries
const commit = require('./commit')
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
  .command('commit')
  .option('-S, --gpg-sign', __('gpg-sign_option'))
  .option('-m, --message <message>', __('message_option'))
  .option('-d, --description <description>', __('description_option'))
  .description(__('commit_description'))
  .action(commit)

program
  .version(pkg.version)
  .parse(process.argv)
