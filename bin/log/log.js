'use strict'

const nogit = require('../../lib')

/**
 * The command format itself
 * @access public
 * @type   {String}
 */
exports.command = 'log'

/**
 * Description of the `remote` command
 * @access public
 * @type   {String}
 */
exports.desc = 'Logs all commits'

/**
 * Options of the command
 * @access public
 * @type   {Object}
 */
exports.builder = {}

/**
 * The actual command that gets executed
 * @access public
 * @type   {Function}
 * @param  {Object} argv The arguments
 * @return {Void}
 */
exports.handler = function (argv) {

  nogit.log().catch(console.log.bind(console))
}
