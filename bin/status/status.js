#!/usr/bin/env node

'use strict'

// Dependencies
const git = require('nodegit')
const chalk = require('chalk')

const Revwalk = git.Revwalk
const Repository = git.Repository
const RED_BOLD = chalk.red.bold
const GREY_BOLD = chalk.grey.bold
const GREEN_BOLD = chalk.green.bold
const YELLOW_BOLD = chalk.yellow.bold

/**
 * The command format itself
 * @access public
 * @type   {String}
 */
exports.command = 'status <path>'

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
  let cwd = argv.path || process.cwd()
  let gitFolder = path.join(cwd, '/.git')
  let repo

  Repository.open(gitFolder).then(repository => {
    repo = repository
    return repo.getStatus()
  }).then(statuses => {
    function statusToText(status) {
      var words = []
      if (status.isNew()) { words.push(GREEN_BOLD("NEW")) }
      if (status.isModified()) { words.push(YELLOW_BOLD("MODIFIED")) }
      if (status.isTypechange()) { words.push(YELLOW_BOLD("TYPECHANGE")) }
      if (status.isRenamed()) { words.push(RED_BOLD("RENAMED")) }
      if (status.isIgnored()) { words.push(GREY_BOLD("IGNORED")) }

      return words.join(" ")
    }

    statuses.forEach(function(file) {
      console.log(`${statusToText(file)} ${file.path()}`)
    })
  })
}
