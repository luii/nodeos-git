#!/usr/bin/env node

'use strict'

// Dependencies
const nogit = require('../../lib')

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

  nogit.config(argv)
    .catch(console.log.bind(console))
    .done(val => console.log)
}
