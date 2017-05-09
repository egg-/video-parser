/**
 * parser.js: parser
 */

'use strict'

var util = require('util')
var events = require('events')
var request = require('request')
var FB = require('fb')
var ffmpeg = require('fluent-ffmpeg')
var defaults = require('merge-defaults')
var moment = require('moment')
var async = require('async')
var cheerio = require('cheerio')
var qs = require('querystring')

// naive cache instead of REDIS
const CACHE = {};

/**
 * @param {object} config
 * @param {string} [name] cache table name
 * @param {object} [redis]
 * @param {string} [redis.host]
 * @param {number} [redis.port]
 * @param {object} youtube
 * @param {string} youtube.key
 * @param {object} vimeo
 * @param {string} vimeo.access_token
 */
function Parser (config) {
  events.EventEmitter.call(this)

  if (typeof config === 'undefined') {
    throw new Error('required config.')
  }

  config = defaults(config, {
    name: 'video-parser-cache',
    youtube: {
      key: ''
    },
    vimeo: {
      access_token: ''
    },
    tudou: {
      key: ''
    },
    ttl: 3600 * 12 // 1 day
  })

  this._config = config
}

util.inherits(Parser, events.EventEmitter)

Parser.SERVICES = [
  {
    // https://regex101.com/r/uT9lO0/2
    provider: 'youtube',
    pattern: /(https?:\/\/)?(www.)?(youtube\.com|youtu\.be|youtube-nocookie\.com)\/(?:embed\/|v\/|watch\?v=|watch\?list=(.*)&v=|watch\?(.*[^&]&)v=)?((\w|-){11})(&list=(\w+)&?)?/,
    method: 'loadYoutube',
    index: 6
  },
  {
    provider: 'vimeo',
    pattern: /[\w\W]*vimeo\.com\/([\w\W]*)[\w\W]*/,
    method: 'loadVimeo',
    index: 1
  },
  {
    // https://regex101.com/r/wF8zV5/1
    provider: 'facebook',
    pattern: /(https?:\/\/)?(www.)?(facebook\.com)\/(\S*\/)*(videos?\/(embed\?video_id=|vb.\d+\/)?)(\d+)/,
    method: 'loadFacebook',
    index: 7
  },
  {
    // https://regex101.com/r/yI6pN3/2
    // http://v.youku.com/v_show/id_XMTMwMDYxMjQxMg==_ev_1.html?from=y1.3-idx-uhome-1519-20887.205805-205902.1-1
    // http://v.youku.com/v_show/id_XMjMxOTQyOTQw.html?from=y1.6-97.3.1.a44aa406e0c711df97c0
    // http://v.youku.com/v_show/id_XMTI5Mjg5NjE4MA==.html?from=y1.3-idx-uhome-1519-20887.205921-205922-205810-205923.1-1
    // http://v.youku.com/v_show/id_XMTI5Mjg5NjE4MA==.html
    // http://player.youku.com/player.php/sid/XMTI5Mjg5NjE4MA==/v.swf
    // http://player.youku.com/player.php/sid/XMTI5Mjg5NjE4MA==/v.swf
    // http://player.youku.com/embed/XMTI5Mjg5NjE4MA==
    // http://player.youku.com/player.php/Type/Folder/Fid/25924643/Ob/1/sid/XMTMwMDgxNTY0NA==/v.swf
    provider: 'youku',
    pattern: /(https?:\/\/)?(v|player)\.youku\.com\/(v_show|player\.php|embed)(\/.*sid)?\/(id_)?(\w+=*)/,
    method: 'loadYouku',
    index: 6
  },
  {
    // https://regex101.com/r/oH7bO3/1
    // http://www.dailymotion.com/video/x2jvvep_coup-incroyable-pendant-un-match-de-ping-pong_tv
    // http://www.dailymotion.com/video/x2jvvep_rates-of-exchange-like-a-renegade_music
    // http://www.dailymotion.com/video/x2jvvep
    // http://www.dailymotion.com/hub/x2jvvep_Galatasaray
    // http://www.dailymotion.com/hub/x2jvvep_Galatasaray#video=x2jvvep
    // http://www.dailymotion.com/video/x2jvvep_hakan-yukur-klip_sport
    // http://dai.ly/x2jvvep
    // www.dailymotion.com/hub/x2jvvep_Galatasaray#video=x2jvvep
    provider: 'dailymotion',
    pattern: /(https?:\/\/)?(www.)?(dailymotion\.com\/(video|hub)\/?|dai\.ly)\/([^_\W]+)/,
    method: 'loadDailymotion',
    index: 5
  },
  {
    // http://tvcast.naver.com/v/13346/list/1316
    // http://tvcast.naver.com/v/13346
    provider: 'navertvcast',
    pattern: /https?:\/\/(m.)?tv(cast)?.naver.com\/v\/(\d+)/,
    method: 'loadNavertvcast',
    index: 3
  },
  {
    // https://regex101.com/r/rQ8fI9/1
    // http://rutube.ru/video/0c2d8cd528563c6bb1c3ca4b95320845/
    // rutube.ru/play/embed/7962382
    // http://video.rutube.ru/7508261
    provider: 'rutube',
    pattern: /(https?:\/\/)?(video.)?rutube.ru\/((video|play\/embed)\/)?(\w+)/,
    method: 'loadRutube',
    index: 5
  },
  {
    // https://regex101.com/r/gR1oN8/3
    // http://m.tvpot.daum.net/v/72525651
    // http://tvpot.daum.net/mypot/View.do?clipid=72525651&ownerid=45x1okb1If50
    // http://tvpot.daum.net/v/sb0fdSwSjVJfS6xf6SixjtJ
    // http://tvpot.daum.net/mypot/View.do?ownerid=45x1okb1If50&playlistid=6064073&clipid=72525613
    // http://tvpot.daum.net/clip/ClipView.do?clipid=72589907
    // http://tvpot.daum.net/v/34RNu2rwWe8%24
    provider: 'daumtvpot',
    pattern: /(https?:\/\/)?(m.)?tvpot.daum.net\/(v\/|(mypot\/View.do|clip\/ClipView.do)\?(\S*)clipid=)([\w%]+)/,
    method: 'loadDaumtvpot',
    index: 6
  },
  {
    // http://www.tudou.com/programs/view/OPvyq2gJWfY/?FR=LIAN
    // http://www.tudou.com/programs/view/html5embed.action?code=kbPzDzCIeBE&autoPlay=false&playType=AUTO
    // http://www.tudou.com/v/OPvyq2gJWfY/&resourceId=0_04_05_99/v.swf
    // http://www.tudou.com/programs/view/html5embed.action?type=0&code=OPvyq2gJWfY&lcode=&resourceId=0_06_05_99
    provider: 'tudou',
    pattern: /(https?:\/\/)?\/\/(www.)?tudou.com\/((programs\/view)|v)\/(html5embed.action\?(code=|(type=0&code=)))?(\w+)/,
    method: 'loadTudou',
    index: 8
  },
  {
    // http://www.gomtv.com/14683612
    provider: 'gomtv',
    pattern: /(https?:\/\/)?\/\/(www.)?gomtv.com\/(\w+)/,
    method: 'loadGomTv',
    index: 3
  },
  {
    provider: 'html5',
    pattern: /(https?:\/\/).*\.(mp4|avi|mov)/,
    method: 'loadHtml5',
    index: 0
  }
]

