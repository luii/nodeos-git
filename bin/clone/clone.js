#!/usr/bin/env node

'use strict'

// Dependencies
const ncp = require('ncp')
const git = require('nodegit')
const path = require('path')

const Clone = git.Clone
const Remote = git.Remote
const Repository = git.Repository

/**
 * The command format itself
 * @access public
 * @type   {String}
 */
exports.command = 'clone <repository> [directory]'

/**
 * Description of the `clone` command
 * @access public
 * @type   {String}
 */
exports.desc = 'Clones a repository into a newly created directory'

/**
 * Options of the command
 */
exports.builder = {
  template: {
    describe: 'Specify the directory from which templates will be used',
    string: true
  },
  bare: {
    describe: 'Make a bare Git repository.',
    boolean: true
  },
  mirror: {
    describe: 'Set up a mirror of the source repository.',
    boolean: true
  }
}

/**
 * Creates a fetch spec in the repository
 * @param  {String} url The remote repository url
 * @return {Promise}    Returns a array of promises
 */
let createFetchSpec = (url) => {
  return (repo) => {
    Remote.createWithFetchspec(repo, 'origin', url, '+refs/*:refs/*')
    return Promise.all([ repo.config(), repo ])
  }
}

/**
 * Sets the mirror property
 * @param  {Array}  res A array containing the `config` and the `repo`
 * @return {Object}     Returns the repo
 */
let setMirrorProperty = (res) => {
  res[0].setString('remote.origin.mirror', 'true')
  return res[1]
}

/**
 * Fetches the origin with the configured refspec
 * @param  {Object} repo The new initialized repository
 * @return {Promise}     Returns a promise
 */
let fetchOrigin = (repo) => {
  return repo.fetch('origin')
}

/**
 * The clone command action
 * @param  {Object} argv A object containing the arguments
 * @return {Void}        Returns nothing to end the function
 */
exports.handler = function (argv) {
  let url = argv.repository
  let cwd = argv.directory || process.cwd()
  let options = {}
  if (argv.bare) options.bare = 1

  if (argv.template) {
    ncp(argv.template, path.join(process.cwd(), cwd), err => {
      if (err) return console.error(err)
      return console.log('copied template');
    })
  }

  // because nodegit dont support mirroring yet, here is a workaround
  if (argv.mirror) {
    let repo, conf

    Repository.init(cwd, 1)
    .then(createFetchSpec(url))
    .then(setMirrorProperty)
    .then(fetchOrigin)
    .catch(console.log.bind(console))
    .done(() => console.log(`Mirrored ${url} in ${argv.directory}`))

    return
  }

  Clone(url, cwd, options).then(repo => {
    if (options.bare) {
      console.log('Cloned bare repository')
    } else {
      console.log('Cloned repository');
    }
  }).catch(console.log.bind(console))
  return
}
