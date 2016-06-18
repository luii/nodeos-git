'use strict'

// Dependencies

const git = require('nodegit')
const path = require('path')
const progress = require('progress')

const Oid = git.Oid
const Signature = git.Signature
const Reference = git.Reference
const Repository = git.Repository

/**
 * Clones a remote repository
 * @access public
 * @param  {String} repo The like to the remote repo
 * @return {}
 */
module.exports = (option) => {
  let gitFolder = path.join(process.cwd(), '/.git')
  let oid, repo, index

  Repository.open(gitFolder).then(repository => {
    repo = repository
    return repo.refreshIndex()
  }).then(index => {
    return index.writeTree()
  }).then(oidRes => {
    oid = oidRes
    return Reference.nameToId(repo, "HEAD");
  }).then(function(head) {
    return repo.getCommit(head);
  }).then(function(parent) {
    let author = Signature.now("Philipp Czarnetzki", "filli6@web.de")
    let committer = Signature.now("Philipp Czarnetzki", "filli6@web.de")
    let message = `${option.message}\r\n`

    if (option.desc) {
      let description = `${option.desc}\r\n`
      message = `${message}\r\n${description}`
    }

    return repo.createCommit("HEAD", author, committer, message, oid, [parent]);
  }).catch(console.log.bind(console))
}
