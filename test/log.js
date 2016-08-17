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
  describe('.log', () => {
    it('should exist', () => nogit.log.should.exist)
    it('should be defined', () => nogit.log.should.not.be.undefined)
    it('should be a function', () => nogit.log.should.be.a('function'))
    it('should log out the commit history')
  })
})
