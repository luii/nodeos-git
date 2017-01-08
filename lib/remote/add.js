'use strict'

const path        = require('path')
const nodegit     = require('nodegit')

const Remote      = nodegit.Remote
const Repository  = nodegit.Repository

/**
 * Lists the remotes of the repository
 * @access   public
 * @param    {String}         workdir         The directory of the repository
 * @param    {String}         name            The name of the remote
 * @param    {String}         url             The url of the remote
 * @param    {Object}         options         The options for the list
 * @property {Boolean}        options.verbose The verbose flag
 * @property {String}         options.track   Instead of the default glob
 *                                            refspec for the remote to track
 *                                            all branches under the
 *                                            `refs/remotes/<name>/*` namespace,
 *                                            a refspec to track only `<branch>`
 *                                            is created
 * @property {String}         options.master  A symbolic-ref
 *                                            `refs/remotes/<name>/HEAD` is set
 *                                            up to point at remote’s `<master>`
 *                                            branch
 * @property {Boolean}        options.fetch   With `-f` option, is run
 *                                            `git fetch <name>`immediately
 *                                            after the remote information is
 *                                            set up
 * @property {Boolean}        options.no_tags Does not import tags from the
 *                                            remote repository, opt.tags must
 *                                            be false when using this option
 * @property {Boolean}        options.tags    Imports every tag from the remote
 *                                            repository, opt.no_tags must be
 *                                            false when using this option
 * @property {Enum}           options.mirror  When a fetch mirror is created
 *                                            with `--mirror=fetch`, the refs
 *                                            will not be stored in the
 *                                            `refs/remotes/` namespace, but
 *                                            rather everything in `refs/` on
 *                                            the remote will be directly
 *                                            mirrored into `refs/` in the local
 *                                            repository. This option only
 *                                            makes sense in bare repositories,
 *                                            because a fetch would overwrite
 *                                            any local commits.
 * @return   {Array<Promise>}                 If the verbose flag is set it'll
 *                                            return a Array of Promises
 */
module.exports = function (workdir, name, url, options) {
  let { track, master, tags, no_tags, mirror } = options
  let gitFolder = path.resolve(workdir, '.git')
  let repo

  return Repository.open(gitFolder)
    .then(repository => {
      repo = repository

      return Remote.create(repo, name, url)
    }).then(createdRemote => {
      // if there is no track option set we just add a fetch ref spec for all
      // remote branches
      if (! track) {
        return Promise.resolve(Remote.addFetch(repo, name, `+refs/heads/*:refs/remotes/${name}/*` ))
      } else if (track && Array.isArray(track)) {
        return Promise.all(track.map(t => {
          return Remote.addFetch(repo, name, `+refs/heads/${t}:refs/remotes/${name}/${t}`)
        }))
      }
    })
}