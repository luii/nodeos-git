/* eslint-env mocha */

'use strict'

const nogit = require('../lib')
const chai = require('chai')
const should = chai.should()

chai.use(require('chai-as-promised'))
chai.use(require('sinon-chai'))

const sinon = require('sinon')
const sap = require('sinon-as-promised')

describe('Nogit', () => {
  describe('.config', () => {
    it('should exist', () => nogit.config.should.exist)
    it('should be defined', () => nogit.config.should.not.be.undefined)
    it('should be a function', () => nogit.config.should.be.a('function'))
    it('should get a string out of the local repository config')
  })
})
