#!/usr/bin/env node

'use strict'

// Dependencies

const git = require('../../lib')

/**
 * The command format itself
 * @access public
 * @type   {String}
 */
exports.command = 'clone <repository> [directory]'

/**
 * Description of the `clone` command
 * @access public
 * @type   {String}
 */
exports.desc = 'Clones a repository into a newly created directory'

/**
 * Options of the command
 */
exports.builder = {
  template: {
    describe: 'Specify the directory from which templates will be used',
    string: true
  },
  bare: {
    describe: 'Make a bare Git repository.',
    boolean: true
  },
  mirror: {
    describe: 'Set up a mirror of the source repository.',
    boolean: true
  }
}

/**
 * The clone command action
 * @param  {Object} argv A object containing the arguments
 * @return {Void}        Returns nothing to end the function
 */
exports.handler = function (argv) {

  git.clone(argv.repository, argv.directory, argv)
    .catch(console.log.bind(console))
    .then((repository) => {
      console.log('Cloned repository to', argv.directory);
    })
}
