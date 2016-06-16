'use strict'

// Dependencies

const git = require('nodegit')
const path = require('path')

const Repository = git.Repository

/**
 * Clones a remote repository
 * @access public
 * @param  {String} repo The like to the remote repo
 * @return {}
 */
module.exports = file => {
  let gitFolder = path.join(process.cwd(), '/.git')
  let repo, index

  Repository.open(gitFolder).then(repository => {
    repo = repository
    return repo.refreshIndex()
  }).then(result => {
    index = result
    return index.addByPath(file)
  }).then(() => {
    return index.write()
  }).then(() => {
    console.log(`Added ${file}`);
    return index.writeTree()
  })
}
