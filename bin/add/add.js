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
exports.command = 'add <files...>'

/**
 * Description of the `add` command
 * @access public
 * @type   {String}
 */
exports.desc = 'Add file contents to the index'

/**
 * Options of the command
 */
exports.builder = {

}
/**
 * The clone command action
 * @param  {Object} argv A object containing the arguments
 * @return {Void}        Returns nothing to end the function
 */
exports.handler = function (argv) {
  let gitFolder = path.join(process.cwd(), '/.git')
  let repo, index

  Repository.open(gitFolder).then(repository => {
    repo = repository
    return repo.refreshIndex()
  }).then(newIndex => {
    index = newIndex
    let arr = []

    console.log(argv);
    for (let file of argv.files) {
      arr.push(index.addByPath(file))
    }

    return Promise.all(arr)
  }).then(() => {
    return index.write()
  }).then(() => {
    return index.writeTree()
  }).catch(() => console.log.bind(console)).done(() => {
    console.log(`Added ${argv.files}`);

  })
}