Parser.parse = function (cb, url) {
  var matches = null
  var service = null
  var id = null

  for (var i = 0, target; i < Parser.SERVICES.length; i++) {
    target = Parser.SERVICES[i]

    if ((matches = target.pattern.exec(url)) !== null) {
      service = target
      break
    }
  }

  if (service === null) {
    return cb('video.not_supported_provider')
  }

  id = matches[service.index]

  // rutube
  if (service.provider === 'rutube' && isNaN(id) === false) {
    // load video tag
    return request('http://rutube.ru/play/embed/' + id, function (err, res, body) {
      if (err) {
        return cb(err)
      }

      var $ = cheerio.load(body)
      Parser.parse(cb, $('head link[rel="canonical"]').attr('href'))
    })
  }

  cb(null, {
    provider: service.provider,
    id: id
  }, service.pattern, service.method)
}

Parser.prototype.parse = function (cb, url) {
  var self = this

  Parser.parse(function (err, result, pattern, method) {
    if (err) {
      return cb(err)
    }

    self[method](function (err, video) {
      if (video) {
        video.provider = result.provider
      }

      cb(err, err ? null : video)
    }, result.id)
  }, url)
}

Parser.prototype.load = function (cb, fail, cacheId) {
  var self = this

  this.loadCache(function (err, item) {
    if (err || item) {
      if (typeof item === 'string') {
        return cb(item)
      }
      return cb(err, item)
    } else {
      fail(function (err, item) {
        self.saveCache(function (err) {
          if (err) {
            self.emit('error', err)
          }
        }, cacheId, typeof err === 'string' ? err : item, self._config.ttl)
        cb(err, item)
      })
    }
  }, cacheId)
}

