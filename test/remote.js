/* eslint-env mocha */
'use strict'

// TBT
const git           = require('../lib')
const remote        = git.remote

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

// Constants

describe('remote', () => {
  const fixtureRepository   = `${__dirname}/fixtures/clean.tar.gz`
  const originalCwd         = process.cwd()
  let   cwd

  const remoteName          = 'origin'
  const remoteUrl           = 'https://www.somerandomurl.com/'

  const remoteTrackOption   = 'testBranch'
  const remoteMasterOption  = 'testMaster'

  describe('.add', () => {
    beforeEach(done => { // setup temp folders
      temp.track()

      temp.mkdir('remote-add-test', (error, dir) => {
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
        console.log(stats)
        return done()
      })
    })

    it('should exist', () => {
      remote.add.should.exist
    })

    it('should be defined', () => {
      remote.add.should.not.be.undefined
    })

    it('should be a function', () => {
      remote.add.should.be.a('function')
    })

    // just add a remote
    it('should add a remote to the repository', done => {
      git.remote.add(cwd, remoteName, remoteUrl, {})
        .then(() => {
          return Promise.all([
            git.config(cwd, { get: `remote.${remoteName}.url` }),
            git.config(cwd, { get: `remote.${remoteName}.fetch` })
          ]).should.be.fulfilled
        }).then(config => {
          let [ url, fetchRefSpec] = config
          const expectedUrl        = remoteUrl
          const expectedRefSpec    = `+refs/heads/*:refs/remotes/${remoteName}/*`

          expectedUrl.should.equal(url)
          expectedRefSpec.should.equal(fetchRefSpec)

          return done()
        }).catch(done)
    })

    // track option
    it('should only track a branch when the track option is set', done => {
      git.remote.add(cwd, remoteName, remoteUrl, {
        track: [ remoteTrackOption ]
      }).then(() => {
        return Promise.all([
          git.config(cwd, { get: `remote.${remoteName}.url` }),
          git.config(cwd, { get: `remote.${remoteName}.fetch` })
        ]).should.be.fulfilled
      }).then(config => {
        let [ url, fetchRefSpec ] = config
        const expectedUrl         = remoteUrl
        const expectedRefSpec     = `+refs/heads/${remoteTrackOption}:refs/remotes/${remoteName}/${remoteTrackOption}`

        expectedUrl.should.equal(url)
        expectedRefSpec.should.equal(fetchRefSpec)

        return done()
      }).catch(done)
    })

    // track option with multiple fetch ref specs
    // since nodegit doesnt support? (dont know for sure) multiple config
    // values we parse it ourself
    // CAUTION: parsing it ourself wont lock down other config files
    //          this can cause some unwanted side effects!!
    it('should track multiple branches of the remote with the track option set', done => {
      git.remote.add(cwd, remoteName, remoteUrl, {
        track: [
          remoteTrackOption,
          `${remoteTrackOption}1`
        ]
      }).then(() => {
        return Promise.all([
          git.config(cwd, { get : `remote.${remote}.url` }),
          git.config(cwd, { get_all: `remote.${remote}.fetch` }) // get a array of fetch ref specs
        ]).should.be.fulfilled
      }).then(config => {
        let [ url, fetchRefSpecs ] = config
        const expectedUrl          = remoteUrl
        const expectedRefSpecs     = [
          `+refs/heads/${remoteTrackOption}:refs/remotes/${remoteName}/${remoteTrackOption}`,
          `+refs/heads/${remoteTrackOption}1:refs/remotes/${remoteName}/${remoteTrackOption}1`
        ]

        expectedUrl.should.equal(url)
        expectedRefSpecs.should.equal(fetchRefSpecs)

        return done()
      }).catch(done)
    })

    // master option
    it(`should setup refs/remotes/${remoteName}/HEAD to point to the specified master`, done => {
      git.remote.add(cwd, remoteName, remoteUrl, {
        master: remoteMasterOption
      }).then(() => {
        return fsp.readFile(path.resolve(cwd, `.git/refs/remotes/${remoteName}/HEAD`), 'utf8')
      }).then(refSpec => {
        const expectedRefSpec = `ref: refs/remotes/${remoteName}/${remoteMasterOption}`

        expectedRefSpec.should.equal(refSpec)

        return done()
      }).catch(done)
    })

    // --tags option in combination with -f (--fetch)
    it.skip('should import tags with git.fetch() when tags option is true', () => {
      git.remote.add(cwd, remoteName, remoteUrl, {
        tags: true
      }).then(() => {


      })
    })

    // --no-tags option in combination with -f (--fetch)
    it.skip('should not import tags with git.fetch() when no-tags option is true', () => {
      git.remote.add(cwd, remoteName, remoteUrl, {
        no_tags: true
      }).then(() => {

      })
    })

    // --no-tags and --tags in combination with -f (--fetch)
    it.skip('should throw an error because both options are set', () => {
      git.remote.add(cwd, remoteName, remoteUrl, {
        tags: true,
        no_tags: true
      }).then(() => {

      }).catch(done)
    })

    // mirror options
    it.skip('should store all refs in `/refs` on --mirror=fetch', () => {
      git.remote.add(cwd, remoteName, remoteUrl, {
        mirror: git.remote.mirror.FETCH
      }).then(() => {

      })
    })
  })
})