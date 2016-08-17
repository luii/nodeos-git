/* eslint-env mocha */
'use strict'


const nodegit = require('nodegit')
const nogit = require('../lib')
const chai = require('chai')
const should = chai.should()

chai.use(require('chai-as-promised'))
chai.use(require('sinon-chai'))

const sinon = require('sinon')
const sap = require('sinon-as-promised')

describe('Nogit', () => {
  describe('.checkout', () => {
    it('should exist', () => nogit.checkout.should.exist)
    it('should be defined', () => nogit.checkout.should.not.be.undefined)
    it('should be a function', () => nogit.checkout.should.be.a('function'))
    it('should checkout the master branch', () => {
      let checkoutBranch = 'master'

      nogit.checkout(checkoutBranch)
        .then((branch) => {
          branch.should.equal(checkoutBranch)
        })
    })
    it('should checkout commit and be in detached head mode', () => {
      let checkoutDetached = 'c8ad7c9813f05cb01569c850c0cf4e6bdf971edf'

      nogit.checkout(checkoutDetached)
        .then((branch) => {
          branch.should.equal(checkoutDetached)
        })
    })
  })
})
