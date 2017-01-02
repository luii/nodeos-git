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
  checkout: async (branch, options) => {
    options = options || {}
    options.checkoutStrategy = options.checkoutStrategy || Checkout.STRATEGY.SAFE | Checkout.STRATEGY.RECREATE_MISSING
    let cwd = options.cwd || process.cwd()

    let gitFolder = path.resolve(cwd, GIT_FOLDER_NAME)

    try {
      let repository = await Repository.open(gitFolder)

      if (/master/.test(branch)) {
        await repository.checkoutBranch(branch, options)
        return Promise.resolve(branch)
      }

      let oid    = Oid.fromString(branch)
      let commit = await repository.getCommit(oid)
      let tree   = await commit.getTree()

      await Checkout.tree(repository, tree, options)
      await repository.setHeadDetached(oid)

      return Promise.resolve(oid)
    } catch (error) {
      return Promise.reject(error)
    }
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

    if (options.template) {
      ncp(options.template, dir, (err) => {
        console.log(dir);
        if (err) return Promise.reject(new Error('Couldn\'t copy the template'))
        return console.log('Copied template')
      })
    }

    try {

      // emulating mirroring with cloning the remote manually
      if (options.mirror) {
        let repository = await Repository.init(dir, 1)
        let config     = await repository.config()
        let remote     = await Remote.createFetchSpec(repository,
                                                      'origin',
                                                      url,
                                                      '+refs/*:refs/*')
        let success    = await config.setString('remote.origin.mirror', true)
        if (success === 1) {
          await repository.fetch('origin')
        } else {
          return Promise.reject(new Error(
            'Could not set \'remote.origin.mirror\''
          ))
        }

        return Promise.resolve(repository)
      }

      return await Clone(url, dir, options)
    } catch (error) {
      return Promise.reject(error)
    }
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

    try {
      let repository = await Repository.open(gitFolder)
      let config     = await repository.getConfig()
      return await config.getString(options.get)
    } catch (error) {
      return Promise.reject(error)
    }
  },

  /**
   * Shows the log of the repository
   * @access public
   * @type   {Function}
   * @return {Void}
   */
  log: () => {
    let gitFolder = path.resolve(process.cwd(), GIT_FOLDER_NAME)

    try {
      let repository   = await Repository.open(gitFolder)
      let masterCommit = await repository.getMasterCommit()

      let count   = 0
      let history = masterCommit.history()

      history.on('commit', commit => {
        if (++count >= 9) return
        let author = commit.author()

        console.log(`Commit:\t ${bold(commit.sha())}`)
        console.log(`Author:\t ${author.name()} <${author.email()}>`)
        console.log(`Date:\t ${commit.date()}`)
        console.log(`\n\t ${chalk.yellow(commit.message())}`)
      })

      history.start()
    } catch (error) {
      return Promise.reject(error)
    }
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
