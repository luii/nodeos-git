'use strict'

// Dependencies
const git = require('nodegit')
const path = require('path')
const chalk = require('chalk')

const bold = chalk.bold
const yellow = chalk.yellow
const Repository = git.Repository

/**
 * Clones a remote repository
 * @access public
 * @param  {String} repo The like to the remote repo
 * @return {}
 */
module.exports = cwd => {
  if (! cwd) {
    cwd = path.join(process.cwd(), '/.git')
  } else {
    cwd = path.join(cwd, '/.git')
  }

  Repository.open(cwd)
  .then(repo => {
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
  })
}
