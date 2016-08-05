#!/usr/bin/env node

'use strict'

// Dependencies
const git = require('nodegit')
const path = require('path')

const Revwalk = git.Revwalk
const Repository = git.Repository


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
  let gitFolder = path.join(process.cwd(), '/.git')
  let headCommit = null
  let repo = null
  let count = 0

  Repository.open(gitFolder).then(repository => {
    repo = repository

    if (argv.commit === 'master') {
      return repository.getMasterCommit()
    } else if (/Head/i.test(argv.commit)) {
      return repository.getHeadCommit()
    }
  }).then(commit => {
    headCommit = commit

    return Revwalk.create(repo)
  }).then(rev => {
    rev.walk(headCommit.id(), (err, commitRev) => {
      if (count >= argv.maxCount) return
      if (commitRev) console.log(commitRev.id().tostrS());

      count++
      return
    })
  }).catch(console.log.bind(console))
}
