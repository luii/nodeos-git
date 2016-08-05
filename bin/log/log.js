'use strict'

const git = require('nodegit')
const path = require('path')
const chalk = require('chalk')

const bold = chalk.bold
const yellow = chalk.yellow
const Repository = git.Repository

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
  let gitFolder = path.join(process.cwd(), '/.git')

  Repository.open(gitFolder).then(repo => {
    return repo.getMasterCommit()
  }).then(masterCommit => {
    let count = 0
    let history = masterCommit.history()

    history.on("commit", commit => {
      if (++count >= 9) return
      let author = commit.author()

      console.log(`Commit:\t ${bold(commit.sha())}`)
      console.log(`Author:\t ${author.name()} <${author.email()}>`)
      console.log(`Date:\t ${commit.date()}`)
      console.log(`\n\t ${chalk.yellow(commit.message())}`)
    })

    history.start()
  }).catch(console.log.bind(console))
}
