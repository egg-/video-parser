# video-parser

## Usage

```javascript
var VideoParser = require('video-parser');

var parser = new VideoParser({
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
    ttl: 3600 * 12  // 1 day
});

parser.on('error', function(err) {
    api.notifier.error('parser error', err);
});

router.route('/validate')
.get(function(req, res, next) {
    parser.parse(function(err, video) {
        if (err) {
            return api.error(err, req, res);
        }
        res.locals.items = [video];
        next();
    }, req.query.url);
}, function(req, next) {
    api.send(req, res, {
        items: res.locals.items
    }, true);
});

```

## LICENSE

log-notifier is licensed under the MIT license.