'use strict'

var redis = require('redis')

var now = function (ttl) {
  if (typeof ttl === 'undefined' || isNaN(ttl) === true) {
    ttl = 0
  }

  return Math.floor((new Date()).getTime() / 1000) + ttl
}

function RedisCache (namespace, opts) {
  var options = opts.auth_pass ? { auth_pass: opts.auth_pass } : undefined
  this._namespace = namespace
  this._client = redis.createClient(opts.port, opts.host, options)
}

RedisCache.prototype.get = function (id, cb) {
  this._client.hget(this._namespace, id, function (err, res) {
    if (err || res === null) {
      return cb(err, null)
    }

    var data = JSON.parse(res)
    cb(null, data.ttl < now() ? null : data.item)
  })
}

RedisCache.prototype.set = function (id, item, ttl, cb) {
  if (typeof ttl === 'function') {
    cb = ttl
    ttl = 3600 * 24 * 7
  }

  this._client.hset(this._namespace, id, JSON.stringify({
    item: item,
    ttl: now(ttl)
  }), cb)
}

RedisCache.prototype.on = function (id, cb) {
  this._client.on(id, cb)
}

module.exports = RedisCache
