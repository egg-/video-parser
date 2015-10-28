# video-parser

[![version](https://img.shields.io/npm/v/video-parser.svg) ![download](https://img.shields.io/npm/dm/video-parser.svg)](https://www.npmjs.com/package/video-parser)

Extract video information by parsing the url.
Important: If you find compatibility issues, check the bug reporting page.

### Support provider

* [youtube](https://www.youtube.com/)
* [vimeo](https://vimeo.com/)
* facebook video: 
* [youku](http://www.youku.com/)
* [dailymotion](http://www.dailymotion.com/kr)
* [naver tvcast](http://tvcast.naver.com) - It can be stopped unexpectedly due to parse the data from the site.

## Dependencies

### ffmpeg

* get metadata of custom video.
* [http://www.ffmpeg.org/](http://www.ffmpeg.org/)

```
$ brew install ffmpeg --with-openssl
```

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
    youku: {
        key: ''
    }
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
    'https://www.facebook.com/1399785403664362/videos/1428693740773528/',
    'http://v.youku.com/v_show/id_XMTMwMDYxMjQxMg==_ev_1.html?from=y1.3-idx-uhome-1519-20887.205805-205902.1-1',
    'http://dai.ly/x2jvvep',
    'http://www.dailymotion.com/video/x2jvvep',
    'http://tvcast.naver.com/v/584455'
];

for (var i = 0; i < url.length; i++) {
    parser.parse(function(err, video) {
        console.log(video);
    }, url[i]);
}

```

## Format

```json
{
   "id":"-RWl24TUW6g",
   "url":"https://www.youtube.com/watch?v=-RWl24TUW6g",
   "name":"Earned It - The Weeknd - Kina Grannis & MAX & KHS Cover",
   "desc":"Grab this on iTunes here: https://itunes.apple.com/us/album/earned-it-single/id994064741\nCheck out our epic song with Coke Bottles!! https://www.youtube.com/watch?v=ZzuRvzsNpTU\nAnd... I'm coming to Singapore, Thailand, and Japan! Stay tuned for Meet and Greet info :)\n_______________\n\nGET IN TOUCH!\n\nKURT:\nFacebook: http://www.facebook.com/kurthugoschneider\nTwitter: http://www.twitter.com/kurthschneider\n\nMAX:\nFacebook: http://on.fb.me/wZYjB3\nTwitter: http://www.twitter.com/maxgschneider\nYouTube: http://www.youtube.com/user/MaxSchneider1\n\nKINA:\nFacebook: https://www.facebook.com/kinagrannis\nTwitter: https://twitter.com/kinagrannis\nYoutube: https://www.youtube.com/user/kinagrannis\n\n_______________\n\"Earned It (Fifty Shades of Grey)” – originally by The Weeknd\nWritten by: Abel Tesfaye, Stephan Moccio, Jason Quenneville & Ahmad Balshe\nPublished by: Universal Music Corp, WB Music Corp & Songs of SMP",
   "thumb_url":"https://i.ytimg.com/vi/-RWl24TUW6g/mqdefault.jpg",
   "duration":186,
   "ratings":{

   },
   "details":{
      "definition":"hd",
      "author":{
         "id":"UCplkk3J5wrEl0TNrthHjq4Q",
         "title":"Kurt Hugo Schneider"
      }
   },
   "provider":"youtube"
}

{
   "id":"60788712",
   "url":"https://vimeo.com/60788712",
   "name":"Mi niña mi vida",
   "desc":"A man moves amidst the noisy crowds at an amusement park, accompanied only by a large pink stuffed toy. Encircled by the sounds and incessant movements of the rides, this strange duo anchors long sequence shots that navigate the mechanical rhythms and decor of the park.\n\nUn homme seul et son gros ours en peluche rose forment un étrange duo parmi la foule d’un parc d’amusement. Isolés par les bruits et le mouvement incessant des manèges qui les entourent, ils sont le point d'ancrage de longs plans séquences rythmés par ce décor mécanique.",
   "thumb_url":"https://i.vimeocdn.com/video/462264450_295x166.jpg",
   "duration":1150,
   "ratings":[
      "safe"
   ],
   "details":{
      "definition":"",
      "author":{
         "id":"3896730",
         "title":"Yan Giroux"
      }
   },
   "provider":"vimeo"
}

{
   "id":"1428693740773528",
   "url":"https://fbcdn-video-l-a.akamaihd.net/hvideo-ak-xpa1/v/t42.1790-2/11223180_1428693800773522_105807484_n.mp4?efg=eyJxZSI6ImZiY2RuX3ZpZGVvX3JhdGVsaW1pdF9yb2xsb3V0Mix2X3JvbGxvdXQiLCJybHIiOjU0NSwicmxhIjo1MTJ9&rl=545&vabr=303&oh=d5c0d0a36c5a75520758969db22cc2d2&oe=5556F7CA&__gda__=1431753137_8141cd5880d195db73c20e5b26f650ea",
   "name":"TOSQ",
   "desc":"삼둥이도 적다. 사둥이는 되야지\n책상과 의자세트도 직접 제작한듯ㅋㅋㅋ \n#baby #Laughing \n  \n  \n  \n  \n  \n#귀요미 더보기 -> http://tosq.tv/pd/babies \n원본링크 https://www.youtube.com/watch?v=zZH0sNsaAz4",
   "thumb_url":"https://fbcdn-vthumb-a.akamaihd.net/hvthumb-ak-xtf1/v/t15.0-10/11189097_1428693840773518_1904978325_n.jpg?oh=b59e98b9153dff06337c96d0514b288c&oe=55C3F8AA&__gda__=1438973665_0aa297242e5a94ac16bdcd75312e3452",
   "duration":66,
   "ratings":null,
   "details":{
      "definition":"",
      "author":{
         "id":"1399785403664362",
         "title":"TOSQ"
      }
   },
   "provider":"facebook"
}

{
    "id": "XMTI5NTcwMDA3Mg==",
    "url": "http://v.youku.com/v_show/id_XMTI5NTcwMDA3Mg==.html",
    "name": "李湘隔空合唱邓丽君 花千骨东方彧卿深情献唱",
    "desc": "",
    "thumb_url": "http://g2.ykimg.com/1100641F4655B76A9B6A612E697BDCD5D108B3-6D55-8549-378A-C357FE00D212",
    "duration": "111.41",
    "ctime": "2015-07-28T19:15:32+09:00",
    "details": {
        "definition": "",
        "author": {
            "id": "778664924",
            "title": "歌手是谁"
        }
    },
    "provider": "youku"
}

{
    "id": "x2jvvep",
    "url": "http://www.dailymotion.com/video/x2jvvep_coup-incroyable-pendant-un-match-de-ping-pong_tv",
    "name": "Coup incroyable pendant un match de ping-pong",
    "desc": "",
    "thumb_url": "http://s2.dmcdn.net/JdVUk/x720-jcH.jpg",
    "duration": 12,
    "ctime": "2015-03-19T04:15:48+09:00",
    "ratings": {},
    "details": {
        "definition": "",
        "author": {
            "id": "x1gyl14",
            "title": "BuzzVid"
        }
    },
    "provider": "dailymotion"
}

{
    "id": "582603",
    "url": "http://tvcast.naver.com/v/582603",
    "name": "한국생활에 정 든 추사랑 “한국서 살고싶어”",
    "desc": "슈퍼맨이 돌아왔다 | 한국생활에 정 든 추사랑 “한국서 살고싶어”",
    "thumb_url": "https://phinf.pstatic.net/tvcast/20151025_190/AkWJa_1445766984283jVYYH_PNG/2Do9GAqaIuXP.png?type=f640",
    "duration": 113.39,
    "ctime": "2015-10-25T00:00:00+09:00",
    "ratings": {},
    "details": {
        "definition": "",
        "author": {
            "id": "wrappinguser16",
            "title": "슈퍼맨이 돌아왔다"
        },
        "naver": {
            "type": "rmc",
            "id": "9BC32CD10418DA3E3507824EBBE544930BA0",
            "key": "V12633341205ea37bf048329efcd1e2f1382a611bbd1d85bc56f8329efcd1e2f1382a"
        }
    },
    "provider": "navertvcast"
}
```


## Release History

See the [changelog](CHANGELOG.md)


## LICENSE

video-parser is licensed under the MIT license.