Parser.prototype.loadYoutube = function (cb, id) {
  var self = this

  this.load(cb, function (cb) {
    self.requestYoutube(cb, id)
  }, 'youtube_' + id)
}

Parser.prototype.loadYoutubeChannel = function (cb, id) {
  var self = this

  this.load(cb, function (cb) {
    self.requestYoutubeChannel(cb, id)
  }, 'youtube_channel_' + id)
}

Parser.prototype.loadVimeo = function (cb, id) {
  var self = this

  this.load(cb, function (cb) {
    self.requestVimeo(cb, id)
  }, 'vimeo_' + id)
}

Parser.prototype.loadFacebook = function (cb, id) {
  var self = this

  this.load(cb, function (cb) {
    self.requestFacebook(cb, id)
  }, 'facebook_' + id)
}

Parser.prototype.loadMeta = function (cb, cacheId, url) {
  this.load(cb, function (cb) {
    ffmpeg.ffprobe(url, cb)
  }, cacheId)
}

Parser.prototype.loadYouku = function (cb, id) {
  var self = this

  this.load(cb, function (cb) {
    self.requestYouku(cb, id)
  }, 'youku_' + id)
}

Parser.prototype.loadDailymotion = function (cb, id) {
  var self = this

  this.load(cb, function (cb) {
    self.requestDailymotion(cb, id)
  }, 'dailymotion_' + id)
}

Parser.prototype.loadNavertvcast = function (cb, id) {
  var self = this

  this.load(cb, function (cb) {
    self.requestNavertvcast(cb, id)
  }, 'navertvcast_' + id)
}

Parser.prototype.loadRutube = function (cb, id) {
  var self = this

  this.load(cb, function (cb) {
    self.requestRutube(cb, id)
  }, 'rutube_' + id)
}

Parser.prototype.loadDaumtvpot = function (cb, id) {
  var self = this

  this.load(cb, function (cb) {
    self.requestDaumTvpot(cb, id)
  }, 'daumtvpot_' + id)
}

Parser.prototype.loadTudou = function (cb, id) {
  var self = this

  this.load(cb, function (Cb) {
    self.requestTudou(cb, id)
  }, 'todou_' + id)
}

Parser.prototype.loadGomTv = function (cb, id) {
  var self = this

  this.load(cb, function (Cb) {
    self.requestGomTv(cb, id)
  }, 'gomtv_' + id)
}


Parser.prototype.loadHtml5 = function (cb, id) {
  var self = this

  this.load(cb, function (cb) {
    self.requestHtml5(cb, id)
  }, 'html5_' + id)
}


const getTitle = fileName => fileName.substring(fileName.lastIndexOf('/') + 1, fileName.lastIndexOf('.'));

Parser.prototype.requestHtml5 = function (cb, id) {
  ffmpeg.ffprobe(id, function(err, metadata) {
    if (err) {
      cb(err);
      return;
    }
    cb(null, {
      id: id,
      url: id,
      name: getTitle(id),
      duration: metadata.format.duration,
      ctime: moment(metadata.format.tags.creation_time).format(),
    })
  });
}

