/* eslint-env mocha */
'use strict'

const fs = require('fs')
const strictEqual = require('assert').strictEqual

const extract = require('tar-fs').extract
const gunzip = require('gunzip-maybe')
const tmp = require('tmp')

const add = require('..').add


tmp.setGracefulCleanup()


describe('add', function()
{
  var cwd
  var cleanupCallback


  beforeEach(function(done)
  {
    tmp.dir({unsafeCleanup: true}, function(err, path, _cleanupCallback)
    {
      if(err) return done(err)

      cwd = path
      cleanupCallback = _cleanupCallback

      fs.createReadStream(__dirname+'/fixtures/add.tar.gz')
      .pipe(gunzip()).pipe(extract(path)).on('finish', done)
    })
  })

  afterEach(function(done)
  {
    cleanupCallback()
    done()
  })


  it('add a file to staging', function(done)
  {
    const expected = ['README.md']

    add(expected, {cwd})
    .then(function(files)
    {
      strictEqual(files, expected)

      done()
    }, done)
  })
})
