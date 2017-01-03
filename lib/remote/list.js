'use strict'
const util        = require('util')
const path        = require('path')
const nodegit     = require('nodegit')
const Remote      = nodegit.Remote
const Repository  = nodegit.Repository

module.exports = function (workdir, options) {
  let gitFolder = path.resolve(workdir, '.git')
  let repo

  return Repository.open(gitFolder)
    .then(repository => {
      repo = repository
      return Remote.list(repository)
    }).then(names => {
      if (! options.verbose) return Promise.resolve(names)

      return Promise.all(names.map(name => {
        return Remote.lookup(repo, name)
      }))
    })
}