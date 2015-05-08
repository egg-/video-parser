/**
 * parser.js: parser
 *
 * @version 0.0.1
 * @author egg <i@egg.pe.kr>
 */

'use strict';

var util = require('util');
var events = require('events');
var request = require('request');
var FB = require('fb');
var _ = require('lodash');
var ffmpeg = require('fluent-ffmpeg');
var redis = require('redis');
var defaults = require('merge-defaults');


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
function Parser(config) {
	events.EventEmitter.call(this);

	if (typeof config === 'undefined') {
		throw new Error('required config.');
	}

	config = defaults(config, {
		name: 'video-parser-cache',
		redis: {
			host: '127.0.0.1',
			port: 6379
		},
		youtube: {
			key: ''
		},
		vimeo: {
			access_token: ''
		},
		ttl: 3600 * 12 	// 1 day
	});

	this._client = redis.createClient(config.redis.port, config.redis.host);
	this._client.on('error', (function(self) {
		return function(err) {
			self.emit('error', err);
		};
	})(this));

	this._config = config;
}

util.inherits(Parser, events.EventEmitter);

Parser.SERVICES = [
	{
		provider: 'youtube',
		pattern: /(https?:\/\/)?(www.)?(youtube\.com|youtu\.be|youtube-nocookie\.com)\/(?:embed\/|v\/|watch\?v=|watch\?list=(.*)&v=)?((\w|-){11})(&list=(\w+)&?)?/,
		method: 'loadYoutube',
		index: 5
	},
	{
		provider: 'vimeo',
		pattern: /[\w\W]*vimeo\.com\/([\w\W]*)[\w\W]*/,
		method: 'loadVimeo',
		index: 1
	},
	{
		provider: 'facebook',
		pattern: /(https?:\/\/)?(www.)?(facebook\.com)\/(\d*\/)*(videos?\/(embed\?video_id=)?)(\d+)/,
		method: 'loadFacebook',
		index: 7
	}
];


Parser.prototype.parse = function(cb, url) {
	var matches = null;
	var service = null;

	for (var i = 0, target; i < Parser.SERVICES.length; i++) {
		target = Parser.SERVICES[i];

		if ((matches = target.pattern.exec(url)) !== null) {
			service = target;
			break;
		}
	}

	if (service === null) {
		return cb('video.not_supported_provider');
	}

	this[service.method](function(err, video) {
		if (video) {
			video.provider = service.provider;
		}

		cb(err, err ? null : video);
	}, matches[service.index]);
};

Parser.prototype.load = function(cb, fail, cacheId) {
	var self = this;

	this.loadCache(function(err, item) {
		if (err || item) {
			if (typeof item === 'string') {
				return cb(item);
			}
			return cb(err, item);
		} else {
			fail(function(err, item) {
				self.saveCache(function(err) {
					if (err) {
						self.emit('error', err);
					}
				}, cacheId, typeof err === 'string' ? err : item, self._config.ttl);
				cb(err, item);
			});
		}
	}, cacheId);
};

Parser.prototype.loadYoutube = function(cb, id) {
	var self = this;

	this.load(cb, function(cb) {
		self.requestYoutube(cb, id);
	}, 'youtube_' + id);
};

Parser.prototype.loadYoutubeChannel = function(cb, id) {
	var self = this;

	this.load(cb, function(cb) {
		self.requestYoutubeChannel(cb, id);
	}, 'youtube_channel_' + id);
};


Parser.prototype.loadVimeo = function(cb, id) {
	var self = this;

	this.load(cb, function(cb) {
		self.requestVimeo(cb, id);
	}, 'vimeo_' + id);
};


Parser.prototype.loadFacebook = function(cb, id) {
	var self = this;

	this.load(cb, function(cb) {
		self.requestFacebook(cb, id);
	}, 'facebook_' + id);
};

Parser.prototype.loadMeta = function(cb, cacheId, url) {
	this.load(cb, function(cb) {
		ffmpeg.ffprobe(url, cb);
	}, cacheId);
};

