'use strict'

const _add           = require('./add')
// const _get_url       = require('./get-url')
// const _prune         = require('./prune')
// const _remove        = require('./remove')
// const _rename        = require('./rename')
// const _set_branches  = require('./set_branches')
// const _set_head      = require('./set_head')
// const _set_url       = require('./set_url')
// const _show          = require('./show')
// const _update        = require('./update')
const _list = require('./list')

// expose public interface
module.exports = {

  add: _add,
  // get_url: _get_url,
  // prune: _prune,
  // remove: _remove,
  // rename: _rename,
  // set_branches: _set_branches,
  // set_head: _set_head,
  // set_url: _set_url,
  // show: _show,
  // update: _update,
  list: _list,

  // const
  mirror: {
    FETCH: 'fetch',
    PUSH:  'push'
  }
}