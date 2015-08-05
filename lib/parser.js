/**
 * parser.js: parser
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
var moment = require('moment');


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
		provider: 'facebook',
		pattern: /(https?:\/\/)?(www.)?(facebook\.com)\/(\d*\/)*(videos?\/(embed\?video_id=)?)(\d+)/,
		method: 'loadFacebook',
		index: 7
	},
	{
		// https://regex101.com/r/yI6pN3/2
		provider: 'youku',
		pattern: /(https?:\/\/)?(v|player)\.youku\.com\/(v_show|player\.php|embed)(\/.*sid)?\/(id_)?(\w+=*)|(\w+)/,
		method: 'loadYouku',
		index: 6
	}

// http://v.youku.com/v_show/id_XMTMwMDYxMjQxMg==_ev_1.html?from=y1.3-idx-uhome-1519-20887.205805-205902.1-1
// http://v.youku.com/v_show/id_XMjMxOTQyOTQw.html?from=y1.6-97.3.1.a44aa406e0c711df97c0
// http://v.youku.com/v_show/id_XMTI5Mjg5NjE4MA==.html?from=y1.3-idx-uhome-1519-20887.205921-205922-205810-205923.1-1
// http://v.youku.com/v_show/id_XMTI5Mjg5NjE4MA==.html
// http://player.youku.com/player.php/sid/XMTI5Mjg5NjE4MA==/v.swf
// http://player.youku.com/player.php/sid/XMTI5Mjg5NjE4MA==/v.swf
// http://player.youku.com/embed/XMTI5Mjg5NjE4MA==
// http://player.youku.com/player.php/Type/Folder/Fid/25924643/Ob/1/sid/XMTMwMDgxNTY0NA==/v.swf
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

Parser.prototype.loadYouku = function(cb, id) {
	var self = this;

	this.load(cb, function(cb) {
		self.requestYouku(cb, id);
	}, 'youku_' + id);
};

Parser.prototype.requestYoutube = function(cb, id) {
	var self = this;
	var part = 'snippet,contentDetails,status,player';
	var fields = 'items(snippet(title,description,thumbnails,channelId,publishedAt),contentDetails(duration,definition,contentRating),status(embeddable),player(embedHtml))';
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
				ctime: moment(snippet.publishedAt).format(),
				ratings: ratings,
				details: {
					definition: details.definition,
					author: channel
				}
			});

		}, snippet.channelId);
	});
};

Parser.prototype.requestYoutubePlayList = function(cb, id, opt) {
	var part = 'snippet,contentDetails,status';
	var fields = 'items(snippet(title,description,thumbnails,resourceId,channelId,channelTitle),status(privacyStatus)),pageInfo,nextPageToken';
	var url = [
		'https://www.googleapis.com/youtube/v3/playlistItems',
		'?playlistId=', id, 
		'&part=',  encodeURIComponent(part),
		'&fields=', encodeURIComponent(fields),
		'&key=', this._config.youtube.key
	];

	if (opt) {
		if (opt.token) {
			url.push('&pageToken=' + opt.token);
		}
		if (opt.limit) {
			url.push('&maxResults=' + opt.limit);
		}
	}

	request(url.join(''), function(err, res, body) {
		if (err) {
			return cb(err);
		}

		var result = JSON.parse(body);
		if (typeof result.items === 'undefined' || result.items.length === 0) {
			return cb('video.not_found');
		}

		var items = [];
		for (var i = 0, item = null, snippet = null; i < result.items.length; i++) {
			item = result.items[i];

			if (item.status.privacyStatus !== 'public') {
				continue;
			}

			snippet = item.snippet;

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
			});
		}
		
		cb(null, items, {
			token: result.nextPageToken,
			limit: result.pageInfo.resultsPerPage,
			totalcount: result.pageInfo.totalResults
		});
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
			ctime: moment(result.created_time).format(),
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

		if ( ! thumbnail) {
			thumbnail = _.last(res.format);
		}

		self.loadMeta(function(err, meta) {
			if (err) {
				return cb(err);
			}

			cb(err, {
				id: id,
				url: res.source,
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
					}
				}
			});
		}, 'facebook_meta_' + id, res.source);
	});
};

Parser.prototype.requestYouku = function(cb, id) {
	var url = ['https://openapi.youku.com/v2/videos/show.json?',
		'client_id=' + this._config.youku.key,
		'&video_id=' + id
	].join('')

	request({
		url: url
	}, function(err, res, body) {
		if (err) {
			return cb(err);
		}

		var result = JSON.parse(body);
		if (typeof result.error !== 'undefined') {
			return cb(new Error(result.error));
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
		});
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