Parser.prototype.requestYoutube = function(cb, id) {
	var self = this;
	var part = 'snippet,contentDetails,status,player';
	var fields = 'items(snippet(title,description,thumbnails,channelId),contentDetails(duration,definition,contentRating),status(embeddable),player(embedHtml))';
	var url = [
		'https://www.googleapis.com/youtube/v3/videos',
		'?id=', id, 
		'&part=',  encodeURIComponent(part),
		'&fields=', encodeURIComponent(fields),
		'&key=', this._config.youtube.key
	].join('');

	request(url, function(err, res, body) {
		if (err) {
			return cb(err);
		}

		var result = JSON.parse(body);
		if (typeof result.items === 'undefined' || result.items.length === 0) {
			return cb('video.not_found');
		}

		var item = result.items[0];

		if (item.status.embeddable === false) {
			return cb('video.forbidden');
		}

		var snippet = item.snippet;
		var details = item.contentDetails;
		var ratings = typeof details.contentRating !== 'undefined' ? details.contentRating : {};
		// YouTube가 연령 제한 콘텐츠를 식별하기 위해 사용하는 등급입니다.
		if (typeof ratings.ytRating !== 'undefined' && ratings.ytRating === 'ytAgeRestricted') {
			return cb('video.age_restricted');
		}

		self.loadYoutubeChannel(function(err, channel) {
			if (err) {
				return cb(err);
			}

			cb(err, {
				id: id,
				url: 'https://www.youtube.com/watch?v=' + id,
				name: snippet.title,
				desc: snippet.description,
				thumb_url: snippet.thumbnails.medium.url,
				duration: Parser.parseDuration(details.duration),
				ratings: ratings,
				details: {
					definition: details.definition,
					author: channel
				}
			});

		}, snippet.channelId);
	});
};

Parser.prototype.requestYoutubeChannel = function(cb, channelId) {
	var part = 'snippet';
	var fields = 'items(snippet(title))';
	var url = [
		'https://www.googleapis.com/youtube/v3/channels',
		'?id=', channelId, 
		'&part=', encodeURIComponent(part), 
		'&fields=', encodeURIComponent(fields),
		'&key=', this._config.youtube.key
	].join('');

	request(url, function(err, res, body) {
		if (err) {
			return cb(err);
		}

		var result = JSON.parse(body);
		if (typeof result.items === 'undefined' || result.items.length === 0) {
			return cb('video.channel_not_found');
		}

		cb(err, {
			id: channelId,
			title: result.items[0].snippet.title
		});
	});
};

Parser.prototype.requestVimeo = function(cb, id) {
	var url = 'https://api.vimeo.com/videos/' + id;

	request({
		url: url,
		headers: {
			// manage: https://developer.vimeo.com/apps/53880#authenticationn
			'Authorization': 'Bearer ' + this._config.vimeo.access_token
		}
	}, function(err, res, body) {
		if (err) {
			return cb(err);
		}

		var result = JSON.parse(body);
		if (typeof result.error !== 'undefined') {
			return cb(new Error(result.error));
		}

		cb(err, {
			id: id,
			url: 'https://vimeo.com/' + id,
			name: result.name,
			desc: result.description,
			thumb_url: result.pictures.sizes[2].link,
			duration: result.duration,
			ratings: result.content_rating,
			details: {
				definition: '',
				author: {
					id: result.user.uri.replace('/users/', ''),
					title: result.user.name
				}
			}
		});
	});
};

Parser.prototype.requestFacebook = function(cb, id) {
	var self = this;
	FB.napi(id, function(err, res) {
		if (err) {
			return cb('video.invalid_url');
		}

		if (res.published === false) {
			return cb('video.forbidden');
		}

		var thumbnail = _.first(_.filter(res.format, function(item) {
			return item.width > 400;
		}));

		self.loadMeta(function(err, meta) {
			if (err) {
				return cb(err);
			}

			cb(err, {
				id: id,
				url: res.source,
				name: res.description,
				desc: res.description,
				thumb_url: thumbnail.picture || res.picture,
				duration: Math.round(meta.format.duration),
				ratings: null,
				details: {
					definition: '',
					author: {
						id: res.from.id,
						title: res.from.name
					}
				}
			});
		}, 'facebook_meta_' + id, res.source);
	});
};


Parser.prototype.loadCache = function(cb, cacheId) {
	this._client.hget(this._config.name, cacheId, function(err, res) {
		if (err || res === null) {
			return cb(err, null);
		}

		var data = JSON.parse(res);
		cb(null, data.ttl < Parser.now() ? null : data.item);
	});
};

Parser.prototype.saveCache = function(cb, cacheId, item, ttl) {
	if (typeof ttl === 'undefined' || isNaN(ttl) === true) {
		ttl = 3600 * 24 * 7;
	}
	this._client.hset(this._config.name, cacheId, JSON.stringify({
		item: item,
		ttl: Parser.now(ttl)
	}), cb);
};

Parser.now = function(ttl) {
	if (typeof ttl === 'undefined' || isNaN(ttl) === true) {
		ttl = 0;
	}

	return Math.floor((new Date()).getTime() / 1000) + ttl;
};

Parser.parseDuration = function(input) {
	var regex = /^PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?$/;
	var hours = 0, minutes = 0, seconds = 0;

	if (regex.test(input)) {
		var matches = regex.exec(input);
		if (matches[1]) {
			hours = Number(matches[1]);
		}
		if (matches[2]) {
			minutes = Number(matches[2]);
		}
		if (matches[3]) {
			seconds = Number(matches[3]);
		}

		return hours * 3600  + minutes * 60 + seconds;
	}

	return 0;
};

module.exports = Parser;