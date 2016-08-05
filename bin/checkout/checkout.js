#!/usr/bin/env node

'use strict'

// Dependencies
const git = require('nodegit')
const path = require('path')

const Oid = git.Oid
const Branch = git.Branch
const Checkout = git.Checkout
const Repository = git.Repository

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
exports.handler = function (argv) {
  let gitFolder = path.join(process.cwd(), '/.git')
  let branch = argv.branch

  Repository.open(gitFolder).then(repo => {
    if (/[a-zA-Z0-9]|master|HEAD(![^0-9]+)?/.test(branch)) {
      return repo.checkoutBranch(branch)
    }

    let oid = Oid.fromString(branch)
    return repo.setHeadDetached(oid)
  }).then((names) => {
    console.log('Switched to:', branch);
  }).catch(console.log.bind(console))

  return
}
