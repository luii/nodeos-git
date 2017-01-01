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

/**
 * The default folder for git
 * @type    {String}
 * @default .git
 * @constant
 */
const GIT_FOLDER_NAME = '.git'

/**
 * Exports high level helper functions
 * @type {Object}
 */
module.exports = {

  /**
   * Initialize a repository
   * @access public
   * @type   {Function}
   * @param  {String} [path] Optional path where to init the repo
   * @return {Promise}       Returns a promise for flow control
   */
  init: (path) => {
    return Repository.init(path, 0)
  },

  /**
   * Adds files to staging
   * @access public
   * @type   {Function}
   * @param  {Array}          files A array of file names
   * @return {Promise<Oid>}         Returns a promise for flow control with
   *                                the Oid of the written tree
   */
  add: async (files, options) => {
    options = options || {}
    let cwd = options.cwd || process.cwd()

    let gitFolder = path.resolve(cwd, GIT_FOLDER_NAME)

    try {
      let repository = await Repository.open(gitFolder)
      let index      = await repository.refreshIndex()

      let result     = await Promise.all(files.map(file => index.addByPath(file)))
                       await index.write()
      let oid        = await index.writeTree()
    } catch (error) {
      return Promise.reject(error)
    }

    return await Promise.resolve(oid)
  },

  /**
   * Checkout the master, head or goes into detached mode
   * @access public
   * @type   {Function}
   * @param  {String}          branch  The name of the branch or the commit hash
   * @param  {Object}          options The options object
   * @return {Promise<String>}         Returns a promise for flow control with
   *                                   the name of the branch that
   *                                   was checkedout
   */
  checkout: (branch, options) => {
    options = options || {}
    let cwd = options.cwd || process.cwd()
    options.checkoutStrategy = options.checkoutStrategy || Checkout.STRATEGY.SAFE | Checkout.STRATEGY.RECREATE_MISSING

    let gitFolder = path.resolve(cwd, GIT_FOLDER_NAME)

    /**
     * Checkout the branch to master or to a commit
     * @access private
     * @param  {Repository}  repo The repository itself
     * @return {Void|Number}      If the branch is checked out to a commit
     *                            it returns 0 for success or an error code
     */
    let checkoutBranch = (repo) => {
      if (/master/.test(branch)) {
        return repo.checkoutBranch(branch)
      }

      let oid = Oid.fromString(branch)
      return repo.getCommit(oid)
      .then(function (commit) {
        return commit.getTree()
      }).then(function (tree) {
        return Checkout.tree(repo, tree, options)
      }).then(function () {
        return repo.setHeadDetached(oid)
      })
    }

    return Repository.open(gitFolder)
      .then(checkoutBranch)
      .then(() => branch)
  },

  /**
   * Clones a remote repository
   * @access public
   * @type   {Function}
   * @param  {String}               url      The url of the remote repository
   * @param  {String}               [dir]    Optional: The destination dir of
   *                                         the cloned dir, otherwise default
   *                                         is `process.cwd()`
   * @param  {Object}              [options] The options object,
   *                                         It contains the command options
   * @return {Promise<Repository>}           Returns a promise for flow control
   *                                         with the newly cloned repository
   */
  clone: (url, dir, options) => {
    options = options || {}
    dir = dir || process.cwd()
    let repository

    /**
     * Creates a fetch spec in the repository
     * @param  {String}                url The remote repository url
     * @return {Array<Config, Remote>}     Returns a array
     */
    let createFetchSpec = (repo) => {
      repository = repo

      let remote = Remote.createWithFetchspec(repo, 'origin', url, '+refs/*:refs/*')
      return Promise.all([ repo.config(), remote ])
    }

    /**
     * Sets the mirror property
     * @access private
     * @param  {Array}  res A array containing the `config` and the `repo`
     * @return {Number}     Returns `0` on success and any other for
     *                      an error code
     */
    let setMirrorProperty = (res) => {
      let [ config, remote ] = res

      return config.setString('remote.origin.mirror', 'true')
    }

    /**
     * Fetches the origin with the configured refspec
     * @access private
     * @param  {Object} repo The new initialized repository
     * @return {Void}        Returns `undefined`
     */
    let fetchOrigin = () => {
      return repository.fetch('origin')
    }

    // if we have a template path just duplicate all contents
    if (options.template) {
      ncp(options.template, dir, (err) => {
        console.log(dir);
        if (err) return Promise.reject(new Error('Couldn\'t copy the template'))
        return console.log('Copied template')
      })
    }

    // because nodegit dont support mirroring yet, here is a workaround
    if (options.mirror) {

      // return a promise
      return Repository.init(dir, 1)
        .then(createFetchSpec)
        .then(setMirrorProperty)
        .then(fetchOrigin)
        .then(() => repository)
    }

    // just clone the remote repository at the url into the dir
    return Clone(url, dir, options)
  },

  /**
   * Manipulates the config of the repository or the global config
   * @access public
   * @type   {Function}
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
     * @return {Config}      Returns the config of the repository
     */
    let getConfig = (repo) => {
      return repo.config()
    }

    /**
     * Gets a value out of the repository config
     * @access private
     * @param  {Object} config The config of the repository
     * @return {String}        Returns the config string
     */
    let getString = (config) => {
      return config.getString(options.get)
    }

    return Repository.open(gitFolder)
      .then(getConfig)
      .then(getString)
  },

  /**
   * Shows the log of the repository
   * @access public
   * @type   {Function}
   * @return {Void}
   */
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

  /**
   * Shows the revision list of the repository
   * @access public
   * @type   {Function}
   * @param  {String}   commit  The commit SHA hash
   * @param  {Object}   options The options for the rev list
   * @return {Void}             Returns `undefined` but logs the commit hash
   *                            to `process.stdout`
   */
  revList: (commit, options) => {
    let gitFolder = path.resolve(process.cwd(), GIT_FOLDER_NAME)
    let repository, targetCommit, count = 0

    /**
     * Gets the commit of the Repository
     * @access private
     * @param  {Repository} repo The repository itself
     * @return {Commit}          Returns a commit object based on the selection
     */
    let getCommit = (repo) => {
      repository = repo

      if (options.commit === 'master') {
        return repository.getMasterCommit()
      } else {
        return repository.getHeadCommit()
      }
    }

    /**
     * Creates a Revwalk object
     * @access private
     * @type   {Function}
     * @param  {Commit}   commit The commit to walk the revision from
     * @return {Revwalk}         Returns a Revwalk object to walk the revisions from
     *                           a given oid
     */
    let createRevWalk = (commit) => {
      targetCommit = commit
      return Revwalk.create(repository)
    }

    /**
     * Walk the history from the given oid.
     * @access private
     * @param  {Revwalk} rev The Revwalk object
     * @return {Void}        Returns `undefined` but logs the commit revisions
     *                       until the max count is reached
     */
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
  },

  /**
   * Gets the status of the Repository
   * @access public
   * @param  {String} workdir=cwd The workdir for the status
   * @param  {Object} options     The options of the function
   */
  status: (workdir, options) => {

    let cwd = workdir || process.cwd()
    let gitFolder = path.resolve(cwd, GIT_FOLDER_NAME)
    let repository

    /**
     * Gets the status array of the repository
     * @access private
     * @type   {Function}
     * @param  {Repository}        repo The repository itself
     * @return {Array<StatusFile>}      Returns an array of StatusFile's
     */
    let getStatus = (repo) => {
      repository = repo
      return repo.getStatus()
    }

    /**
     * Sorts the status array
     * @access private
     * @param  {Array<StatusFile>} statuses A array of statuses
     * @return {Array}                      Returns a array with StatusFile's
     *                                      sorted into `new`, `modified`,
     *                                      `typechange`, `renamed` and
     *                                      `ignored`
     */
    let sortStatus = (statuses) => {
      let sorted = { new: [],
                    modified: [],
                    typechange: [],
                    renamed: [],
                    ignored: [] }

      statuses.forEach(function(status) {
        if (status.isNew()) sorted.new.push(status)
        if (status.isModified()) sorted.modified.push(status)
        if (status.isTypechange()) sorted.typechange.push(status)
        if (status.isRenamed()) sorted.renamed.push(status)
        if (status.isIgnored()) sorted.ignored.push(status)
      })

      return sorted
    }

    return Repository.open(gitFolder)
      .then(getStatus)
      .then(sortStatus)
  }
}
