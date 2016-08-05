#!/usr/bin/env node

'use strict'

// Dependencies
const nogit = require('../../lib')

/**
 * The command format itself
 * @access public
 * @type   {String}
 */
exports.command = 'add <files...>'

/**
 * Description of the `add` command
 * @access public
 * @type   {String}
 */
exports.desc = 'Add file contents to the index'

/**
 * Options of the command
 */
exports.builder = {

}
/**
 * The clone command action
 * @param  {Object} argv A object containing the arguments
 * @return {Void}        Returns nothing to end the function
 */
exports.handler = function (argv) {
  nogit.add(argv.files)
       .catch(() => console.log.bind(console))
       .done(files => {
         console.log(`Added ${files.join(' ')}`);
       })
}
