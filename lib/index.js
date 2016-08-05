'use strict'

// Dependencies

const ncp = require('ncp')
const path = require('path')
const chalk = require('chalk')
const nodegit = require('nodegit')

// Shorthands
const Oid = nodegit.Oid
const Clone = nodegit.Clone
const Branch = nodegit.Branch
const Remote = nodegit.Remote
const Revwalk = nodegit.Revwalk
const Checkout = nodegit.Checkout
const Signature = nodegit.Signature
const Reference = nodegit.Reference
const Repository = nodegit.Repository

// Colors
const RED_BOLD = chalk.red.bold
const GREY_BOLD = chalk.grey.bold
const GREEN_BOLD = chalk.green.bold
const YELLOW_BOLD = chalk.yellow.bold

// Constants
const GIT_FOLDER_NAME = '.git'

/**
 * Exports high level helper functions
 * @type {Object}
 */
module.exports = {

  /**
   * Adds files to staging
   * @access public
   * @type   {Function}
   * @param  {Array} files A array of file names
   * @return {[type]} [description]
   */
  add: (files, options) => {
    options = options || {}
    let cwd = options.cwd || process.cwd()
    let gitFolder = path.resolve(cwd, GIT_FOLDER_NAME)
    let repository, index

    // refresh the index of the repo
    let refreshIndex = (repo) => {
      repository = repo
      return repo.refreshIndex()
    }

    // add the files to the refreshed index
    let addFiles = (newIndex) => {
      index = newIndex
      let promises = []

      for (let file of files) {
        promises.push(index.addByPath(file))
      }
      return Promise.all(promises)
    }

    // write the new index
    let writeIndex = () => {
      return index.write()
    }

    // write the new tree
    let writeTree = () => {
      return index.writeTree()
    }

    return Repository.open(gitFolder)
      .then(refreshIndex)
      .then(addFiles)
      .then(writeIndex)
      .then(writeTree)
      .then(tree => files)
  },

  /**
   * Checksout the master, head or goes into detached mode
   * @param  {String} branch  The name of the branch or the commit hash
   * @param  {Object} options The options object
   * @return {[Promise]}      Returns a promise for flow control
   */
  checkout: (branch, options) => {
    options = options || {}
    let gitFolder = path.resolve(process.cwd(), GIT_FOLDER_NAME)

    // checkout the branch or detach the head to a specific commit
    let checkoutBranch = (repo) => {
      if (/master/.test(branch)) {
        return repo.checkoutBranch(branch)
      }

      let oid = Oid.fromString(branch)
      return repo.setHeadDetached(oid)
    }

    return Repository.open(gitFolder)
      .then(checkoutBranch)
      .then(() => branch)
  }
}
