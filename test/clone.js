/* eslint-env mocha */
'use strict'

const nogit = require('../lib')
const chai = require('chai')
const should = chai.should()
const del = require('del')

chai.use(require('chai-as-promised'))
chai.use(require('sinon-chai'))

const sinon = require('sinon')
const sap = require('sinon-as-promised')

const cloneRepository = 'https://github.com/NodeOS/NodeOS'
const fixtureDir = 'test/fixtures'

describe('Nogit', () => {
  describe('.clone', () => {
    beforeEach(function () {
      del([ 'test/fixtures/cwdTest',
            'test/fixtures/duplicate',
            'test/fixtures/mirror',
            'test/fixtures/clone' ])
        .catch(console.log.bind(console))
    })

    it('should exist', () => nogit.clone.should.exist)
    it('should be defined', () => nogit.clone.should.not.be.undefined)
    it('should be a function', () => nogit.clone.should.be.a('function'))
    it('should use process.cwd() if no dir is specified', sinon.test(function () {
      let cwdStub = sinon.stub(process, 'cwd')

      cwdStub.returns('/home/philipp/Dokumente/github/nogit/test/fixtures/cwdTest')

      nogit.clone(cloneRepository)
        .then((repository) => {
          let path = repository.path()

          path.should.equal('/home/philipp/Dokumente/github/nogit/test/fixtures/cwdTest')
        }).catch(console.log.bind(console))
    }))

    it('should mirror the repository if the mirror flag is set', () => {
      let options = { mirror: true }

      nogit.clone(cloneRepository, `${fixtureDir}/mirror`, options)
        .then((repository) => {
          let path = repository.path()

          path.should.equal(`${fixtureDir}/mirror`)
        }).catch(console.log.bind(console))
    })

    it('should duplicate the template if the flag is set', () => {
      let options = { template: `/home/philipp/Dokumente/github/nogit/test/fixtures/template` }

      nogit.clone(cloneRepository, 'test/fixtures/duplicate', options)
        .then((repository) => {

        }).catch(console.log.bind(console))
    })

    it('should just clone the repository if no flag is set', () => {
      nogit.clone(cloneRepository, `${fixtureDir}/clone`)
        .then((repository) => {

        }).catch(console.log.bind(console))
    })
  })
})
