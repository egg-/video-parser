'use strict'

module.exports = {
  createClient: function (opts) {
    if (opts.redis) {
      var RedisCache = require('./redis')
      return new RedisCache(opts.name, opts.redis)
    } else {
      var MemoryCache = require('./memory')
      return new MemoryCache(opts.name)
    }
  }
}
