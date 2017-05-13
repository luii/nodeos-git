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

    let cwd       = options.cwd || process.cwd()
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
  clone: async (url, dir, options) => {
    options = options || {}
    dir = dir || process.cwd()

    if (options.template) {
      ncp(options.template, dir, (err) => {
        if (err) return Promise.reject(new Error('Couldn\'t copy the template'))
        return console.log('Copied template')
      })
    }

    try {

      // emulating mirroring with cloning the remote manually
      if (options.mirror) {
        let repository = await Repository.init(dir, 1)
        let config     = await repository.config()
        let remote     = await Remote.createWithFetchspec(repository,
                                                          'origin',
                                                          url,
                                                          '+refs/*:refs/*')
        let err = await config.setString('remote.origin.mirror', 'true')
        
        if (! err) {
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
  config: async (options) => {
    let gitFolder = path.resolve(process.cwd(), GIT_FOLDER_NAME)
    let get = options.get

    try {
      let repository = await Repository.open(gitFolder)
      let config     = await repository.config()
      return await config.getStringBuf(get)
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
  log: async () => {
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
  revList: async (commit, options) => {
    let gitFolder = path.resolve(process.cwd(), GIT_FOLDER_NAME)

    try {
      let repository = await Repository.open(gitFolder)
      let commit     = null
      let count      = 0

      if (options.commit === 'master') {
        commit = await repository.getMasterCommit()
      } else if (options.commit === 'head') {
        commit = await repository.getHeadCommit()
      }

      let revwalk = Revwalk.create(repository)

      revwalk.walk(commit.id(), (err, commitRev) => {
        if (++count > options.maxCount) return
        if (err) return Promise.reject(new Error('Could not walk Revivsion'))
        if (commitRev) {
          return console.log(commitRev.id().tostrS());
        }
      })
    } catch (error) {
      return Promise.reject(error)
    }
  },

  /**
   * Gets the status of the Repository
   * @access public
   * @param  {String} workdir=cwd The workdir for the status
   * @param  {Object} options     The options of the function
   */
  status: async (workdir, options) => {
    let cwd = workdir || process.cwd()
    let gitFolder = path.resolve(cwd, GIT_FOLDER_NAME)

    try {
      let repository = await Repository.open(gitFolder)
      let statuses   = await repository.getStatus()

      let sorted = {
        new: [],
        modified: [],
        typechange: [],
        renamed: [],
        ignored: []
      }

      statuses.forEach(status => {
        if (status.isNew()) sorted.new.push(status)
        if (status.isModified()) sorted.modified.push(status)
        if (status.isTypechange()) sorted.typechange.push(status)
        if (status.isRenamed()) sorted.renamed.push(status)
        if (status.isIgnored()) sorted.ignored.push(status)
      })

      return Promise.resolve(sorted)
    } catch (error) {
      return Promise.reject(error)
    }
  }
}
