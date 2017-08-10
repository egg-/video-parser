'use strict'

var cache = require('memory-cache')

function MemoryCache (namespace) {
  this._namespace = namespace
}

MemoryCache.prototype.get = function (id, cb) {
  cb(null, cache.get(this._namespace + id))
}

MemoryCache.prototype.set = function (id, item, ttl, cb) {
  if (typeof ttl === 'function') {
    cb = ttl
    ttl = 3600 * 24 * 7
  }
  cache.put(this._namespace + id, item, ttl * 1000, function (key) {
    cb(null, key)
  })
}

MemoryCache.prototype.on = function (id, cb) {
}

module.exports = MemoryCache
