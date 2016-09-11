/* eslint-env mocha */
'use strict'

const fs = require('fs')
const strictEqual = require('assert').strictEqual

const extract = require('tar-fs').extract
const gunzip = require('gunzip-maybe')
const tmp = require('tmp')

const checkout = require('..').checkout


tmp.setGracefulCleanup()


describe('checkout', function()
{
  var cwd
  var cleanupCallback


  beforeEach(function(done)
  {
    tmp.dir({unsafeCleanup: true}, function(err, path, _cleanupCallback)
    {
      if(err) return done(err)

      cwd = path+'/checkout'
      cleanupCallback = _cleanupCallback

      fs.createReadStream(__dirname+'/fixtures/checkout.tar.gz')
      .pipe(gunzip()).pipe(extract(path)).on('finish', done)
    })
  })

  afterEach(function(done)
  {
    cleanupCallback()
    done()
  })


  it('master branch', function(done)
  {
    const checkoutBranch = 'master'
    const expected = "Can't get you out of my head\n"

    checkout(checkoutBranch, {cwd})
    .then(function(branch)
    {
      strictEqual(branch, checkoutBranch)

      fs.readFile(cwd+'/README.md', 'utf8', function(error, data)
      {
        if(error) return done(error)

        strictEqual(data, expected)

        done()
      })
    }, done)
  })

  it('commit and be in detached head mode', function(done)
  {
    const checkoutDetached = 'fd8a3c2992a06a760287fe5c4eb9edd5a2580765'
    const expected = 'Hello Git! :-)\n'

    checkout(checkoutDetached, {cwd})
    .then(function(branch)
    {
      strictEqual(branch, checkoutDetached)

      fs.readFile(cwd+'/README.md', 'utf8', function(error, data)
      {
        if(error) return done(error)

        strictEqual(data, expected)

        done()
      })
    }, done)
  })
})
