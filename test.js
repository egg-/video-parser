'use strict'

var VideoParser = require('./')

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
    key: '' // client_id
  },
  tudou: {
    key: '' // app_key
  },
  ttl: 1 // 3600 * 12  // 1 day
})

parser.on('error', function (err) {
  console.error(err)
})

var url = [
  // 'https://www.youtube.com/watch?v=-RWl24TUW6g',
  // 'https://www.youtube.com/watch?t=30&v=nt4fMMCNdRk',
  // 'https://www.youtube.com/watch?v=-RWl24TUW6g',
  // 'https://youtu.be/O5jUi3kBins',
  // 'https://youtu.be/O5jUi3kBins?t=16s',
  // 'https://youtu.be/-RWl24TUW6g',
  // 'https://www.youtube.com/watch?t=28&v=B4k8BiTd-_s',
  // 'https://vimeo.com/60788712',

  // facebook
  // 'https://www.facebook.com/video/embed?video_id=368508506585276',
  // 'https://www.facebook.com/1399785403664362/videos/1428693740773528/',
  // 'https://www.facebook.com/snackk100/videos/754790044667598/?permPage=1',
  // 'https://www.facebook.com/insight.co.kr/videos/vb.374726359324617/907652546031993/?type=2&theater',
  // 'https://www.facebook.com/Jrockradio/videos/vb.102198813200663/880536688700201/?type=2&theater',
  // 'https://www.facebook.com/ICMSChairman/videos/vb.595785693780145/1089273701098006/?type=2&theater',
  // 'https://www.facebook.com/huffpostkorea/videos/615775111903484/?permPage=1',
  // 'https://www.facebook.com/snackk100/videos/vb.713427005470569/765726663573936/?type=2&theater',

  // 'http://v.youku.com/v_show/id_XMTMwMDYxMjQxMg==_ev_1.html?from=y1.3-idx-uhome-1519-20887.205805-205902.1-1',
  // 'http://v.youku.com/v_show/id_XMTI5NDcwNjQxNg==.html?f=23007024&from=y1.3-idx-uhome-1519-20887.205908-205909-205916.1-3',
  // 'http://v.youku.com/v_show/id_XMTMwMDgxNTY0NA==.html?f=25924643&ev=3',
  // 'http://player.youku.com/player.php/Type/Folder/Fid/25924643/Ob/1/sid/XMTMwMDgxNTY0NA==/v.swf'
  // 'http://player.youku.com/embed/XMTI5NTcwMDA3Mg=='
  // 'http://dai.ly/x2jvvep',
  // 'http://www.dailymotion.com/video/x2jvvep',

  // naver tvcast
  // 'http://tv.naver.com/v/1240332/list/67096',
  // 'http://tv.naver.com/v/1205110',
  // 'http://tv.naver.com/v/505592',
  // 'http://tv.naver.com/v/582616',
  // 'http://m.tv.naver.com/v/582691',
  // 'http://m.tv.naver.com/v/582587',
  // 'http://tv.naver.com/v/582590',
  // 'http://tv.naver.com/v/584455/list/53478',
  // 'http://tv.naver.com/v/797661',
  // 'http://tvcast.naver.com/v/1240332/list/67096',
  // 'http://tvcast.naver.com/v/1205110',
  // 'http://tvcast.naver.com/v/505592',
  // 'http://tvcast.naver.com/v/582616',
  // 'http://m.tvcast.naver.com/v/582691',
  // 'http://m.tvcast.naver.com/v/582587',
  // 'http://tvcast.naver.com/v/582590',
  // 'http://tvcast.naver.com/v/584455/list/53478',
  // 'http://tvcast.naver.com/v/797661',
  // 'http://tv.naver.com/v/1371804',
  // 'http://tv.naver.com/v/1341505'

  // rutube
  // 'http://rutube.ru/video/2a39043b2108428a150fa27376adbea2/',
  // 'http://video.rutube.ru/7508261',
  // 'rutube.ru/play/embed/7962382',

  // daum tvpot
  // 'http://m.tvpot.daum.net/v/72525651',
  // 'http://tvpot.daum.net/mypot/View.do?clipid=72525651&ownerid=45x1okb1If50',
  // 'http://tvpot.daum.net/v/sb0fdSwSjVJfS6xf6SixjtJ',
  // 'http://tvpot.daum.net/mypot/View.do?ownerid=45x1okb1If50&playlistid=6064073&clipid=72525613',
  // 'http://tvpot.daum.net/clip/ClipView.do?clipid=72589907',
  // 'http://tvpot.daum.net/v/34RNu2rwWe8%24',
  // 'http://tvpot.daum.net/mypot/View.do?clipid=72583600&ownerid=mRlSExWR4-Q0'

  // todou
  // 'http://www.tudou.com/programs/view/uKg4c5O0YyQ/'
  // 'http://www.tudou.com/v/hCgJVRch33w/&rpid=993090858&resourceId=993090858_04_05_99/v.swf'
  // 'http://www.tudou.com/v/hCgJVRch33w/&bid=05&rpid=993090858&resourceId=993090858_05_05_99/v.swf'

  // gomtv
  // 'http://www.gomtv.com/14692214',
  // 'http://www.gomtv.com/14683612',
  // 'http://www.gomtv.com/14692650'
]

for (var i = 0; i < url.length; i++) {
  VideoParser.parse(function () {
    console.log(arguments)
  }, url[i])

  parser.parse(function (err, video) {
    console.log(JSON.stringify(video), err)
  }, url[i])
}

// test duration
var durations = [
  {
    txt: 'PT15M51S',
    val: 951
  },
  {
    txt: '01:22:33',
    val: 4953
  },
  {
    txt: '22:33',
    val: 1353
  }
]
console.log('Test parseDuration')
for (var j = 0, d = null; j < durations.length; j++) {
  d = durations[j]
  console.log(d.txt + ': ', d.val === VideoParser.parseDuration(d.txt))
}