Parser.prototype.requestYoutube = function (cb, id) {
  var self = this
  var part = 'snippet,contentDetails,status,player'
  var fields = 'items(snippet(title,description,thumbnails,channelId,publishedAt,tags),contentDetails(duration,definition,contentRating),status(embeddable),player(embedHtml))'
  var url = [
    'https://www.googleapis.com/youtube/v3/videos',
    '?id=', id,
    '&part=', encodeURIComponent(part),
    '&fields=', encodeURIComponent(fields),
    '&key=', this._config.youtube.key
  ].join('')

  request(url, function (err, res, body) {
    if (err) {
      return cb(err)
    }

    var result = JSON.parse(body)
    if (typeof result.items === 'undefined' || result.items.length === 0) {
      return cb('video.not_found')
    }

    var item = result.items[0]

    if (item.status.embeddable === false) {
      return cb('video.forbidden')
    }

    var snippet = item.snippet
    var details = item.contentDetails
    var ratings = typeof details.contentRating !== 'undefined' ? details.contentRating : {}
    // YouTube가 연령 제한 콘텐츠를 식별하기 위해 사용하는 등급입니다.
    if (typeof ratings.ytRating !== 'undefined' && ratings.ytRating === 'ytAgeRestricted') {
      return cb('video.age_restricted')
    }

    self.loadYoutubeChannel(function (err, channel) {
      if (err) {
        return cb(err)
      }

      cb(err, {
        id: id,
        url: 'https://www.youtube.com/watch?v=' + id,
        name: snippet.title,
        desc: snippet.description,
        thumb_url: snippet.thumbnails.medium.url,
        duration: Parser.parseDuration(details.duration),
        ctime: moment(snippet.publishedAt).format(),
        ratings: ratings,
        tags: snippet.tags,
        details: {
          definition: details.definition,
          author: channel
        }
      })
    }, snippet.channelId)
  })
}

Parser.prototype.requestYoutubePlayList = function (cb, id, opt) {
  var part = 'snippet,contentDetails,status'
  var fields = 'items(snippet(title,description,thumbnails,resourceId,channelId,channelTitle),status(privacyStatus)),pageInfo,nextPageToken'
  var url = [
    'https://www.googleapis.com/youtube/v3/playlistItems',
    '?playlistId=', id,
    '&part=', encodeURIComponent(part),
    '&fields=', encodeURIComponent(fields),
    '&key=', this._config.youtube.key
  ]

  if (opt) {
    if (opt.token) {
      url.push('&pageToken=' + opt.token)
    }
    if (opt.limit) {
      url.push('&maxResults=' + opt.limit)
    }
  }

  request(url.join(''), function (err, res, body) {
    if (err) {
      return cb(err)
    }

    var result = JSON.parse(body)
    if (typeof result.items === 'undefined' || result.items.length === 0) {
      return cb('video.not_found')
    }

    var items = []
    for (var i = 0, item = null, snippet = null; i < result.items.length; i++) {
      item = result.items[i]

      if (item.status.privacyStatus !== 'public') {
        continue
      }

      snippet = item.snippet

      items.push({
        id: snippet.resourceId.videoId,
        url: 'https://www.youtube.com/watch?v=' + snippet.resourceId.videoId,
        name: snippet.title,
        desc: snippet.description,
        thumb_url: snippet.thumbnails.medium.url,
        duration: 0,
        ctime: moment(snippet.publishedAt).format(),
        ratings: {},
        details: {
          definition: '',
          author: {
            id: snippet.channelId,
            title: snippet.channelTitle
          }
        }
      })
    }

    cb(null, items, {
      token: result.nextPageToken,
      limit: result.pageInfo.resultsPerPage,
      totalcount: result.pageInfo.totalResults
    })
  })
}

Parser.prototype.requestYoutubeChannel = function (cb, channelId) {
  var part = 'snippet'
  var fields = 'items(snippet(title))'
  var url = [
    'https://www.googleapis.com/youtube/v3/channels',
    '?id=', channelId,
    '&part=', encodeURIComponent(part),
    '&fields=', encodeURIComponent(fields),
    '&key=', this._config.youtube.key
  ].join('')

  request(url, function (err, res, body) {
    if (err) {
      return cb(err)
    }

    var result = JSON.parse(body)
    if (typeof result.items === 'undefined' || result.items.length === 0) {
      return cb('video.channel_not_found')
    }

    cb(err, {
      id: channelId,
      title: result.items[0].snippet.title
    })
  })
}

