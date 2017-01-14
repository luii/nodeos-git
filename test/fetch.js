/* eslint-env mocha */
'use strict'

// TBT (to be tested)
const git           = require('../lib')
const fetch        = git.fetch

// Testing
const sap           = require('sinon-as-promised')
const chai          = require('chai')
const sinon         = require('sinon')
chai.should()
chai.use(require('chai-as-promised'))
chai.use(require('sinon-chai'))

// Dependencies
const fs            = require('fs')
const fsp           = require('fs-promise')
const del           = require('del')
const tar           = require('tar-fs')
const temp          = require('temp')
const path          = require('path')
const gunzip        = require('gunzip-maybe')

describe('fetch', () => {
  const fixtureRepository   = `${__dirname}/fixtures/clean.tar.gz`
  const originalCwd         = process.cwd()
  let   cwd

  describe('.add', () => {
    beforeEach(done => { // setup temp folders
      temp.track()

      temp.mkdir('fetch-test', (error, dir) => {
        process.chdir(dir)

        fs.createReadStream(fixtureRepository)
          .pipe(gunzip())
          .pipe(tar.extract(process.cwd()))
          .on('finish', () => {
            try {
              dir = `${dir}/clean`
              process.chdir(dir) // set current workdir to the temp dir
              cwd = process.cwd()
            } catch (error) {
              return done(error)
            }

            return done()
          })
      })
    })

    afterEach(done => {  // cleanup after every test case
      process.chdir(originalCwd) // set back to old current workdir

      temp.cleanup((err, stats) => {
        // do something
        return done()
      })
    })

    it('should exist', () => {
      fetch.add.should.exist
    })

    it('should be defined', () => {
      fetch.add.should.not.be.undefined
    })

    it('should be a function', () => {
      fetch.add.should.be.a('function')
    })

    it.skip('should fetch all branches from one repository', () => {

    })

    it.skip('should fetch all branches from multiple repositories', () => {

    })

    it.skip('should fetch all tags from one repository', () => {

    })

    it.skip('should fetch all tags from multiple repositories', () => {

    })

    it.skip('should fetch all branches and tags from one repository', () => {

    })

    it.skip('should fetch all branches and tags from multiple repositories', () => {

    })

    it.skip('should fetch from the origin (default) if no repo [url/refspec] is given', () => {

    })

    it.skip('should fetch from a group defined in git config', () => {

    })

    // OPTIONS
    // --all
    it.skip('Fetch all remotes specified in the config', () => {

    })

    // --append
    it.skip('should append ref names and object names of fetched refs to the existing contents of `.git/FETCH_HEAD`', () => {

    })

    // UNSUPPORTED
    // --depth=<depth>
    it.skip('should limit the fetching to the specified number of commits from the tip of each remote branch history', () => {

    })

    // --deepen=<depth>
    it('Similar to --depth, except it specifies the number of commits from the current shallow boundary instead of from the tip of each remote branch history.', () => {

    })

    // --shallow-since
    it('should deepen or shorten the history of a shallow repository to include all reachable commits after <date>', () => {

    })

    // --dry-run
    it('should show what would be done, without making any changes', () => {

    })

    // -f, --force
    // When git fetch is used with <rbranch>:<lbranch> refspec, it refuses to
    // update the local branch <lbranch> unless the remote branch <rbranch> it
    // fetches is a descendant of <lbranch>. This option overrides that check.
    it('should override the descendant condition of the local branch', () => {

    })

    // -k, --keep
    it('should keep the downloaded pack', () => {

    })

    // --multiple
    it('should allow several repositories and groups arguments to be specified', () => {

    })

    // -p, --prune
    it('should remove any remote-tracking references that no longer exist on the remote before fetching', () => {

    })

    // -n, --no-tags
    it('should disable the option to store tags and objects locally', () => {

    })

    // -t, --tags
    it('should enable the option to store tags and object locally', () => {

    })

    // --refmap=<refspec>
    it('should use the refspecs specified by this option instead of `remote.*.fetch`', () => {

    })

    // -q, --quiet
    it('should silence any other internally used git commands', () => {

    })

    // -v, --verbose
    it('should show any other internally used git commands logs', () => {

    })
  })
})