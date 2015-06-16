var VideoParser = require('./');

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
    console.error(err);
});

var url = [
    'https://www.youtube.com/watch?v=-RWl24TUW6g',
    'https://youtu.be/-RWl24TUW6g',
    'https://vimeo.com/60788712',
    'https://www.facebook.com/video/embed?video_id=368508506585276',
    'https://www.facebook.com/1399785403664362/videos/1428693740773528/'
];

for (var i = 0; i < url.length; i++) {
    parser.parse(function(err, video) {
        console.log(JSON.stringify(video));
    }, url[i]);
}