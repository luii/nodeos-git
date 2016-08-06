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
  },

  /**
   * Clones a remote repository
   * @param  {String} url       The url of the remote repository
   * @param  {String} [dir]     Optional: The destination dir of the cloned dir,
   *                            otherwise default is `process.cwd()`
   * @param  {Object} [options] The options object, it contains the command
   *                            options
   * @return {Promise}          Returns a promise for flow control
   */
  clone: (url, dir, options) => {
    options = options || {}
    let cwd = dir || process.cwd()
    let repository

    /**
     * Creates a fetch spec in the repository
     * @param  {String} url The remote repository url
     * @return {Promise}    Returns a array of promises
     */
    let createFetchSpec = (repo) => {
      repository = repo

      let remote = Remote.createWithFetchspec(repo, 'origin', url, '+refs/*:refs/*')
      return Promise.all([ repo.config(), remote ])
    }

    /**
     * Sets the mirror property
     * @param  {Array}  res A array containing the `config` and the `repo`
     * @return {Object}     Returns the repo
     */
    let setMirrorProperty = (res) => {
      return res[0].setString('remote.origin.mirror', 'true')
    }

    /**
     * Fetches the origin with the configured refspec
     * @param  {Object} repo The new initialized repository
     * @return {Promise}     Returns a promise
     */
    let fetchOrigin = () => {
      return repository.fetch('origin')
    }

    // if we have a template path just duplicate all contents
    if (options.template) {
      ncp(options.template, cwd, (err) => {
        if (err) return Promise.reject(new Error('Couldn\'t copy the template'))
        return console.log('Copied template')
      })
    }

    // because nodegit dont support mirroring yet, here is a workaround
    if (options.mirror) {

      // return a promise
      return Repository.init(cwd, 1)
        .then(createFetchSpec)
        .then(setMirrorProperty)
        .then(fetchOrigin)
        .then(() => repository)
    }

    // just clone the remote repository at the url into the dir
    return Clone(url, cwd, options)
  },

  /**
   * Manipulates the config of the repository or the global config
   * @param  {Object} options The options of the command
   * @return {Promise}        Returns a promise for flow control
   */
  config: (options) => {
    let gitFolder = path.resolve(process.cwd(), GIT_FOLDER_NAME)
    let get = argv.get

    /**
     * Gets the config of the repository
     * @access private
     * @param  {Object} repo The repository itself
     * @return {Promise}     Returns the config as a promise
     */
    let getConfig = (repo) => {
      return repo.config()
    }

    /**
     * Gets a value out of the repository config
     * @access private
     * @param  {Object} config The config of the repository
     * @return {Promise}       Returns a promise with the value
     */
    let getString = (config) => {
      return config.getString(options.get)
    }

    return Repository.open(gitFolder)
      .then(getConfig)
      .then(getString)
  },

  log: () => {
    let gitFolder = path.resolve(process.cwd(), GIT_FOLDER_NAME)

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
    })
  },

  revList: (commit, options) => {
    let gitFolder = path.resolve(process.cwd(), GIT_FOLDER_NAME)
    let repository, targetCommit, count = 0

    let getCommit = (repo) => {
      repository = repo

      if (options.commit === 'master') {
        return repository.getMasterCommit()
      } else {
        return repository.getHeadCommit()
      }
    }

    let createRevWalk = (commit) => {
      targetCommit = commit
      return Revwalk.create(repository)
    }

    let walkRevision = (rev) => {
      rev.walk(targetCommit.id(), (err, commitRev) => {
        if (++count > options.maxCount) return
        if (err) return Promise.reject(new Error('Could not walk Revivsion'))
        if (commitRev) {
          return console.log(commitRev.id().tostrS());
        }
      })
    }

    return Repository.open(gitFolder)
      .then(getCommit)
      .then(createRevWalk)
      .then(walkRevision)
  }
}
