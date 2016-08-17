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
  describe('.revlist', () => {
    it('should exist', () => nogit.revList.should.exist)
    it('should be defined', () => nogit.revList.should.not.be.undefined)
    it('should be a function', () => nogit.revList.should.be.a('function'))
    it('should show a revision list')
  })
})
