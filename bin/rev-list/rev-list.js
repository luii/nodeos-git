#!/usr/bin/env node

'use strict'

// Dependencies
const nogit = require('../../lib')


/**
 * The command format itself
 * @access public
 * @type   {String}
 */
exports.command = 'rev-list <commit>'

/**
 * Description of the `remote` command
 * @access public
 * @type   {String}
 */
exports.desc = 'List commits that are reachable by following the parent links from the given commit(s)'

/**
 *
 */
exports.builder = {
  n: {
    alias: 'max-count',
    describe: 'Limits the output of the commit ids',
    number: true
  }
}


exports.handler = function (argv) {
  nogit.revList(argv.commit, argv)
    .catch(console.log.bind(console))
}
