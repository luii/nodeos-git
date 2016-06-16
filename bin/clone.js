'use strict'

// Dependencies

const git = require('nodegit')
const progress = require('progress')

const clone = git.Clone

/**
 * Clones a remote repository
 * @access public
 * @param  {String} repo The like to the remote repo
 * @return {}
 */
module.exports = (repo, cwd) => {
  cwd = cwd || process.cwd()

  let bar = new progress(`${__('receivedObjects')}: :percent :etas`, {
    complete: '=',
    incomplete: ' ',
    width: 20,
    total: 20
  })

  clone(repo, './test', {
    fetchOpts: {
      callbacks: {
        transferProgress: tp => {
          bar.total = tp.totalObjects()
          bar.curr = tp.receivedObjects()
          if (0 == bar.curr) bar.start = new Date

          bar.render()
        }
      }
    }
  }).then((repo) => {

  })
}
