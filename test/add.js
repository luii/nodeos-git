/* eslint-env mocha */
'use strict'


const nogit = require('../lib')
const nodegit = require('nodegit')
const chai = require('chai')
const should = chai.should()

chai.use(require('chai-as-promised'))
chai.use(require('sinon-chai'))

const sinon = require('sinon')
const sap = require('sinon-as-promised')

describe('Nogit', () => {

  describe('.add', () => {
    it('should exist', () => nogit.add.should.exist)
    it('should be defined', () => nogit.add.should.not.be.undefined)
    it('should be a function', () => nogit.add.should.be.a('function'))
    it('should add a file to staging', sinon.test(() => {
      let params = [ 'lib/index.js' ]

      nogit.add(params)
        .then((files) => {
          params.should.deep.equal(files)
        }).catch(console.log.bind(console))
    }))
  })
})
