'use strict';

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
    youku: {
        key: ''     // client_id
    },
    ttl: 3600 * 12  // 1 day
});


parser.on('error', function(err) {
    console.error(err);
});

var url = [
    // 'https://www.youtube.com/watch?v=-RWl24TUW6g',
    // 'https://www.youtube.com/watch?t=30&v=nt4fMMCNdRk',
    // 'https://www.youtube.com/watch?v=-RWl24TUW6g',
    // 'https://youtu.be/O5jUi3kBins',
    // 'https://youtu.be/O5jUi3kBins?t=16s',
    // 'https://youtu.be/-RWl24TUW6g',
    // 'https://www.youtube.com/watch?t=28&v=B4k8BiTd-_s',
    // 'https://vimeo.com/60788712',
    // 'https://www.facebook.com/video/embed?video_id=368508506585276',
    // 'https://www.facebook.com/1399785403664362/videos/1428693740773528/',
    // 'http://v.youku.com/v_show/id_XMTMwMDYxMjQxMg==_ev_1.html?from=y1.3-idx-uhome-1519-20887.205805-205902.1-1',
    // 'http://v.youku.com/v_show/id_XMTI5NDcwNjQxNg==.html?f=23007024&from=y1.3-idx-uhome-1519-20887.205908-205909-205916.1-3',
    // 'http://v.youku.com/v_show/id_XMTMwMDgxNTY0NA==.html?f=25924643&ev=3',
    // 'http://player.youku.com/player.php/Type/Folder/Fid/25924643/Ob/1/sid/XMTMwMDgxNTY0NA==/v.swf'
    // 'http://player.youku.com/embed/XMTI5NTcwMDA3Mg=='
    // 'http://dai.ly/x2jvvep',
    // 'http://www.dailymotion.com/video/x2jvvep',
    // 'http://tvcast.naver.com/v/13346/list/1316',
    // 'http://tvcast.naver.com/v/13346',
    // 'http://tvcast.naver.com/v/505592',
    // 'http://tvcast.naver.com/v/582616',
    // 'http://m.tvcast.naver.com/v/582691',
    // 'http://m.tvcast.naver.com/v/582587',
    'http://m.tvcast.naver.com/v/584519',
    // 'http://tvcast.naver.com/v/584455/list/53478'
];

for (var i = 0; i < url.length; i++) {
    // VideoParser.parse(function() {
    //     console.log(arguments);
    // }, url[i]);

    parser.parse(function(err, video) {
        console.log(JSON.stringify(video), err);
    }, url[i]);
}