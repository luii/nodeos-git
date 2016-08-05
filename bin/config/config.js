#!/usr/bin/env node

'use strict'

// Dependencies
const git = require('nodegit')
const path = require('path')

const Repository = git.Repository

/**
 * The command format itself
 * @access public
 * @type   {String}
 */
exports.command = 'config'

/**
 * Description of the `config` command
 * @access public
 * @type   {String}
 */
exports.desc = 'Updates files in the working tree to match the version in the index or the specified tree.'

/**
 * Defines all options for this command or if necessary a nested command
 * @access public
 * @type   {Object|Function}
 */
exports.builder = {
  get: {
    describe: 'Returns a value',
    string: true
  }
}

/**
 * The actual command that gets executed
 * @access public
 * @type   {Function}
 * @param  {Object} argv Contains the arguments that was passed
 * @return {Void}        Returns nothing
 */
exports.handler = function (argv) {
  let gitFolder = path.join(process.cwd(), '/.git')
  let get = argv.get

  Repository.open(gitFolder).then(repo => {
    return repo.config();
  }).then(config => {
    return config.getString(get);
  }).then(value => {
    console.log(value);
  }).catch(console.log.bind(console))
  return
}
