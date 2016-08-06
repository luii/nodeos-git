#!/usr/bin/env node

'use strict'

// Dependencies
const nogit = require('../../lib')

/**
 * The command format itself
 * @access public
 * @type   {String}
 */
exports.command = 'status [path]'

/**
 * Description of the `remote` command
 * @access public
 * @type   {String}
 */
exports.desc = 'Displays paths that have differences between the index file and the current HEAD commit'

/**
 * Options of the command
 * @access public
 * @type   {Object}
 */
exports.builder = {}


exports.handler = (argv) => {

  nogit.status(argv.path, argv).catch(console.log.bind(console))
}
