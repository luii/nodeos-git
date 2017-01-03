'use strict'

// Dependencies
const ncp = require('ncp')
const path = require('path')
const chalk = require('chalk')
const nodegit = require('nodegit')

const _remotesNs = require('./remote')

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
 * Init Flags bitfield
 * @access   public
 * @type     {Object}
 * @constant
 * @property {Number} INIT_FLAGS.BARE              This bit creates a bare
 *                                                 repository
 * @property {Number} INIT_FLAGS.NO_REINIT         This bit locks down the
 *                                                 reinit
 * @property {Number} INIT_FLAGS.NO_DOTGIT_DIR     This bit dont creates a
 *                                                 `.git` dir
 * @property {Number} INIT_FLAGS.MKDIR             MKDIR means just the .git
 *                                                 directory and its parent and
 *                                                 the workdir
 * @property {Number} INIT_FLAGS.MKPATH            MKPATH setup means anything
 *                                                 we need
 * @property {Number} INIT_FLAGS.EXTERNAL_TEMPLATE Must be set, or
 *                                                 `templatePath` in initExt
 *                                                 will be ignored
 * @property {Number} INIT_FLAGS.RELATIVE_GITLINK  Create the `.git` gitlink
 *                                                 if appropriate
 */
const INIT_FLAGS = {
  BARE: 1,
  NO_REINIT: 2,
  NO_DOTGIT_DIR: 4,
  MKDIR: 8,
  MKPATH: 16,
  EXTERNAL_TEMPLATE: 32,
  RELATIVE_GITLINK: 64
}

/**
 * Init mode bitfield
 * @access public
 * @type   {Object}
 * @constant
 * @property {Number} INIT_MODE.INIT_SHARED_UMASK=0    shared dir umask?
 * @property {Number} INIT_MODE.INIT_SHARED_GROUP=1533 shared dir group?
 * @property {Number} INIT_MODE.INIT_SHARED_ALL=1535   shared dir with all?
 */
const INIT_MODE = {
  INIT_SHARED_UMASK: 0,
  INIT_SHARED_GROUP: 1533,
  INIT_SHARED_ALL: 1535
}

/**
 * Open Extended flag bitfield
 * @access   public
 * @type     {Object}
 * @constant
 * @property {Number} OPEN_FLAG.OPEN_NO_SEARCH Open repository in given
 *                                             directory (or fail if not a
 *                                             repository)
 * @property {Number} OPEN_FLAG.OPEN_CROSS_FS  Open repository with "ceiling"
 *                                             directories list to limit
 *                                             walking up
 * @property {Number} OPEN_FLAG.OPEN_BARE      A fast way of opening a bare
 *                                             repository when the exact path
 *                                             is known
 */
const OPEN_FLAG = {
  OPEN_NO_SEARCH: 1,
  OPEN_CROSS_FS: 2,
  OPEN_BARE: 4
}

/**
 * The State of the repository
 * @access   public
 * @type     {Object}
 * @constant
 * @property {Number} NONE=0
 * @property {Number} MERGE=1
 * @property {Number} REVERT=2
 * @property {Number} REVERT_SEQUENCE=3
 * @property {Number} CHERRYPICK=4
 * @property {Number} CHERRYPICK_SEQUENCE=5
 * @property {Number} BISECT=6
 * @property {Number} REBASE=7
 * @property {Number} REBASE_INTERACTIVE=8
 * @property {Number} REBASE_MERGE=9
 * @property {Number} APPLY_MAILBOX=10
 * @property {Number} APPLY_MAILBOX_OR_REBASE=11
 */
const STATE = {
  NONE: 0,
  MERGE: 1,
  REVERT: 2,
  REVERT_SEQUENCE: 3,
  CHERRYPICK: 4,
  CHERRYPICK_SEQUENCE: 5,
  BISECT: 6,
  REBASE: 7,
  REBASE_INTERACTIVE: 8,
  REBASE_MERGE: 9,
  APPLY_MAILBOX: 10,
  APPLY_MAILBOX_OR_REBASE: 11
}

/**
 * Exports high level helper functions
 * @type {Object}
 */
module.exports = {

  /**
   * Initialize a repository
   * @access public
   * @type     {Function}
   * @param    {String}  [path]          Optional path where to init the repo
   * @param    {Object}  [options]       The options of the init function
   * @property {Boolean} options.isBare  If true the repository will be bare
   * @return   {Promise}                 Returns a promise for flow control
   */
  init: (path, options) => {
    if (options.isBare) return Repository.init(path, 1)

    return Repository.init(path, 0)
  },

  /**
   * Adds files to staging
   * @access public
   * @type   {Function}
   * @param  {Array}          files A array of file names
   * @return {Promise<Array>}       Returns a promise for flow control with
   *                                the files added to git
   */
  add: function (files, options) {
    options = options || {}
    let cwd = options.cwd || process.cwd()

    let gitFolder = path.resolve(cwd, GIT_FOLDER_NAME)
    let repository, index

    /**
     * Refreshes the Index of the repository
     * Grabs a fresh copy of the index from the repository.
     * Invalidates all previously grabbed indexes
     * @access private
     * @param  {Repository} repo The repository for Refreshing the index
     * @return {Index}           Returns the refreshed index
     */
    let refreshIndex = (repo) => {
      repository = repo
      return repo.refreshIndex()
    }

    /**
     * Add the files to the refreshed index
     * @access private
     * @param  {Index}         newIndex The refreshed index
     * @return {Array<Number>}          Returns if every promise is ok, a array
     *                                  of Numbers ([0,0,0])
     */
    let addFiles = (newIndex) => {
      index = newIndex
      let promises = []

      for (let file of files) {
        promises.push(index.addByPath(file))
      }
      return Promise.all(promises)
    }

    /**
     * Writes the new Index
     * @access private
     * @return {Number} Returns 0 on success or an error code
     */
    let writeIndex = () => {
      return index.write()
    }

    /**
     * Writes the Tree
     * @access private
     * @param  {Number} result The result of the `writeIndex` method
     * @return {Oid}           Returns the `Oid` of the written tree
     */
    let writeTree = (result) => {
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
  },

  /**
   * The remote namespace
   * @access    public
   * @namespace
   * @property  {Function} remote.add
   * @property  {Function} remote.get_url
   * @property  {Function} remote.prune
   * @property  {Function} remote.remove
   * @property  {Function} remote.rename
   * @property  {Function} remote.set_branches
   * @property  {Function} remote.set_head
   * @property  {Function} remote.set_url
   * @property  {Function} remote.show
   * @property  {Function} remote.update
   */
  remote: _remotesNs
}
