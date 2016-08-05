#!/usr/bin/env node

'use strict'

// Dependencies
const nogit = require('../../lib')

/**
 * The command format itself
 * @access public
 * @type   {String}
 */
exports.command = 'checkout <branch>'

/**
 * Description of the `clone` command
 * @access public
 * @type   {String}
 */
exports.desc = 'Updates files in the working tree to match the version in the index or the specified tree.'

/**
 * Defines all options for this command or if necessary a nested command
 * @access public
 * @type   {Object|Function}
 */
exports.builder = {}

/**
 * The actual command that gets executed
 * @access public
 * @type   {Function}
 * @param  {Object} argv Contains the arguments that was passed
 * @return {Void}        Returns nothing
 */
exports.handler = (argv) => {

  nogit.checkout(argv.branch)
    .catch(() => console.log.bind(console))
    .done(branch => {
      console.log(`Checkout ${branch}`);
    })
}