Parser.prototype.requestVimeo = function (cb, id) {
  var self = this

  // validate video id
  if (isNaN(id) === true) {
    return request({
      url: 'https://vimeo.com/' + id,
      method: 'HEAD'
    }, function (err, res) {
      if (err) {
        return cb(err)
      }

      var url = res.request.href
      self._requestVimeo(cb, url.replace(/[\w\W]*vimeo\.com\//, ''))
    })
  }

  self._requestVimeo(cb, id)
}

Parser.prototype._requestVimeo = function (cb, id) {
  var url = 'https://api.vimeo.com/videos/' + id

  request({
    url: url,
    headers: {
      // manage: https://developer.vimeo.com/apps/53880#authenticationn
      'Authorization': 'Bearer ' + this._config.vimeo.access_token
    }
  }, function (err, res, body) {
    if (err) {
      return cb(err)
    }

    var result = JSON.parse(body)
    if (typeof result.error !== 'undefined') {
      return cb(new Error(result.error))
    }

    cb(err, {
      id: id,
      url: 'https://vimeo.com/' + id,
      name: result.name,
      desc: result.description,
      thumb_url: result.pictures.sizes[2].link,
      duration: result.duration,
      ctime: moment(result.created_time).format(),
      ratings: result.content_rating,
      details: {
        definition: '',
        author: {
          id: result.user.uri.replace('/users/', ''),
          title: result.user.name
        }
      }
    })
  })
}

Parser.prototype.requestFacebook = function (cb, id) {
  var self = this
  FB.napi(id, function (err, res) {
    if (err) {
      return cb('video.invalid_url')
    }

    if (res.published === false) {
      return cb('video.forbidden')
    }
    // filter
    var filtered = []
    for (var i = 0; i < res.format.length; i++) {
      if (res.format[i].width > 400) {
        filtered.push(res.format[i])
      }
    }
    var thumbnail = filtered.length > 0 ? filtered[0] : res.format[res.format.length - 1]

    self.loadMeta(function (err, meta) {
      if (err) {
        return cb(err)
      }

      cb(err, {
        id: id,
        url: ['https://www.facebook.com/', res.from.id, '/videos/', id].join(''),
        name: res.from.name,
        desc: res.description,
        thumb_url: thumbnail.picture || res.picture,
        duration: Math.round(meta.format.duration),
        ctime: moment(res.created_time).format(),
        ratings: null,
        details: {
          definition: '',
          author: {
            id: res.from.id,
            title: res.from.name
          },
          source: res.source
        }
      })
    }, 'facebook_meta_' + id, res.source)
  })
}

Parser.prototype.requestYouku = function (cb, id) {
  var url = ['https://openapi.youku.com/v2/videos/show.json?',
    'client_id=' + this._config.youku.key,
    '&video_id=' + id
  ].join('')

  request({
    url: url
  }, function (err, res, body) {
    if (err) {
      return cb(err)
    }

    var result = JSON.parse(body)
    if (typeof result.error !== 'undefined') {
      return cb(new Error(result.error))
    }

    cb(err, {
      id: result.id,
      url: result.link,
      name: result.title,
      desc: result.description,
      thumb_url: result.bigThumbnail,
      duration: Math.round(result.duration),
      ctime: moment(result.published).format(),
      ratings: {},
      details: {
        definition: '',
        author: {
          id: result.user.id,
          title: result.user.name
        }
      }
    })
  })
}

Parser.prototype.requestDailymotion = function (cb, id) {
  var url = ['https://api.dailymotion.com/video/',
    id,
    '?fields=',
    [
      'id', 'title', 'url',
      'allow_embed', // True if this video can be embedded outside of Dailymotion.
      'available_formats', // ["ld","sd","hq","hd720","hd1080"]
      'created_time', 'description', 'duration', 'embed_url',
      'private', // true if this video is private
      'thumbnail_720_url',
      'owner',
      'owner.screenname',
      'access_error'
    ].join(',')
  ].join('')

  request({
    url: url
  }, function (err, res, body) {
    if (err) {
      return cb(err)
    }

    var result = JSON.parse(body)
    var type = null

    if (typeof result.error !== 'undefined') {
      type = result.error.type
      if (type === 'not_found') {
        return cb('video.not_found')
      }
      return cb(result.error)
    }

    // https://developer.dailymotion.com/api#access-error
    if (result.access_error) {
      type = 'video.forbidden'
      switch (result.access_error.code) {
        case 'DM001':
        case 'DM002':
        case 'DM003':
          type = 'video.not_found'
          break
      }
      return cb(type)
    }

    cb(null, {
      id: result.id,
      url: result.url,
      name: result.title,
      desc: result.description,
      thumb_url: result.thumbnail_720_url,
      duration: Math.round(result.duration),
      ctime: moment.unix(result.created_time).format(),
      ratings: {},
      details: {
        definition: result.available_formats.length ? result.available_formats[result.available_formats.length - 1] : '',
        author: {
          id: result.owner,
          title: result['owner.screenname']
        }
      }
    })
  })
}

Parser.prototype.requestNavertvcast = function (cb, id) {
  var self = this

  async.waterfall([
    function (cb) {
      self.requestNavertvcastMeta(cb, id)
    },
    function (meta, cb) {
      self.requestNavertvcastOutkey(function (err, key) {
        if (err) {
          return cb(err)
        }

        cb(null, meta, key)
      }, meta.video.id)
    },
    function (meta, key, cb) {
      self.requestNavertvcastExtra(function (err, extra) {
        if (err) {
          return cb(err)
        }

        cb(null, meta, key, extra)
      }, meta.video.id, key)
    }
  ], function (err, meta, key, extra) {
    if (err) {
      return cb(err)
    }

    var video = {
      id: id,
      url: meta.url,
      name: meta.title,
      desc: meta.description,
      thumb_url: extra.image || meta.image,
      duration: extra.duration,
      ctime: meta.video.ctime ? meta.video.ctime : moment.unix(0).format(),
      ratings: {},
      tags: meta.tags || [],
      details: {
        definition: '',
        author: {
          id: extra.user.id || meta.user.id,
          url: meta.user.url,
          title: extra.user.name || meta.user.name
        },
        naver: {
          type: meta.video.type,
          id: meta.video.id,
          key: key
        }
      }
    }

    cb(null, video)
  })
}

Parser.prototype.requestNavertvcastMeta = function (cb, id) {
  var url = 'http://tv.naver.com/v/' + id

  request(url, function (err, res, body) {
    if (err) {
      return cb(err)
    }

    // naver의 dom 및 소스와 밀접하기 때문에 정상적인 작동이 안될 수 있음.
    var $ = cheerio.load(body)
    var $meta = $('head meta')
    var $date = $('#clipInfoArea div.title_info span.date')
    var $error = $('#container > div.error.noresult')
    var meta = {}

    if ($error && $error.length > 0) {
      return cb('not_exist_video')
    }

    $meta.each(function (idx, elem) {
      var $elem = $(elem)
      var property = $elem.attr('property')
      if (property) {
        if (property === 'og:video:tag') {
          meta['tags'] = meta['tags'] || []
          meta['tags'].push($elem.attr('content'))
        }
        meta[property] = $elem.attr('content')
      }
    })

    // naver의 dom 및 소스와 밀접하기 때문에 정상적인 작동이 안될 수 있음.
    var channel = $('.high_wrap .video_ch h2 a')
    var user = {
      id: '',
      url: '',
      title: ''
    }

    if (channel) {
      var link = channel.attr('href')
      var name = channel.text()
      var url = link.substring(link.lastIndexOf('/') + 1)

      user = {
        id: '',
        url: url,
        name: name
      }
    }

    if (!meta['naver:video:id']) {
      return cb('video.forbidden')
    }

    cb(null, {
      url: meta['og:url'],
      title: meta['og:title'],
      description: meta['og:description'],
      image: meta['og:image'],
      video: {
        type: meta['naver:video:type'],
        id: meta['naver:video:id'],
        ctime: $date ? moment($date.text().substring(2) + '+09:00', 'YYYY.MM.DD.ZZ').format() : null
      },
      tags: meta['tags'],
      user: user
    })
  })
}

Parser.prototype.requestNavertvcastOutkey = function (cb, vid) {
  var url = 'http://tv.naver.com/api/clipShareHtml?videoId=' + vid

  request(url, function (err, res, body) {
    if (err) {
      return cb(err)
    }

    try {
      var result = JSON.parse(body)
      var pattern = /(https?:\/\/(\S+)\?([^'"\s]+))/gi
      var matches = pattern.exec(result[0])
      if (matches) {
        var query = qs.parse(matches[3])
        return cb(null, query.outKey)
      }
      cb('video.forbidden')
    } catch (e) {
      cb(e, null)
    }
  })
}

Parser.prototype.requestNavertvcastExtra = function (cb, vid, key) {
  var url = ['http://play.rmcnmv.naver.com/vod/play/v1.5/' + vid,
    '?ver=1.5&key=', key].join('')

  request(url, function (err, res, body) {
    if (err) {
      return cb(err)
    }

    try {
      var result = JSON.parse(body)

      cb(null, {
        image: result.meta.cover.source,
        user: {
          id: result.meta.user.id,
          url: result.meta.user.url.substring(result.meta.user.url.lastIndexOf('/') + 1),
          name: result.meta.user.name
        },
        duration: result.videos.list[0].duration
      })
    } catch (e) {
      cb(null, {
        image: '',
        user: {
          id: '',
          url: '',
          name: ''
        },
        duration: 0
      })
    }
  })
}

Parser.prototype.requestRutube = function (cb, id) {
  var url = [
    'http://rutube.ru/api/video/', id, '?format=json'
  ].join('')

  request(url, function (err, res, body) {
    if (err) {
      return cb(err)
    }

    var result = JSON.parse(body)

    cb(null, {
      id: result.id,
      url: result.video_url,
      name: result.title,
      desc: result.description,
      thumb_url: result.thumbnail_url,
      duration: Math.round(result.duration),
      ctime: moment(result.created_ts + '+00:00').format(),
      ratings: {},
      details: {
        definition: '',
        author: {
          id: result.author.id,
          title: result.author.name
        },
        embed: {
          url: result.embed_url
        }
      }
    })
  })
}

Parser.prototype.requestDaumTvpot = function (cb, id) {
  request('http://m.tvpot.daum.net/v/' + id, function (err, res, body) {
    if (err) {
      return cb(err)
    }

    // daum tvpot의 dom 및 소스와 밀접하기 때문에 정상적인 작동이 안될 수 있음.
    var $ = cheerio.load(body)
    var $meta = $('head meta')
    var meta = {}

    $meta.each(function (idx, elem) {
      var $elem = $(elem)
      var property = $elem.attr('property')
      if (property) {
        meta[property] = $elem.attr('content')
      }
    })

    // daum tvpot의 dom 및 소스와 밀접하기 때문에 정상적인 작동이 안될 수 있음.
    var duration = $('div.clip_view span.desc_info span.num_data').eq(1).text()
    var $program = $('div.clip_subcribe span.info_program a')
    var author = {
      id: $program.attr('href').replace('/mypot/Top.tv?ownerid=', ''),
      title: $program.text()
    }
    var vid = meta['og:url'].replace('http://tvpot.daum.net/v/', '')

    cb(null, {
      id: id,
      url: meta['og:url'],
      name: meta['og:title'],
      desc: meta['og:description'],
      thumb_url: meta['og:image'],
      duration: Math.round(Parser.parseDuration(duration)),
      ctime: moment(meta['og:regDate'] + '+09:00', 'YYYYMMDDhhmmssZZ').format(),
      ratings: {},
      details: {
        definition: '',
        author: author,
        embed: {
          id: vid,
          url: 'http://videofarm.daum.net/controller/video/viewer/Video.html?vid=' + vid + '&play_loc=undefined'
        }
      }
    })
  })
}

Parser.prototype.requestTudou = function (cb, id) {
  var url = [
    'http://api.tudou.com/v6/video/info',
    '?app_key=' + this._config.tudou.key,
    '&format=json&itemCodes=' + id
  ].join('')

  request(url, function (err, res, body) {
    if (err) {
      return cb(err)
    }

    var result = JSON.parse(body)
    if (result.error_code) {
      return cb(result.error_info)
    }
    if (result.results.length === 0) {
      return cb('video.not_found')
    }

    var data = result.results[0]
    cb(null, {
      id: data.itemCode,
      url: data.playUrl,
      name: data.title,
      desc: data.description,
      thumb_url: data.bigPicUrl,
      duration: data.totalTime,
      ctime: moment(data.pubDate + '000000+09:00', 'YYYY-MM-DDhhmmssZZ').format(),
      ratings: {},
      details: {
        definition: '',
        author: {
          id: data.ownerId,
          title: data.ownerNickname || data.ownerName
        }
      }
    })
  })
}

Parser.prototype.requestGomTv = function (cb, id) {
  request('http://www.gomtv.com/' + id, function (err, res, body) {
    if (err) {
      return cb(err)
    }

    var $ = cheerio.load(body)
    var $meta = $('head meta')

    var meta = {}

    $meta.each(function (idx, elem) {
      var $elem = $(elem)
      var property = $elem.attr('property')
      if (property) {
        meta[property] = $elem.attr('content')
      }
    })

    var vidMeta = meta['og:video']

    if (typeof vidMeta === 'undefined') {
      return cb('video.forbidden')
    }

    // 곰티비의 컨탠츠 성격에 따라 맞지 않을수도 있음
    var parts = $('div.video_data span.bu_part')
    var author = {}
    if (parts.length === 5) {
      author.id = parts.eq(2).text()
    }

    var cDate = $('div span.bu_part').eq(1).text()
    cDate = cDate.replace(/\./gi, '')

    var tags = []
    $('div.tag a').each(function (idx, elem) {
      tags.push(elem.children[0].data)
    })

    cb(null, {
      id: id,
      url: meta['og:url'],
      name: meta['og:title'],
      desc: ($('div#video_desc').text() || '').trim(),
      thumb_url: meta['og:image'].replace('type=13', 'type=11'),
      duration: 0,
      ctime: moment(cDate, 'YYYYMMDD').format(),
      ratings: {},
      tags: tags,
      details: {
        definition: '',
        author: author,
        embed: {
          id: vidMeta.split('&h=')[1],
          url: vidMeta
        }
      }
    })
  })
}

Parser.prototype.loadCache = function (cb, cacheId) {
  if (CACHE[cacheId]) {
    cb(null, CACHE[cacheId])
  } else {
    cb(null)
  }
}

Parser.prototype.saveCache = function (cb, cacheId, item, ttl) {
  CACHE[cacheId] = item
  cb();
}

Parser.now = function (ttl) {
  if (typeof ttl === 'undefined' || isNaN(ttl) === true) {
    ttl = 0
  }

  return Math.floor((new Date()).getTime() / 1000) + ttl
}

Parser.parseDuration = function (input) {
  var ptRegex = /^PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?$/
  var coRegex = /((\d+):)?(\d+):(\d+)/
  var hours = 0
  var minutes = 0
  var seconds = 0
  var matches = null

  if (ptRegex.test(input)) {
    matches = ptRegex.exec(input)
    if (matches[1]) {
      hours = Number(matches[1])
    }
    if (matches[2]) {
      minutes = Number(matches[2])
    }
    if (matches[3]) {
      seconds = Number(matches[3])
    }

    return hours * 3600 + minutes * 60 + seconds
  } else if (coRegex.test(input)) {
    matches = coRegex.exec(input)
    if (matches[2]) {
      hours = Number(matches[2])
    }
    if (matches[3]) {
      minutes = Number(matches[3])
    }
    if (matches[4]) {
      seconds = Number(matches[4])
    }

    return hours * 3600 + minutes * 60 + seconds
  }

  return 0
}

module.exports = Parser
