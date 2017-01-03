'use strict'

const path        = require('path')
const nodegit     = require('nodegit')
const Remote      = nodegit.Remote
const Repository  = nodegit.Repository

/**
 * Lists the remotes of the repository
 * @access   public
 * @param    {String}         workdir         The directory of the repository
 * @param    {Object}         options         The options for the list
 * @property {Boolean}        options.verbose The verbose flag
 * @return   {Array<Promise>}                 If the verbose flag is set it'll
 *                                            return a Array of Promises
 */
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