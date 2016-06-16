'use strict'

// Dependencies

const fs = require('fs-promise');
const git = require('nodegit')
const path = require('path')
const chalk = require('chalk')
const Ignore = git.Ignore
const Repository = git.Repository

const RED_BOLD = chalk.red.bold
const GREY_BOLD = chalk.grey.bold
const GREEN_BOLD = chalk.green.bold
const YELLOW_BOLD = chalk.yellow.bold
/**
 * Clones a remote repository
 * @access public
 * @param  {String} repo The like to the remote repo
 * @return {}
 */
module.exports = () => {
  let gitFolder = path.join(process.cwd(), '/.git')
  let repo

  Repository.open(gitFolder).then(repository => {
    repo = repository
  }).then(result => {
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
